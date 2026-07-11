import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { AppShell, PageHeader } from "@/components/shell";
import { Card, Banner, TierBadge, Stat } from "@/components/ui";
import { TIERS, BILLING_ENABLED, type Tier } from "@/lib/tiers";
import { signOut } from "../app/actions";

const NAV = [{ href: "/app", label: "Signal feed" }, { href: "/app/saved", label: "Saved searches" }, { href: "/account", label: "Account & plan" }];

export default async function Account() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: sub } = await db.from("subscribers").select("tier").eq("id", user.id).maybeSingle();
  const tier = (sub?.tier ?? "free") as Tier; const t = TIERS[tier];
  const since = new Date(); since.setDate(1); since.setHours(0, 0, 0, 0);
  const { data: usage } = await db.from("export_events").select("row_count").eq("subscriber_id", user.id).gte("at", since.toISOString());
  const used = (usage ?? []).reduce((s, r) => s + r.row_count, 0);
  return (
    <AppShell appName="Scout" tier={tier} userEmail={user.email ?? ""} nav={NAV}
      signOut={<form action={signOut}><button className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">Sign out</button></form>}>
      <PageHeader title="Account & plan" description="Your subscription, usage, and compliance terms." actions={<TierBadge tier={tier} />} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Current plan" value={t.label} sub={t.price ? `$${t.price}/mo` : "Free"} />
        <Stat label="Exports this month" value={`${used.toLocaleString()} / ${t.exportCap.toLocaleString()}`} sub="Resets on the 1st" />
        <Stat label="Full record access" value={t.detail ? "Unlocked" : "Teaser only"} />
      </div>
      {!BILLING_ENABLED && <div className="mt-4"><Banner tone="info">Paid plans aren&apos;t purchasable yet — billing goes live once Stripe is approved. Your account remains on {t.label}.</Banner></div>}
      <div className="mt-6"><Card>
        <h3 className="font-semibold">Plans</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {(["free", "scout", "scout_plus"] as Tier[]).map((k) => (
            <div key={k} className={`rounded-lg border p-4 ${k === tier ? "border-[color:var(--color-accent)]" : "border-[color:var(--color-line)]"}`}>
              <p className="font-semibold">{TIERS[k].label}</p>
              <p className="mt-1 text-2xl font-bold tnum">${TIERS[k].price}<span className="text-sm font-normal text-[color:var(--color-ink-muted)]">/mo</span></p>
              <p className="mt-2 text-xs text-[color:var(--color-ink-muted)]">{TIERS[k].detail ? "Full records + exports" : "Teasers only"}{TIERS[k].alerts ? " · alerts" : ""}</p>
              {k === tier ? <p className="mt-3 text-xs font-semibold text-[color:var(--color-accent-strong)]">Current plan</p>
                : <button disabled className="mt-3 w-full rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-sm opacity-50" title="Billing not yet enabled">Upgrade (soon)</button>}
            </div>))}
        </div>
      </Card></div>
      <div className="mt-6"><Card>
        <h3 className="font-semibold">Terms &amp; compliance</h3>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
          Scout aggregates public-record signals for lead research. It is not a consumer report and must not be used for
          FCRA-regulated decisions (credit, tenancy, employment). You are responsible for TCPA and Do-Not-Call compliance
          when contacting property owners. Signals reflect public records as of their stated dates; verify status before acting.
        </p>
      </Card></div>
    </AppShell>
  );
}
