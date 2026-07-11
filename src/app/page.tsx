import Link from "next/link";
import { PublicShell } from "@/components/shell";

export default function Home() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-accent-strong)]">Scout</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Find motivated sellers before anyone else calls them.</h1>
        <p className="mt-5 text-lg leading-relaxed text-[color:var(--color-ink-muted)]">
          Scout aggregates public-record motivated-seller signals — tax balances, absentee and entity ownership,
          long-hold owners, code violations, condemnations — scores them, and puts them in one searchable feed.
          Every signal shows its source and date. You do the outreach; we surface the leads.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/join" className="rounded-lg bg-[color:var(--color-accent-strong)] px-5 py-2.5 font-semibold text-white hover:bg-[color:var(--color-accent)]">Start free</Link>
          <Link href="/pricing" className="rounded-lg border border-[color:var(--color-line-strong)] px-5 py-2.5 font-semibold">See pricing</Link>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-sm">
          <div><h3 className="font-semibold">Public records, scored</h3><p className="mt-1 text-[color:var(--color-ink-muted)]">Distress and ownership signals from county records, ranked by a transparent motivation score.</p></div>
          <div><h3 className="font-semibold">Source &amp; date on everything</h3><p className="mt-1 text-[color:var(--color-ink-muted)]">No mystery data. Each signal carries its origin and freshness — nothing presented as more current than it is.</p></div>
          <div><h3 className="font-semibold">Your list, your rules</h3><p className="mt-1 text-[color:var(--color-ink-muted)]">Filter by county, category, and score; export within your plan. A research tool, not a consumer report.</p></div>
        </div>
      </section>
    </PublicShell>
  );
}
