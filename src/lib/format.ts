export const money = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const num = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString("en-US"));
export const d = (s: string | null | undefined) => {
  if (!s) return "—";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s;
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
};
export const CATEGORY_LABELS: Record<string, string> = {
  probate: "Probate", divorce: "Divorce", code_violation: "Code violation",
  eviction: "Eviction", tax_delinquency: "Tax balance", foreclosure: "Foreclosure", ownership: "Ownership",
};
