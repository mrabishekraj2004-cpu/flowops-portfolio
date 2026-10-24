import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { resolve4 } from "node:dns/promises";
import { isIP } from "node:net";
import https from "node:https";
import { z } from "zod";
import { db } from "./db";
import { AppError } from "./access";
export type WebhookPayload = {
  eventId: string;
  type: "purchase.created";
  purchaseId: string;
  requestId: string;
  number: number;
  currency: string;
  total: string;
};
const schema = z
  .object({
    eventId: z.string().uuid(),
    type: z.literal("purchase.created"),
    purchaseId: z.string().min(1).max(100),
    requestId: z.string().min(1).max(100),
    number: z.number().int().positive(),
    currency: z.literal("LKR"),
    total: z.string().max(30),
  })
  .strict();
export function sign(
  body: string,
  timestamp: string,
  deliveryId: string,
  secret = process.env.WEBHOOK_SECRET ?? "",
) {
  if (secret.length < 32) throw Error("Configure a strong WEBHOOK_SECRET.");
  return createHmac("sha256", secret)
    .update(timestamp + "." + deliveryId + "." + body)
    .digest("hex");
}
export function verify(
  body: string,
  headers: Record<string, string>,
  now = Date.now(),
) {
  const timestamp = headers["x-flowops-timestamp"],
    deliveryId = headers["x-flowops-delivery"],
    signature = headers["x-flowops-signature"];
  if (
    !timestamp ||
    !deliveryId ||
    !signature ||
    !/^\d{10,13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 300000 ||
    !/^[-a-zA-Z0-9]{10,100}$/.test(deliveryId) ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    throw new AppError(401, "Invalid webhook signature or expired timestamp.");
  const expected = sign(body, timestamp, deliveryId);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    throw new AppError(401, "Invalid webhook signature.");
  if (Buffer.byteLength(body) > 16000)
    throw new AppError(413, "Webhook body too large.");
  return schema.parse(JSON.parse(body));
}
export function publicIPv4(ip: string) {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    isIP(ip) === 4 &&
    !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    )
  );
}
export async function validateDestination(destination: string) {
  const url = new URL(destination);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== "443") ||
    isIP(url.hostname) ||
    !url.hostname.includes(".")
  )
    throw new AppError(
      400,
      "Use an HTTPS public DNS hostname on port 443, without credentials.",
    );
  const addresses = await resolve4(url.hostname);
  if (!addresses.length || addresses.some((ip) => !publicIPv4(ip)))
    throw new AppError(
      400,
      "Private, local and reserved webhook destinations are blocked.",
    );
  return { url, address: addresses[0] };
}
export async function receive(body: string, headers: Record<string, string>) {
  const event = verify(body, headers);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Policy" WHERE id='main' FOR UPDATE`;
    const prior = await tx.receiverEvent.findUnique({
      where: { eventId: event.eventId },
    });
    if (prior) return { status: 200, duplicate: true };
    const policy = await tx.policy.findUniqueOrThrow({ where: { id: "main" } });
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.PUBLIC_DEMO !== "true" &&
      process.env.ALLOW_DEV_SIMULATION === "true" &&
      policy.simulationFailures > 0
    ) {
      await tx.policy.update({
        where: { id: "main" },
        data: { simulationFailures: { decrement: 1 } },
      });
      return { status: 503, duplicate: false };
    }
    await tx.receiverEvent.create({
      data: { eventId: event.eventId, payload: event },
    });
    return { status: 200, duplicate: false };
  });
}
export async function deliver(
  destination: string,
  event: WebhookPayload,
  signal: AbortSignal,
  deliveryId = randomUUID(),
) {
  const body = JSON.stringify(event),
    timestamp = String(Date.now());
  const headers = {
    "Content-Type": "application/json",
    "x-flowops-timestamp": timestamp,
    "x-flowops-delivery": deliveryId,
    "x-flowops-signature": sign(body, timestamp, deliveryId),
  };
  if (destination === "test://flowops")
    return { ...(await receive(body, headers)), deliveryId };
  const { url, address } = await validateDestination(destination);
  signal.throwIfAborted();
  const status = await new Promise<number>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "POST",
        headers,
        signal,
        timeout: 10000,
        lookup: (_host, _options, callback) => callback(null, address, 4),
      },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );
    request.on("timeout", () => request.destroy(new Error("Webhook timeout.")));
    request.on("error", () => reject(new Error("Webhook transport failed.")));
    request.end(body);
  });
  return { status, deliveryId };
}
