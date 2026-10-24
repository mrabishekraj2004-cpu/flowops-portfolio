import { db } from "./db";
import { Prisma } from "../generated/prisma/client";
import { actor, admin, requester, visible, AppError } from "./access";
import { valueSchema, validate, decimal, transition } from "./quotation";
import { storage, MAX_FILE } from "./storage";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { validateDestination } from "./webhooks";
const json = (v: unknown) => v as Prisma.InputJsonValue;
type Tx = Prisma.TransactionClient;
export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let n = 0; ; n++) {
    try {
      return await db.$transaction(fn, { timeout: 20000 });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034" &&
        n < 3
      )
        continue;
      throw e;
    }
  }
}
async function lock(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "Request" WHERE id=${id} FOR UPDATE`;
  const r = await tx.request.findUnique({ where: { id } });
  if (!r) throw new AppError(404, "Request not found.");
  return r;
}
export async function audit(
  tx: Tx,
  requestId: string,
  actorId: string,
  stage: string,
  detail: string,
) {
  await tx.audit.create({ data: { requestId, actorId, stage, detail } });
}
export async function bootstrap(id?: string) {
  const u = await actor(id);
  const where =
    u.role === "ADMIN"
      ? {}
      : u.role === "REVIEWER"
        ? { assignments: { some: { reviewerId: u.id } } }
        : { ownerId: u.id };
  const [requests, categories, notifications, policy] = await Promise.all([
    db.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        purchase: true,
        owner: { select: { name: true } },
        assignments: { select: { reviewerId: true, version: true } },
      },
    }),
    db.category.findMany({ where: { active: true } }),
    db.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.policy.findUnique({ where: { id: "main" } }),
  ]);
  return {
    user: { id: u.id, name: u.name, role: u.role },
    requests: requests.filter(
      (r) =>
        u.role !== "REVIEWER" ||
        r.assignments.some(
          (a) => a.reviewerId === u.id && a.version === r.version,
        ),
    ),
    categories,
    notifications,
    baseCurrency: policy?.baseCurrency ?? "LKR",
    provider:
      process.env.EXTRACTION_PROVIDER === "live"
        ? "Live AI provider (review required)"
        : "Deterministic mock · no live AI",
    publicDemo: process.env.PUBLIC_DEMO === "true",
  };
}
export async function upload(
  id: string | undefined,
  input: {
    title: string;
    categoryId: string;
    name: string;
    mime: string;
    bytes: Uint8Array;
  },
) {
  const u = await actor(id);
  requester(u);
  if (
    input.mime !== "application/pdf" ||
    !input.name.toLowerCase().endsWith(".pdf") ||
    input.bytes.length > MAX_FILE
  )
    throw new AppError(400, "Upload a PDF of at most 5 MB.");
  const title = z.string().trim().min(3).max(160).parse(input.title);
  if (
    !(await db.category.findFirst({
      where: { id: input.categoryId, active: true },
    }))
  )
    throw new AppError(400, "Choose an active category.");
  const pending = await db.request.count({
    where: {
      ownerId: u.id,
      state: {
        in: ["PROCESSING", "PROCESSING_FAILED", "NEEDS_REVIEW", "DRAFT"],
      },
    },
  });
  if (pending >= 30)
    throw new AppError(429, "Finish existing drafts before uploading more.");
  let file;
  try {
    file = await storage.put(input.bytes);
  } catch {
    throw new AppError(400, "Invalid PDF signature or size.");
  }
  try {
    return await transaction(async (tx) => {
      const r = await tx.request.create({
        data: {
          ownerId: u.id,
          categoryId: input.categoryId,
          title,
          state: "PROCESSING",
          originalName: input.name
            .replace(/[^a-zA-Z0-9 ._-]/g, "_")
            .slice(0, 120),
          storageKey: file.key,
          sha256: file.sha256,
          size: input.bytes.length,
        },
      });
      await tx.job.create({
        data: { key: "extract:" + r.id, type: "EXTRACT", requestId: r.id },
      });
      await audit(
        tx,
        r.id,
        u.id,
        "QUEUED",
        "Private PDF stored; extraction queued.",
      );
      return r;
    });
  } catch (e) {
    await storage.remove(file.key);
    throw e;
  }
}
export async function detail(id: string | undefined, requestId: string) {
  const u = await actor(id);
  await visible(u, requestId);
  return db.request.findUnique({
    where: { id: requestId },
    include: {
      category: true,
      owner: { select: { id: true, name: true } },
      assignments: {
        include: { reviewer: { select: { id: true, name: true } } },
      },
      decisions: { include: { reviewer: { select: { name: true } } } },
      revisions: { orderBy: { version: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      jobs: { include: { attemptsLog: { orderBy: { startedAt: "asc" } } } },
      purchase: { include: { outbox: { include: { deliveries: {orderBy:{createdAt:"asc"}} } } } },
    },
  });
}
export async function edit(
  id: string | undefined,
  requestId: string,
  input: unknown,
) {
  const u = await actor(id);
  const v = z
    .object({
      data: valueSchema,
      version: z.number().int().positive(),
      reason: z.string().trim().min(5).max(500),
    })
    .strict()
    .parse(input);
  return transaction(async (tx) => {
    const r = await lock(tx, requestId);
    if (r.ownerId !== u.id)
      throw new AppError(403, "Only the requester can correct this document.");
    if (
      ![
        "NEEDS_REVIEW",
        "CHANGES_REQUESTED",
        "PENDING_APPROVAL",
        "PROCESSING_FAILED",
      ].includes(r.state)
    )
      throw new AppError(409, "This request can no longer be edited.");
    if (r.version !== v.version)
      throw new AppError(
        409,
        "Another change was saved. Reload before editing.",
      );
    const policy = await tx.policy.findUniqueOrThrow({ where: { id: "main" } });
    const issues = validate(v.data, policy.baseCurrency);
    const version = r.version + 1;
    await tx.revision.create({
      data: {
        requestId,
        version,
        actorId: u.id,
        data: json(v.data),
        issues: json(issues),
        reason: v.reason,
      },
    });
    await audit(
      tx,
      requestId,
      u.id,
      "REVIEW",
      "Human corrections saved as revision " +
        version +
        ". Previous approvals invalidated for resubmission.",
    );
    return tx.request.update({
      where: { id: requestId },
      data: {
        version,
        currentData: json(v.data),
        validation: json(issues),
        state: "NEEDS_REVIEW",
        submittedVersion: null,
        requiredApprovals: 0,
      },
    });
  });
}
export async function submit(id: string | undefined, requestId: string) {
  const u = await actor(id);
  requester(u);
  return transaction(async (tx) => {
    const r = await lock(tx, requestId);
    if (r.ownerId !== u.id)
      throw new AppError(403, "Only the requester may submit.");
    if (r.state !== "NEEDS_REVIEW")
      throw new AppError(
        409,
        "Save and validate your review before submitting.",
      );
    const policy = await tx.policy.findUniqueOrThrow({ where: { id: "main" } });
    const data = valueSchema.parse(r.currentData);
    const issues = validate(data, policy.baseCurrency);
    if (issues.length)
      throw new AppError(
        400,
        "Resolve all validation issues before submitting.",
      );
    if (
      !(await tx.revision.findFirst({
        where: { requestId, version: r.version },
      }))
    )
      throw new AppError(
        400,
        "Human review and an explicit save are required.",
      );
    const required = decimal(data.grandTotal).gte(policy.threshold.toString())
      ? 2
      : 1;
    const ids = z.array(z.string()).parse(policy.reviewerIds);
    const reviewers = await tx.user.findMany({
      where: {
        id: { in: ids },
        active: true,
        role: "REVIEWER",
        NOT: { id: u.id },
      },
      orderBy: { id: "asc" },
    });
    if (reviewers.length < required)
      throw new AppError(
        409,
        "Not enough independent reviewers are configured. Ask the administrator.",
      );
    for (const reviewer of ids
      .map((id) => reviewers.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .slice(0, required)) {
      await tx.assignment.upsert({
        where: {
          requestId_reviewerId_version: {
            requestId,
            reviewerId: reviewer.id,
            version: r.version,
          },
        },
        create: { requestId, reviewerId: reviewer.id, version: r.version },
        update: {},
      });
      await tx.notification.upsert({
        where: {
          key: "assigned:" + requestId + ":" + r.version + ":" + reviewer.id,
        },
        update: {},
        create: {
          key: "assigned:" + requestId + ":" + r.version + ":" + reviewer.id,
          userId: reviewer.id,
          requestId,
          message: "A quotation needs your independent review.",
        },
      });
    }
    transition(r.state, "PENDING_APPROVAL");
    await audit(
      tx,
      requestId,
      u.id,
      "APPROVAL",
      "Submitted revision " +
        r.version +
        "; " +
        required +
        " independent approval(s) required.",
    );
    return tx.request.update({
      where: { id: requestId },
      data: {
        state: "PENDING_APPROVAL",
        requiredApprovals: required,
        submittedVersion: r.version,
      },
    });
  });
}
export async function decide(
  id: string | undefined,
  requestId: string,
  input: unknown,
) {
  const u = await actor(id);
  const v = z
    .object({
      action: z.enum(["APPROVE", "REJECT", "CHANGES"]),
      reason: z.string().trim().min(5).max(1000),
      version: z.number().int().positive(),
    })
    .strict()
    .parse(input);
  return transaction(async (tx) => {
    const r = await lock(tx, requestId);
    if (r.ownerId === u.id)
      throw new AppError(403, "You cannot approve your own request.");
    if (
      u.role !== "REVIEWER" ||
      !(await tx.assignment.findFirst({
        where: { requestId, reviewerId: u.id, version: r.version },
      }))
    )
      throw new AppError(
        403,
        "Only an assigned independent reviewer can decide.",
      );
    if (r.version !== v.version)
      throw new AppError(409, "This revision has changed. Reload.");
    const prior = await tx.decision.findFirst({
      where: { requestId, reviewerId: u.id, version: r.version },
    });
    if (prior) {
      if (prior.action === v.action && prior.reason === v.reason) return r;
      throw new AppError(
        409,
        "A decision already exists for this reviewer and revision.",
      );
    }
    if (r.state !== "PENDING_APPROVAL")
      throw new AppError(409, "This request is not awaiting approval.");
    await tx.decision.create({
      data: {
        requestId,
        reviewerId: u.id,
        version: r.version,
        action: v.action,
        reason: v.reason,
      },
    });
    await audit(tx, requestId, u.id, "APPROVAL", v.action + ": " + v.reason);
    if (v.action !== "APPROVE") {
      const state = v.action === "CHANGES" ? "CHANGES_REQUESTED" : "REJECTED";
      transition(r.state, state);
      await tx.notification.create({
        data: {
          key: "decision:" + requestId + ":" + r.version + ":" + u.id,
          userId: r.ownerId,
          requestId,
          message:
            state === "REJECTED"
              ? "Quotation rejected: " + v.reason
              : "Changes requested: " + v.reason,
        },
      });
      return tx.request.update({ where: { id: requestId }, data: { state } });
    }
    const count = await tx.decision.count({
      where: { requestId, version: r.version, action: "APPROVE" },
    });
    if (count < r.requiredApprovals) return r;
    const policy = await tx.policy.findUniqueOrThrow({ where: { id: "main" } });
    const data = valueSchema.parse(r.currentData);
    if (validate(data, policy.baseCurrency).length)
      throw new AppError(
        409,
        "Validation changed; request must be reviewed again.",
      );
    transition(r.state, "APPROVED");
    const purchase = await tx.purchase.create({
      data: {
        requestId,
        version: r.version,
        currency: data.currency!,
        total: data.grandTotal!,
        snapshot: json(data),
      },
    });
    await audit(
      tx,
      requestId,
      u.id,
      "RECORD_CREATION",
      "Internal purchase request PR-" +
        purchase.number +
        " created. No order or payment placed.",
    );
    await tx.notification.create({
      data: {
        key: "purchase:" + purchase.id,
        userId: r.ownerId,
        requestId,
        message:
          "Approved. Internal purchase request PR-" +
          purchase.number +
          " created.",
      },
    });
    await tx.outbox.create({
      data: {
        eventId: randomUUID(),
        purchaseId: purchase.id,
        destination: policy.webhookUrl ?? "test://flowops",
      },
    });
    return tx.request.update({
      where: { id: requestId },
      data: { state: "APPROVED" },
    });
  });
}
export async function administration(id?: string) {
  const u = await actor(id);
  admin(u);
  const [users, categories, policy, jobs, outbox, events, receiver] =
    await Promise.all([
      db.user.findMany({
        select: { id: true, name: true, email: true, role: true, active: true },
      }),
      db.category.findMany(),
      db.policy.findUnique({ where: { id: "main" } }),
      db.job.findMany({
        include: { attemptsLog: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.outbox.findMany({
        include: { deliveries: {orderBy:{createdAt:"asc"}} },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.audit.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.receiverEvent.findMany({ take: 30 }),
    ]);
  return {
    users,
    categories,
    policy,
    jobs,
    outbox,
    events,
    receiver,
    simulationEnabled:
      process.env.NODE_ENV !== "production" &&
      process.env.PUBLIC_DEMO !== "true" &&
      process.env.ALLOW_DEV_SIMULATION === "true",
  };
}
export async function configure(id: string | undefined, input: unknown) {
  const u = await actor(id);
  admin(u);
  if (process.env.PUBLIC_DEMO === "true")
    throw new AppError(403, "Public demo administrative changes are disabled.");
  const v = z
    .discriminatedUnion("action", [
      z.object({
        action: z.literal("policy"),
        threshold: z.string(),
        reviewerIds: z.array(z.string()).min(2).max(10),
        webhookUrl: z.string().max(1000).nullable(),
      }),
      z.object({
        action: z.literal("category"),
        name: z.string().trim().min(2).max(80),
        id: z.string().optional(),
        active: z.boolean().optional(),
      }),
      z.object({
        action: z.literal("role"),
        id: z.string(),
        role: z.enum(["REQUESTER", "REVIEWER", "ADMIN"]),
      }),
      z.object({
        action: z.literal("simulation"),
        failures: z.number().int().min(0).max(6),
      }),
    ])
    .parse(input);
  return transaction(async (tx) => {
    if (v.action === "policy") {
      if (decimal(v.threshold).lte(0))
        throw new AppError(400, "Threshold must be positive.");
      if (new Set(v.reviewerIds).size !== v.reviewerIds.length)
        throw new AppError(400, "Reviewers must be distinct.");
      const reviewers = await tx.user.count({
        where: { id: { in: v.reviewerIds }, role: "REVIEWER", active: true },
      });
      if (reviewers !== v.reviewerIds.length)
        throw new AppError(400, "Choose active reviewers.");
      if (v.webhookUrl) await validateDestination(v.webhookUrl);
      await tx.policy.update({
        where: { id: "main" },
        data: {
          threshold: v.threshold,
          reviewerIds: v.reviewerIds,
          webhookUrl: v.webhookUrl,
        },
      });
    } else if (v.action === "category") {
      if (v.id)
        await tx.category.update({
          where: { id: v.id },
          data: { name: v.name, active: v.active },
        });
      else await tx.category.create({ data: { name: v.name } });
    } else if (v.action === "role") {
      if (v.id === u.id)
        throw new AppError(403, "You cannot change your own role.");
      await tx.user.update({ where: { id: v.id }, data: { role: v.role } });
      await tx.session.deleteMany({ where: { userId: v.id } });
    } else {
      if (
        process.env.NODE_ENV === "production" ||
        process.env.PUBLIC_DEMO === "true" ||
        process.env.ALLOW_DEV_SIMULATION !== "true"
      )
        throw new AppError(403, "Failure simulation is development-only.");
      await tx.policy.update({
        where: { id: "main" },
        data: { simulationFailures: v.failures },
      });
    }
    await tx.audit.create({
      data: {
        actorId: u.id,
        stage: "ADMIN",
        detail: "Protected configuration changed: " + v.action,
      },
    });
    return { ok: true };
  });
}
export async function retry(id: string | undefined, input: unknown) {
  const u = await actor(id);
  admin(u);
  if (process.env.PUBLIC_DEMO === "true")
    throw new AppError(403, "Public demo retries are disabled.");
  const v = z
    .object({ kind: z.enum(["job", "outbox"]), id: z.string() })
    .parse(input);
  return transaction(async (tx) => {
    if (v.kind === "job") {
      await tx.$queryRaw`SELECT id FROM "Job" WHERE id=${v.id} FOR UPDATE`;
      const r = await tx.job.findUniqueOrThrow({ where: { id: v.id } });
      if (r.state !== "FAILED")
        throw new AppError(409, "Only terminal failures can be retried.");
      const request = await tx.request.findUniqueOrThrow({
        where: { id: r.requestId },
      });
      if (request.state !== "PROCESSING_FAILED")
        throw new AppError(
          409,
          "This document has already moved to human review; do not overwrite it.",
        );
      await tx.job.update({
        where: { id: r.id },
        data: {
          state: "QUEUED",
          attempts: 0,
          availableAt: new Date(),
          leaseUntil: null,
          leaseToken: null,
          lastError: null,
        },
      });
      const changed=await tx.request.updateMany({where:{id:r.requestId,state:"PROCESSING_FAILED"},data:{state:"PROCESSING"}});
      if(!changed.count)throw new AppError(409,"The document moved to human review. Retry cancelled.");
      await audit(
        tx,
        r.requestId,
        u.id,
        "QUEUED",
        "Administrator manually retried failed extraction.",
      );
    } else {
      await tx.$queryRaw`SELECT id FROM "Outbox" WHERE id=${v.id} FOR UPDATE`;
      const r = await tx.outbox.findUniqueOrThrow({ where: { id: v.id } });
      if (r.state !== "FAILED")
        throw new AppError(
          409,
          "Only terminal delivery failures can be retried.",
        );
      await tx.outbox.update({
        where: { id: r.id },
        data: {
          state: "QUEUED",
          attempts: 0,
          availableAt: new Date(),
          leaseUntil: null,
          leaseToken: null,
          lastError: null,
        },
      });
    }
    return { ok: true };
  });
}
