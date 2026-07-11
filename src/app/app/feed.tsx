"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, ScorePill, CategoryTag, ProvenanceChip, Banner, Button, EmptyState } from "@/components/ui";
import { isPaid, type Tier } from "@/lib/tiers";

type Signal = { id: string; category: string; headline: string; city: string | null; motivation_score: number; source_key: string; source_as_of: string | null; classification: string };
type County = { fips: string; name: string; state: string };
type Source = { key: string; name: string; category: string; terms_class: string; terms_note: string | null };
const CATS = ["tax_delinquency", "ownership", "code_violation", "probate", "divorce", "foreclosure", "eviction"];
const LABEL: Record<string, string> = { tax_delinquency: "Tax balance", ownership: "Ownership", code_violation: "Code violation", probate: "Probate", divorce: "Divorce", foreclosure: "Foreclosure", eviction: "Eviction" };

export default function Feed({ tier, counties, sources, initial }: { tier: Tier; counties: County[]; sources: Source[]; initial: Record<string, string> }) {
  const [fips, setFips] = useState(initial.fips ?? counties[0]?.fips ?? "39035");
  const [cats, setCats] = useState<string[]>(initial.cat ? [initial.cat] : []);
  const [minScore, setMinScore] = useState(Number(initial.min ?? 0));
  const [rows, setRows] = useState<Signal[]>([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  const paid = isPaid(tier);
  const restricted = useMemo(() => sources.filter((s) => s.terms_class === "restricted"), [sources]);
  const queryable = useMemo(() => new Set(sources.filter((s) => s.terms_class !== "restricted").map((s) => s.category)), [sources]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      let q = supabaseBrowser().from("signals").select("id,category,headline,city,motivation_score,source_key,source_as_of,classification", { count: "exact" })
        .eq("fips", fips).eq("status", "active").gte("motivation_score", minScore).order("motivation_score", { ascending: false }).limit(200);
      if (cats.length) q = q.in("category", cats);
      const { data, count } = await q;
      if (cancelled) return;
      setRows((data as Signal[]) ?? []); setTotal(count ?? 0); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fips, cats, minScore]);

  async function doExport() {
    setExporting(true); setMsg(null);
    const res = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fips, cats, minScore }) });
    const body = await res.json();
    if (!res.ok) { setMsg(body.error ?? "Export failed"); setExporting(false); return; }
    const blob = new Blob([body.csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `scout-${fips}.csv`; a.click(); URL.revokeObjectURL(url);
    setMsg(`Exported ${body.rows} rows.`); setExporting(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] p-4">
        <label className="text-sm">County
          <select value={fips} onChange={(e) => setFips(e.target.value)} className="mt-1 block rounded-lg border border-[color:var(--color-line-strong)] px-3 py-2">
            {counties.map((c) => <option key={c.fips} value={c.fips}>{c.name}, {c.state}</option>)}
          </select></label>
        <div className="text-sm">Categories
          <div className="mt-1 flex flex-wrap gap-1.5">
            {CATS.map((c) => {
              const on = cats.includes(c); const has = queryable.has(c);
              return <button key={c} type="button" disabled={!has} onClick={() => setCats((p) => on ? p.filter((x) => x !== c) : [...p, c])}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-strong)]" : "border-[color:var(--color-line-strong)] text-[color:var(--color-ink-muted)]"} ${!has ? "opacity-40" : ""}`}
                title={!has ? "No queryable source in this county yet" : ""}>{LABEL[c] ?? c}</button>;
            })}
          </div>
        </div>
        <label className="text-sm">Min score: <b className="tnum">{minScore}</b>
          <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="mt-1 block w-40" /></label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm tnum text-[color:var(--color-ink-muted)]">{total.toLocaleString()} signals</span>
          <Button onClick={doExport} disabled={exporting || !paid} title={!paid ? "Upgrade to export" : ""}>{exporting ? "Exporting…" : paid ? "Export CSV" : "Export (paid)"}</Button>
        </div>
      </div>

      {msg && <Banner tone={msg.startsWith("Exported") ? "success" : "warning"}>{msg}</Banner>}
      {!paid && <Banner tone="info">You&apos;re on the Free plan — signal detail (address, owner, case data) unlocks on Scout. <Link href="/account" className="font-semibold underline">Upgrade</Link>.</Banner>}

      {loading ? <p className="text-sm text-[color:var(--color-ink-muted)]">Loading signals…</p>
        : rows.length === 0 ? <EmptyState headline="No signals match" body="Widen your filters or lower the minimum score." />
        : <DataTable columns={[
            { key: "cat", header: "Category", render: (r: Signal) => <CategoryTag category={r.category} /> },
            { key: "headline", header: "Signal", render: (r: Signal) => <span className="font-medium">{r.headline}</span> },
            { key: "score", header: "Score", align: "right", render: (r: Signal) => <ScorePill score={r.motivation_score} /> },
            { key: "prov", header: "Source", render: (r: Signal) => <ProvenanceChip classification={r.classification} sourceKey={r.source_key} asOf={r.source_as_of} /> },
            { key: "act", header: "", render: (r: Signal) => <Link className="text-sm font-medium text-[color:var(--color-accent-strong)] hover:underline" href={`/app/signals/${r.id}`}>{paid ? "Open" : "Preview"}</Link> },
          ]} rows={rows} rowKey={(r: Signal) => r.id} />}

      {restricted.length > 0 && (
        <div className="rounded-xl border border-[color:var(--color-line)] p-4 text-sm">
          <p className="font-semibold">Compliance-gated signal types (manual lookup only)</p>
          <p className="mt-1 text-[color:var(--color-ink-muted)]">These public records exist but their terms of use prohibit automated collection, so Scout doesn&apos;t ingest them. Use the official portal directly:</p>
          <ul className="mt-2 space-y-1">{restricted.map((s) => <li key={s.key}>· <b>{LABEL[s.category] ?? s.category}</b> — {s.name}</li>)}</ul>
        </div>)}
    </div>
  );
}
