/** Ingest Cleveland ArcGIS signal layers (code violations + condemnations) into genesis-scout.
 *  Both verified public, address-level, no ToU block. node --env-file=.env.local scripts/ingest-cleveland.mjs */
import { createClient } from "@supabase/supabase-js";
const s = (v) => (v == null ? "" : String(v).trim());
const ORG = "https://services3.arcgis.com/dty2kHktVXHrqO8i/arcgis/rest/services";

async function pull(layerUrl, outFields, max = 1500) {
  const rows = []; let offset = 0;
  while (offset < max) {
    const url = `${layerUrl}/query?where=1%3D1&outFields=${outFields}&resultRecordCount=1000&resultOffset=${offset}&returnGeometry=true&outSR=4326&f=json`;
    const res = await fetch(url, { headers: { "User-Agent": "GenesisScout/1.0 (public-records research)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${offset}`);
    const j = await res.json(); if (j.error) throw new Error(JSON.stringify(j.error));
    const f = j.features || []; rows.push(...f);
    if (f.length < 1000) break; offset += 1000;
  }
  return rows;
}
const ptOf = (g) => (g && g.x != null ? { lat: g.y, lon: g.x } : null);
const msAgoDays = (ms) => (ms ? Math.round((Date.now() - Number(ms)) / 8.64e7) : null);

function violationSignals(feats) {
  const out = [];
  for (const f of feats) {
    const a = f.attributes; const parcel = s(a.PARCEL_NUMBER); const addr = s(a.PRIMARY_ADDRESS);
    if (!addr && !parcel) continue;
    const filed = a.FILE_DATE ? new Date(Number(a.FILE_DATE)).toISOString().slice(0, 10) : null;
    const ageDays = msAgoDays(a.FILE_DATE);
    const recent = ageDays != null && ageDays < 540;
    const score = Math.min(100, 40 + (recent ? 25 : 5) + (/OPEN|ACTIVE/i.test(s(a.VIOLATION_APP_STATUS)) ? 15 : 0));
    const geo = ptOf(f.geometry);
    out.push({ fips: "39035", source_key: "cle_code_violations", category: "code_violation",
      address: addr || null, city: "Cleveland", zip: null, parcel_id: parcel || null,
      lat: geo?.lat ?? null, lon: geo?.lon ?? null, motivation_score: score,
      headline: `Code violation on file${filed ? ` · filed ${filed}` : ""}`,
      detail: { violationNumber: s(a.VIOLATION_NUMBER), status: s(a.VIOLATION_APP_STATUS),
        source: s(a.SOURCE), neighborhood: s(a.DW_Neighborhood), filedDate: filed,
        recordUrl: s(a.VIOLATION_ACCELA_CITIZEN_ACCESS_URL) || s(a.COMPLAINT_ACCELA_CITIZEN_ACCESS_URL) },
      source_as_of: filed, classification: "source_observed", status: "active",
      dedupe_key: `viol:${s(a.RECORD_ID) || s(a.VIOLATION_NUMBER) || parcel + ":" + addr}` });
  }
  return out;
}
function condemnationSignals(feats) {
  const out = [];
  for (const f of feats) {
    const a = f.attributes; const parcel = s(a.Parcel_Number); const addr = s(a.Address);
    if (!addr && !parcel) continue;
    const cd = a.Condemnation_Date ? new Date(Number(a.Condemnation_Date)).toISOString().slice(0, 10) : null;
    const active = /y|true|1/i.test(s(a.Active_Condemnation));
    const geo = ptOf(f.geometry);
    out.push({ fips: "39035", source_key: "cle_condemnations", category: "code_violation",
      address: addr || null, city: "Cleveland", zip: null, parcel_id: parcel || null,
      lat: geo?.lat ?? null, lon: geo?.lon ?? null,
      motivation_score: Math.min(100, active ? 82 : 60),
      headline: `${active ? "Active condemnation" : "Condemnation on record"}${cd ? ` · ${cd}` : ""}`,
      detail: { active, condemnationDate: cd, neighborhood: s(a.DW_Neighborhood),
        note: "Condemnation is a strong distress signal — owner may be highly motivated to sell." },
      source_as_of: cd, classification: "source_observed", status: "active",
      dedupe_key: `cond:${parcel || addr}` });
  }
  return out;
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: ae } = await db.auth.signInWithPassword({ email: "ops@genesisscout.dev", password: process.env.OPS_PASSWORD || "ScoutOps!2026rotate" });
if (ae) { console.error("auth:", ae.message); process.exit(1); }

console.log("pulling code violations…");
const viol = violationSignals(await pull(`${ORG}/Complaint_Violation_Notices/FeatureServer/0`,
  "RECORD_ID,FILE_DATE,PARCEL_NUMBER,PRIMARY_ADDRESS,SOURCE,VIOLATION_NUMBER,VIOLATION_APP_STATUS,COMPLAINT_ACCELA_CITIZEN_ACCESS_URL,VIOLATION_ACCELA_CITIZEN_ACCESS_URL,DW_Neighborhood", 2000));
console.log("pulling condemnations…");
const cond = condemnationSignals(await pull(`${ORG}/Current_Condemnations/FeatureServer/0`,
  "Parcel_Number,Active_Condemnation,Address,Condemnation_Date,DW_Neighborhood", 2500));
// dedupe within-batch: keep the highest-score row per (source_key, dedupe_key)
const byKey = new Map();
for (const r of [...viol, ...cond]) {
  const k = r.source_key + "|" + r.dedupe_key;
  const prev = byKey.get(k);
  if (!prev || r.motivation_score > prev.motivation_score) byKey.set(k, r);
}
const all = [...byKey.values()];
console.log(`derived ${viol.length} violation + ${cond.length} condemnation signals → ${all.length} after dedupe`);
let ins = 0;
for (let i = 0; i < all.length; i += 200) {
  const { error } = await db.from("signals").upsert(all.slice(i, i + 200), { onConflict: "source_key,dedupe_key", ignoreDuplicates: false });
  if (error) console.error("chunk:", error.message); else ins += Math.min(200, all.length - i);
}
console.log("upserted", ins);
const { count } = await db.from("signals").select("id", { count: "exact", head: true });
console.log("total signals:", count);
