# Scout v2 — Handoff (2026-07-10, fresh rebuild)

Tier 1 of the wholesale ladder. Rebuilt clean from scratch per request; reuses the RLS-verified
Supabase schema + real signal data from v1 (v1 preserved at ~/builds/genesis-scout-v1-archive, tag scout-v1).

## Live & connected
- **Production: https://genesis-scout-team-1322.vercel.app** (public; /app + /account auth-gated).
- **GitHub: github.com/L0v3Chrix/genesis-scout** (pushed; CI green).
- **Vercel project genesis-scout linked to the GitHub repo** → pushes now auto-deploy.
- **Supabase: genesis-scout / ddpyrpuhwjgrvkpevvav** — schema + 4,957 real Cuyahoga signals reused.

## Verified this build
- lint + typecheck + production build green; **GitHub CI green** (commit 67b266a).
- **Tier gating + RLS 11/11** against production (scripts/verify-scout.mjs): anon locked out; free = teaser;
  Scout/Scout+ = full record via audited signal_detail RPC; self tier-escalation blocked; non-ops can't
  write signals; tenant isolation on subscribers.
- Production HTTP checks: home 200, correct title, /app → 307 /login (auth proxy live).
- Signals intact: code_violation 3,977 · ownership 494 · tax_delinquency 486 = 4,957 active.

## Data sources (unchanged, verified 2026-07-10)
Ingested (public ArcGIS, no ToU block): Cuyahoga parcel tax-balance + absentee/entity/long-hold
ownership; Cleveland code violations; condemnations. Court records (probate/divorce/sheriff) are
ToU-restricted — surfaced in-product as manual-lookup entries, never scraped. See docs/SIGNAL-SOURCES.md.

## Billing — DISABLED by design
NEXT_PUBLIC_BILLING_ENABLED=false. Tiers/caps/upgrade UI scaffolded; no Stripe, no charges. Ops grants
tiers via SQL for testing. Activating paid rails needs your Stripe approval.

## Housekeeping (yours)
Rotate/delete seeded test logins in Supabase Auth: ops@genesisscout.dev / ScoutOps!2026rotate,
scoutbuyer@ / ScoutPaid!2026rotate, freebuyer@ / ScoutFree!2026rotate.

## Next (per Wholesale Portal Plan)
Expand counties via the ArcGIS connector pattern; wire Delinquent_Parcels layer 24 (foreclosure flags);
records-request workflow for probate/divorce; then Tier 2 (Desk/options) and Tier 3 (Keys/turnkey).
