import Link from "next/link";
import { PublicShell } from "@/components/shell";
import { TIERS, BILLING_ENABLED } from "@/lib/tiers";

export default function Pricing() {
  const plans = [
    { key: "free", tagline: "Browse the feed, see teasers", features: ["All active counties", "Filter by category & score", "Teaser view of every signal", "No exports"] },
    { key: "scout", tagline: "Unlock full records + exports", features: ["Everything in Free", "Full record: address, owner, detail", "Export up to 250 rows/mo", "Motivation scoring"] },
    { key: "scout_plus", tagline: "Alerts + saved searches", features: ["Everything in Scout", "Saved searches", "New-signal alerts (email)", "Export up to 2,000 rows/mo"] },
  ] as const;
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-2 text-[color:var(--color-ink-muted)]">Start free. Upgrade when you want full records and exports.</p>
        {!BILLING_ENABLED && <p className="mt-4 rounded-lg border border-[color:var(--color-caution)]/40 bg-[color:var(--color-caution)]/10 px-4 py-2 text-sm text-[color:var(--color-caution)]">Checkout isn&apos;t live yet — accounts start on Free. Paid tiers activate when billing goes live.</p>}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const t = TIERS[p.key];
            return (
              <div key={p.key} className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] p-6">
                <h2 className="text-lg font-bold">{t.label}</h2>
                <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{p.tagline}</p>
                <p className="mt-4 text-3xl font-bold tnum">${t.price}<span className="text-base font-normal text-[color:var(--color-ink-muted)]">/mo</span></p>
                <ul className="mt-4 space-y-1.5 text-sm text-[color:var(--color-ink-muted)]">{p.features.map((f) => <li key={f}>• {f}</li>)}</ul>
                <Link href="/join" className="mt-6 block rounded-lg bg-[color:var(--color-accent-strong)] px-4 py-2 text-center font-semibold text-white hover:bg-[color:var(--color-accent)]">Start free</Link>
              </div>);
          })}
        </div>
      </section>
    </PublicShell>
  );
}
