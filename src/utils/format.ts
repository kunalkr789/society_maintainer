const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** ₹1,500 */
export const inr = (n: number) => inrFmt.format(Number(n) || 0);

/** "2026-11" → "Nov 2026" */
export function monthLabel(monthId?: string) {
  if (!monthId) return "";
  const [y, m] = monthId.split("-").map(Number);
  if (!y || !m) return monthId;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** Firestore Timestamp | ISO string | Date → Date (or null). */
export function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "object" && v !== null && "seconds" in v) return new Date((v as { seconds: number }).seconds * 1000);
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Nov" style short date. */
export const shortDate = (v: unknown) => toDate(v)?.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) ?? "";

/** Days from today until `v` (negative = overdue). */
export function daysUntil(v: unknown) {
  const d = toDate(v);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}
