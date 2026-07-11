/** Scout subscription tiers. Billing is scaffolded but disabled until Stripe is approved. */
export type Tier = "free" | "scout" | "scout_plus" | "ops";
export const TIERS = {
  free:       { label: "Free",        price: 0,   exportCap: 0,   detail: false, alerts: false },
  scout:      { label: "Scout",       price: 99,  exportCap: 250, detail: true,  alerts: false },
  scout_plus: { label: "Scout+",      price: 199, exportCap: 2000,detail: true,  alerts: true  },
  ops:        { label: "Ops",         price: 0,   exportCap: 100000, detail: true, alerts: true },
} as const;
export const isPaid = (t: Tier) => t === "scout" || t === "scout_plus" || t === "ops";
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
