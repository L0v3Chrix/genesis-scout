import type { Classification } from "@/lib/data/classifications";

export type SignalCategory =
  | "probate" | "divorce" | "code_violation" | "eviction"
  | "tax_delinquency" | "foreclosure" | "ownership";

/** Normalized signal ready to upsert into public.signals. */
export interface NormalizedSignal {
  fips: string;
  sourceKey: string;
  category: SignalCategory;
  address: string | null;
  city: string | null;
  zip: string | null;
  parcelId: string | null;
  lat: number | null;
  lon: number | null;
  motivationScore: number;   // 0-100
  headline: string;          // teaser-safe: no owner PII
  detail: Record<string, unknown>;  // paid-gated
  sourceAsOf: string | null;
  classification: Classification;
  dedupeKey: string;
}
