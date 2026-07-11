import * as React from "react";

export function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

export function Button({ variant = "primary", size = "md", className, ...p }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" }) {
  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-[color:var(--color-accent-strong)] text-white hover:bg-[color:var(--color-accent)]",
    secondary: "border border-[color:var(--color-line-strong)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-sunken)]",
    ghost: "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]",
  };
  return <button className={cx(base, sizes[size], variants[variant], className)} {...p} />;
}

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)} {...p} />;
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] p-4">
      <p className="text-xs uppercase tracking-wide text-[color:var(--color-ink-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tnum">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">{sub}</p>}
    </div>
  );
}

export function Banner({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "error"; children: React.ReactNode }) {
  const map = {
    info: "border-[color:var(--color-info)]/30 bg-[color:var(--color-info)]/8 text-[color:var(--color-info)]",
    success: "border-[color:var(--color-positive)]/30 bg-[color:var(--color-positive)]/8 text-[color:var(--color-positive)]",
    warning: "border-[color:var(--color-caution)]/30 bg-[color:var(--color-caution)]/10 text-[color:var(--color-caution)]",
    error: "border-[color:var(--color-negative)]/30 bg-[color:var(--color-negative)]/8 text-[color:var(--color-negative)]",
  };
  return <div className={cx("rounded-lg border px-4 py-2.5 text-sm", map[tone])} role="status">{children}</div>;
}

const CAT_STYLE: Record<string, string> = {
  tax_delinquency: "bg-[#fbe9d6] text-[#8a4a08]", ownership: "bg-[#e4eaf2] text-[#2a4a72]",
  code_violation: "bg-[#f7e0dd] text-[#8f2a1e]", probate: "bg-[#e9e2f2] text-[#5b3f86]",
  divorce: "bg-[#f2e2ea] text-[#84335c]", foreclosure: "bg-[#f7ddd9] text-[#9a2f22]",
  eviction: "bg-[#f0e6d6] text-[#7a5a1e]",
};
const CAT_LABEL: Record<string, string> = {
  tax_delinquency: "Tax balance", ownership: "Ownership", code_violation: "Code violation",
  probate: "Probate", divorce: "Divorce", foreclosure: "Foreclosure", eviction: "Eviction",
};
export function CategoryTag({ category }: { category: string }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", CAT_STYLE[category] ?? "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-ink-muted)]")}>{CAT_LABEL[category] ?? category}</span>;
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 70 ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-strong)]"
    : score >= 40 ? "bg-[#f3ead9] text-[#8a5a12]" : "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-ink-muted)]";
  return <span className={cx("inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-2 py-0.5 text-sm font-bold tnum", tone)}>{score}</span>;
}

export function ProvenanceChip({ classification, sourceKey, asOf }: { classification: string; sourceKey: string; asOf?: string | null }) {
  const label = `${classification} · ${sourceKey}${asOf ? ` · ${asOf}` : ""}`;
  return <span className="inline-flex items-center rounded border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-2 py-0.5 text-xs text-[color:var(--color-ink-muted)]" title={label}>{classification} · {sourceKey}</span>;
}

export function TierBadge({ tier }: { tier: string }) {
  const label = { free: "Free", scout: "Scout", scout_plus: "Scout+", ops: "Ops" }[tier] ?? tier;
  const style = tier === "free" ? "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-ink-muted)]" : "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-strong)]";
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", style)}>{label}</span>;
}

export function EmptyState({ headline, body, action }: { headline: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--color-line-strong)] bg-[color:var(--color-surface-raised)] p-10 text-center">
      <p className="font-semibold">{headline}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-[color:var(--color-ink-muted)]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type Col<T> = { key: string; header: string; align?: "left" | "right"; render: (row: T) => React.ReactNode };
export function DataTable<T>({ columns, rows, rowKey }: { columns: Col<T>[]; rows: T[]; rowKey: (r: T) => string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[color:var(--color-line)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={cx("border-b border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-muted)]", c.align === "right" ? "text-right" : "text-left")}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-[color:var(--color-surface-sunken)]/40">
              {columns.map((c) => <td key={c.key} className={cx("border-b border-[color:var(--color-line)]/60 px-3 py-2.5", c.align === "right" ? "text-right tnum" : "")}>{c.render(r)}</td>)}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}

export function KV({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-[color:var(--color-line)]/60">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-6 py-2 text-sm">
          <dt className="text-[color:var(--color-ink-muted)]">{r.label}</dt>
          <dd className="text-right font-medium">{r.value}</dd>
        </div>))}
    </dl>
  );
}
