import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell";
import { Card, CategoryTag, ScorePill, ProvenanceChip, KV, Banner } from "@/components/ui";
import { money, d } from "@/lib/format";

export default async function SignalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await supabaseServer();
  const { data: base } = await db.from("signals").select("id,category,headline,city,motivation_score,source_key,source_as_of,classification").eq("id", id).maybeSingle();
  if (!base) notFound();
  const { data: pkg } = await db.rpc("signal_detail", { signal_id: id });
  const gated = !pkg || pkg.gated;
  const detail = (pkg?.detail ?? {}) as Record<string, unknown>;
  return (
    <div className="space-y-6">
      <PageHeader title={base.headline} actions={<ScorePill score={base.motivation_score} />} />
      <div className="flex items-center gap-2">
        <CategoryTag category={base.category} />
        <ProvenanceChip classification={base.classification} sourceKey={base.source_key} asOf={base.source_as_of} />
      </div>
      <Link href="/app" className="text-sm text-[color:var(--color-accent-strong)] hover:underline">← Back to feed</Link>
      {gated ? (
        <Card>
          <Banner tone="info">Unlock the full record — address, owner of record, and case detail — on the Scout plan.</Banner>
          <div className="mt-4"><KV rows={[
            { label: "Category", value: base.category },
            { label: "City", value: (pkg?.city as string) ?? base.city ?? "—" },
            { label: "Motivation score", value: String(base.motivation_score) },
            { label: "Address", value: "•••• •••••• ••" },
            { label: "Owner of record", value: "•••••, •••••" },
          ]} /></div>
          <div className="mt-4"><Link href="/account" className="inline-block rounded-lg bg-[color:var(--color-accent-strong)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-accent)]">View plans</Link></div>
        </Card>
      ) : (
        <Card>
          <KV rows={[
            { label: "Address", value: (pkg.address as string) ?? "—" },
            { label: "City / ZIP", value: `${pkg.city ?? "—"} ${pkg.zip ?? ""}` },
            { label: "Parcel", value: (pkg.parcel_id as string) ?? "—" },
            { label: "Owner of record", value: (detail.owner as string) ?? "—" },
            { label: "Owner mailing", value: detail.mailStreet ? `${detail.mailStreet}, ${detail.mailCity ?? ""} ${detail.mailState ?? ""}` : "—" },
            ...(detail.countyMarketValue != null ? [{ label: "County market value", value: money(detail.countyMarketValue as number) }] : []),
            ...(detail.balanceDetected != null ? [{ label: "Tax balance detected", value: money(detail.balanceDetected as number) }] : []),
            ...(detail.holdYears != null ? [{ label: "Years held", value: String(detail.holdYears) }] : []),
            ...(detail.condemnationDate ? [{ label: "Condemnation date", value: d(detail.condemnationDate as string) }] : []),
            ...(detail.status ? [{ label: "Record status", value: String(detail.status) }] : []),
            { label: "Source", value: `${pkg.source_key} · as of ${d(pkg.source_as_of as string)}` },
          ]} />
          {(detail.note as string) && <p className="mt-4 rounded-lg bg-[color:var(--color-surface-sunken)] p-3 text-sm text-[color:var(--color-ink-muted)]">{detail.note as string}</p>}
          {(detail.recordUrl as string) && <p className="mt-3 text-sm"><a className="text-[color:var(--color-accent-strong)] underline" href={detail.recordUrl as string} target="_blank" rel="noopener">Open official record ↗</a></p>}
          <p className="mt-4 text-xs text-[color:var(--color-ink-muted)]">Public-record research signal. Verify status before acting, and follow TCPA/DNC rules when contacting the owner. Not a consumer report.</p>
        </Card>)}
    </div>
  );
}
