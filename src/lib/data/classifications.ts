/** Signal provenance classifications (shared vocabulary with the OS). */
export type Classification =
  | "live_source" | "fresh_snapshot" | "stale_snapshot"
  | "source_observed" | "estimated" | "modeled" | "demo_fixture";

export function evaluateFreshness(opts: {
  sourceAsOf?: string | null; retrievedAt: string; slaHours: number; now?: Date;
}): "fresh_snapshot" | "stale_snapshot" {
  const now = opts.now ?? new Date();
  const basis = opts.sourceAsOf ? new Date(opts.sourceAsOf) : new Date(opts.retrievedAt);
  const ageHours = (now.getTime() - basis.getTime()) / 3.6e6;
  return ageHours <= opts.slaHours ? "fresh_snapshot" : "stale_snapshot";
}
