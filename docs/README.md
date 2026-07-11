# Scout — motivated-seller signal aggregation (Tier 1 of the wholesale ladder)

Fresh rebuild (v2). Standalone product: own repo, own Supabase project (genesis-scout /
ddpyrpuhwjgrvkpevvav — schema + real signal data reused from v1, RLS-verified), own Vercel deploy.
Working brand "Scout" — swap NEXT_PUBLIC_APP_NAME to rebrand.

Self-serve login where subscribers browse aggregated public-record motivated-seller signals
(tax balance, absentee/entity/long-hold ownership, code violations, condemnations) for active
counties, filter/score/export them, and (paid tier) unlock full records. Free = teaser;
Scout/Scout+ = full detail + exports + (Scout+) saved-search alerts.

Compliance: signals are public records; platform stays outside FCRA use; subscriber terms push
TCPA/DNC duties to the caller. Court records whose ToU forbid automated collection (probate,
divorce, sheriff) are surfaced as manual-lookup entries, never scraped. Billing scaffolded but
DISABLED (NEXT_PUBLIC_BILLING_ENABLED=false) until Stripe is approved.

Refresh data: `node --env-file=.env.local scripts/ingest.mjs 500` + `scripts/ingest-cleveland.mjs`.
Verify gating/RLS: `node --env-file=.env.local scripts/verify-scout.mjs` (11 checks).
v1 preserved at ~/builds/genesis-scout-v1-archive (git tag scout-v1).
