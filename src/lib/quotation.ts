import { z } from "zod";
import Decimal from "decimal.js";
export const valueSchema = z
  .object({
    supplier: z.string().max(200).nullable(),
    reference: z.string().max(100).nullable(),
    date: z.string().max(30).nullable(),
    currency: z.string().max(8).nullable(),
    items: z
      .array(
        z
          .object({
            description: z.string().max(500).nullable(),
            quantity: z.string().max(30).nullable(),
            unitPrice: z.string().max(30).nullable(),
            lineTotal: z.string().max(30).nullable(),
          })
          .strict(),
      )
      .max(100),
    subtotal: z.string().max(30).nullable(),
    tax: z.string().max(30).nullable(),
    grandTotal: z.string().max(30).nullable(),
  })
  .strict();
export const extractionSchema = z
  .object({
    data: valueSchema,
    evidence: z
      .array(
        z
          .object({
            field: z.string().max(100),
            page: z.number().int().positive().nullable(),
            excerpt: z.string().max(300).nullable(),
          })
          .strict(),
      )
      .max(500),
    summary: z.string().max(1000),
  })
  .strict();
export type Quotation = z.infer<typeof valueSchema>;
export type Extraction = z.infer<typeof extractionSchema>;
export const blank: Quotation = {
  supplier: null,
  reference: null,
  date: null,
  currency: null,
  items: [],
  subtotal: null,
  tax: null,
  grandTotal: null,
};
export function decimal(s: unknown, quantity = false) {
  if (
    typeof s !== "string" ||
    !(quantity ? /^\d{1,12}(\.\d{1,6})?$/ : /^\d{1,14}(\.\d{1,2})?$/).test(s)
  )
    throw Error(
      "Use a nonnegative decimal without commas; money has at most two decimal places.",
    );
  return new Decimal(s);
}
export function validate(data: Quotation, currency = "LKR"): string[] {
  const issues: string[] = [];
  for (const key of [
    "supplier",
    "reference",
    "date",
    "currency",
    "subtotal",
    "tax",
    "grandTotal",
  ] as const)
    if (!data[key]?.trim()) issues.push(key + ": required.");
  if (
    data.date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      Number.isNaN(Date.parse(data.date)) ||
      new Date(data.date).toISOString().slice(0, 10) !== data.date)
  )
    issues.push("date: enter a real date as YYYY-MM-DD.");
  if (data.currency && data.currency !== currency)
    issues.push(
      "currency: only " +
        currency +
        " is supported; no exchange rate is assumed.",
    );
  if (!data.items.length) issues.push("items: at least one line is required.");
  let subtotal = new Decimal(0);
  data.items.forEach((line, i) => {
    if (!line.description?.trim())
      issues.push("item " + (i + 1) + ": description required.");
    try {
      const qty = decimal(line.quantity, true),
        price = decimal(line.unitPrice),
        total = decimal(line.lineTotal);
      if (qty.lte(0))
        issues.push("item " + (i + 1) + ": quantity must be positive.");
      if (!qty.mul(price).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).eq(total))
        issues.push(
          "item " +
            (i + 1) +
            ": quantity × unit price does not match line total.",
        );
      subtotal = subtotal.add(total);
    } catch {
      issues.push("item " + (i + 1) + ": invalid numeric value.");
    }
  });
  try {
    const sub = decimal(data.subtotal),
      tax = decimal(data.tax),
      total = decimal(data.grandTotal);
    if (!subtotal.eq(sub))
      issues.push("subtotal: does not equal sum of line totals.");
    if (!sub.add(tax).eq(total))
      issues.push("grandTotal: does not equal subtotal plus tax.");
    if (total.lte(0)) issues.push("grandTotal: must be positive.");
  } catch {
    issues.push("totals: invalid or missing decimal values.");
  }
  return issues;
}
export const transitions: Record<string, readonly string[]> = {
  DRAFT: ["PROCESSING"],
  PROCESSING: ["NEEDS_REVIEW", "PROCESSING_FAILED"],
  PROCESSING_FAILED: ["PROCESSING", "NEEDS_REVIEW"],
  NEEDS_REVIEW: ["PENDING_APPROVAL"],
  CHANGES_REQUESTED: ["NEEDS_REVIEW"],
  PENDING_APPROVAL: [
    "CHANGES_REQUESTED",
    "REJECTED",
    "APPROVED",
    "NEEDS_REVIEW",
  ],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};
export function transition(from: string, to: string) {
  if (!transitions[from]?.includes(to))
    throw Error("Transition not allowed: " + from + " → " + to);
}
