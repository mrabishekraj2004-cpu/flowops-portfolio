import { db } from "./db";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { extract, type Page, type ExtractionProvider } from "./providers";
import { privateFilePath } from "./storage";
import { validate } from "./quotation";
import { Prisma } from "../generated/prisma/client";
import { deliver } from "./webhooks";
const execute = promisify(execFile);
export const backoff = (attempt: number) =>
  Math.min(60000, 1000 * 2 ** (attempt - 1));
export async function recover() {
  await db.$transaction(async (tx) => {
    const dead = await tx.job.findMany({
      where: { state: "RUNNING", leaseUntil: { lt: new Date() } },
    });
    for (const job of dead) {
      await tx.$queryRaw`SELECT id FROM "Job" WHERE id=${job.id} FOR UPDATE`;
      const current = await tx.job.findUniqueOrThrow({ where: { id: job.id } });
      if (
        current.state !== "RUNNING" ||
        current.leaseToken !== job.leaseToken ||
        !current.leaseUntil ||
        current.leaseUntil >= new Date()
      )
        continue;
      await tx.jobAttempt.updateMany({
        where: { jobId: job.id, state: "STARTED" },
        data: {
          state: "INTERRUPTED",
          detail: "Lease expired; previous worker stopped or timed out.",
          finishedAt: new Date(),
        },
      });
      await tx.job.update({
        where: { id: job.id },
        data: {
          state: job.attempts >= job.maxAttempts ? "FAILED" : "QUEUED",
          leaseToken: null,
          leaseUntil: null,
          lastError: "Worker lease expired.",
          availableAt: new Date(),
        },
      });
      if (job.attempts >= job.maxAttempts)
        await tx.request.updateMany({
          where: { id: job.requestId, state: "PROCESSING" },
          data: { state: "PROCESSING_FAILED" },
        });
    }
    await tx.outbox.updateMany({
      where: {
        state: "RUNNING",
        leaseUntil: { lt: new Date() },
        attempts: { lt: 4 },
      },
      data: {
        state: "QUEUED",
        leaseToken: null,
        leaseUntil: null,
        availableAt: new Date(),
      },
    });
    await tx.outbox.updateMany({
      where: {
        state: "RUNNING",
        leaseUntil: { lt: new Date() },
        attempts: { gte: 4 },
      },
      data: {
        state: "FAILED",
        leaseToken: null,
        leaseUntil: null,
        lastError: "Worker lease expired on final attempt.",
      },
    });
  });
}
export async function claim(kind: "Job" | "Outbox") {
  const token = randomUUID();
  const table = kind === "Job" ? Prisma.raw('"Job"') : Prisma.raw('"Outbox"');
  const rows = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`UPDATE ${table} SET state='RUNNING', attempts=attempts+1, "leaseToken"=${token}, "leaseUntil"=NOW()+INTERVAL '90 seconds' WHERE id=(SELECT id FROM ${table} WHERE state='QUEUED' AND "availableAt"<=NOW() AND attempts<"maxAttempts" ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id`,
  );
  return rows[0] ? { id: rows[0].id, token } : null;
}
export async function processExtraction(
  claimed: { id: string; token: string },
  provider?: ExtractionProvider,
) {
  const job = await db.job.findUniqueOrThrow({
    where: { id: claimed.id },
    include: { request: { include: { owner: true } } },
  });
  if (job.state !== "RUNNING" || job.leaseToken !== claimed.token) return;
  await db.audit.create({
    data: {
      requestId: job.requestId,
      actorId: "worker",
      stage: "STARTED",
      detail: "Persisted extraction attempt " + job.attempts + " started.",
    },
  });
  const attempt = await db.jobAttempt.create({
    data: {
      jobId: job.id,
      attempt: job.attempts,
      state: "STARTED",
      detail: "Extraction attempt started.",
    },
  });
  try {
    if (!job.request.owner.active || job.request.owner.role !== "REQUESTER")
      throw Error("Requester's account is not eligible for processing.");
    if (job.request.state !== "PROCESSING")
      throw Error("Request is no longer processing.");
    const result = await execute(
      process.execPath,
      [
        path.resolve("src/lib/extract-child.mjs"),
        privateFilePath(job.request.storageKey),
      ],
      { timeout: 25000, maxBuffer: 200000, windowsHide: true },
    );
    const pages: Page[] = JSON.parse(result.stdout);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let proposed;
    try {
      proposed = await Promise.race([
        extract(pages, controller.signal, provider),
        new Promise<never>((_, reject) =>
          controller.signal.addEventListener(
            "abort",
            () => reject(Error("Provider timed out.")),
            { once: true },
          ),
        ),
      ]);
    } finally {
      clearTimeout(timer);
    }
    const policy = await db.policy.findUniqueOrThrow({ where: { id: "main" } });
    const issues = validate(proposed.result.data, policy.baseCurrency);
    await db.$transaction(async (tx) => {
      const changed = await tx.job.updateMany({
        where: { id: job.id, state: "RUNNING", leaseToken: claimed.token },
        data: {
          state: "SUCCEEDED",
          leaseToken: null,
          leaseUntil: null,
          lastError: null,
        },
      });
      if (!changed.count) return;
      const current = await tx.request.findUniqueOrThrow({
        where: { id: job.requestId },
      });
      const owner = await tx.user.findUniqueOrThrow({
        where: { id: current.ownerId },
      });
      if (!owner.active || owner.role !== "REQUESTER")
        throw Error("Account is no longer eligible.");
      if (current.state !== "PROCESSING" || current.originalExtraction !== null)
        throw Error("Stale extraction effect rejected.");
      await tx.request.update({
        where: { id: job.requestId },
        data: {
          originalExtraction:
            proposed.result as unknown as Prisma.InputJsonValue,
          extractionProvider: proposed.provider,
          pageText: pages as unknown as Prisma.InputJsonValue,
          currentData: proposed.result.data as unknown as Prisma.InputJsonValue,
          validation: issues,
          state: "NEEDS_REVIEW",
        },
      });
      await tx.jobAttempt.update({
        where: { id: attempt.id },
        data: {
          state: "SUCCEEDED",
          detail: "Extraction and decimal validation finished.",
          finishedAt: new Date(),
        },
      });
      await tx.audit.createMany({
        data: [
          {
            requestId: job.requestId,
            actorId: "worker",
            stage: "EXTRACTION",
            detail:
              "Proposed fields stored unchanged. Provider: " +
              proposed.provider,
          },
          {
            requestId: job.requestId,
            actorId: "worker",
            stage: "VALIDATION",
            detail:
              issues.length + " validation issue(s); waiting for human review.",
          },
        ],
      });
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.message.includes("eligible")
        ? "Account is no longer eligible."
        : error instanceof Error && error.message.includes("timed out")
          ? "Processing provider timed out."
          : "PDF or provider processing failed. Use a selectable-text PDF or manual entry; see troubleshooting.";
    await db.$transaction(async (tx) => {
      const changed = await tx.job.updateMany({
        where: { id: job.id, state: "RUNNING", leaseToken: claimed.token },
        data: {
          state: job.attempts >= job.maxAttempts ? "FAILED" : "QUEUED",
          availableAt: new Date(Date.now() + backoff(job.attempts)),
          leaseUntil: null,
          leaseToken: null,
          lastError: detail,
        },
      });
      if (!changed.count) return;
      await tx.jobAttempt.update({
        where: { id: attempt.id },
        data: { state: "FAILED", detail, finishedAt: new Date() },
      });
      if (job.attempts >= job.maxAttempts) {
        await tx.request.updateMany({
          where: { id: job.requestId, state: "PROCESSING" },
          data: { state: "PROCESSING_FAILED" },
        });
        await tx.audit.create({
          data: {
            requestId: job.requestId,
            actorId: "worker",
            stage: "PROCESSING_FAILED",
            detail,
          },
        });
      }
    });
  }
}
export async function processDelivery(claimed: { id: string; token: string }) {
  const item = await db.outbox.findUniqueOrThrow({
    where: { id: claimed.id },
    include: {
      purchase: { include: { request: { include: { owner: true } } } },
    },
  });
  if (item.state !== "RUNNING" || item.leaseToken !== claimed.token) return;
  const deliveryId = randomUUID();
  let status: number | undefined;
  let outcome = "Delivery transport failed.";
  try {
    if (
      !item.purchase.request.owner.active ||
      !["APPROVED", "COMPLETED"].includes(item.purchase.request.state)
    )
      throw Error("Request no longer eligible.");
    const response = await deliver(
      item.destination,
      {
        eventId: item.eventId,
        type: "purchase.created",
        purchaseId: item.purchaseId,
        requestId: item.purchase.requestId,
        number: item.purchase.number,
        currency: item.purchase.currency,
        total: item.purchase.total.toFixed(2),
      },
      AbortSignal.timeout(12000),
      deliveryId,
    );
    status = response.status;
    outcome =
      status >= 200 && status < 300
        ? "Delivered"
        : "Receiver returned HTTP " + status;
  } catch {}
  const succeeded = !!status && status >= 200 && status < 300;
  await db.$transaction(async (tx) => {
    const changed = await tx.outbox.updateMany({
      where: { id: item.id, state: "RUNNING", leaseToken: claimed.token },
      data: {
        state: succeeded
          ? "SUCCEEDED"
          : item.attempts >= item.maxAttempts
            ? "FAILED"
            : "QUEUED",
        availableAt: new Date(Date.now() + backoff(item.attempts)),
        leaseUntil: null,
        leaseToken: null,
        lastError: succeeded ? null : outcome,
      },
    });
    if (!changed.count) return;
    await tx.delivery.create({
      data: {
        id: deliveryId,
        eventId: item.eventId,
        outboxId: item.id,
        status,
        outcome,
      },
    });
    if (succeeded) {
      await tx.request.updateMany({
        where: { id: item.purchase.requestId, state: "APPROVED" },
        data: { state: "COMPLETED" },
      });
      await tx.audit.create({
        data: {
          requestId: item.purchase.requestId,
          actorId: "worker",
          stage: "NOTIFICATION",
          detail: "Signed notification delivered. Event " + item.eventId,
        },
      });
    }
  });
}
export async function tick(provider?: ExtractionProvider) {
  await recover();
  const job = await claim("Job");
  if (job) await processExtraction(job, provider);
  const delivery = await claim("Outbox");
  if (delivery) await processDelivery(delivery);
  return Boolean(job || delivery);
}
