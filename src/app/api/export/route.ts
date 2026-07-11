import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { TIERS, isPaid, type Tier } from "@/lib/tiers";

export async function POST(req: Request) {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: sub } = await db.from("subscribers").select("tier").eq("id", user.id).maybeSingle();
  const tier = (sub?.tier ?? "free") as Tier;
  if (!isPaid(tier)) return NextResponse.json({ error: "Exports require a paid plan." }, { status: 403 });
  const { fips, cats, minScore } = await req.json().catch(() => ({}));
  const cap = TIERS[tier].exportCap;
  const since = new Date(); since.setDate(1); since.setHours(0, 0, 0, 0);
  const { data: usage } = await db.from("export_events").select("row_count").eq("subscriber_id", user.id).gte("at", since.toISOString());
  const used = (usage ?? []).reduce((s, r) => s + r.row_count, 0);
  const remaining = Math.max(0, cap - used);
  if (remaining <= 0) return NextResponse.json({ error: `Monthly export cap reached (${cap}). Resets on the 1st.` }, { status: 429 });
  let q = db.from("signals").select("category,headline,address,city,zip,parcel_id,motivation_score,source_key,source_as_of")
    .eq("fips", fips).eq("status", "active").gte("motivation_score", minScore ?? 0).order("motivation_score", { ascending: false }).limit(Math.min(remaining, cap));
  if (cats?.length) q = q.in("category", cats);
  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["category", "headline", "address", "city", "zip", "parcel_id", "motivation_score", "source_key", "source_as_of"];
  const csv = [header.join(","), ...(rows ?? []).map((r) => header.map((h) => esc((r as Record<string, unknown>)[h])).join(","))].join("\n");
  await db.from("export_events").insert({ subscriber_id: user.id, fips, category: cats?.join("|") ?? null, row_count: rows?.length ?? 0 });
  await db.from("audit_events").insert({ actor: user.id, action: "signals.exported", entity: "county", entity_id: fips, meta: { rows: rows?.length ?? 0 } });
  return NextResponse.json({ csv, rows: rows?.length ?? 0 });
}
