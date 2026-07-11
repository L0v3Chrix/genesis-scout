/**
 * Cuyahoga County parcel signals — motivated-seller signals derived from the county
 * fiscal-office parcel API (same verified endpoint the OS uses). Produces two categories
 * without any court records: `tax_delinquency` (balance beyond the annual bill) and
 * `ownership` (absentee / entity-owned / long-hold). Server-only; honest failures.
 */
import type { NormalizedSignal, SignalCategory } from "./types";

const ENDPOINT =
  "https://gis.cuyahogacounty.us/server/rest/services/CCFO/APPRAISAL_PARCELS_CAMA_WGS84/MapServer/2/query";
const FIELDS = [
  "PARCELPIN", "parcel_addr", "parcel_street", "parcel_suffix", "parcel_city", "parcel_zip",
  "parcel_owner", "mail_addr_street", "mail_city", "mail_state", "mail_zip",
  "tax_market_total", "net_tax_total", "grand_total_balance",
  "last_transfer_date", "tax_luc_description",
].join(",");

export class SignalConnectorError extends Error {
  constructor(public sourceKey: string, public code: string, message: string) {
    super(message);
  }
}

function s(v: unknown): string { return v == null ? "" : String(v).trim(); }

function centroid(geom: { rings?: number[][][] } | undefined): { lat: number; lon: number } | null {
  if (!geom?.rings?.[0]?.length) return null;
  const r = geom.rings[0];
  const lon = r.reduce((a, p) => a + p[0], 0) / r.length;
  const lat = r.reduce((a, p) => a + p[1], 0) / r.length;
  return { lat, lon };
}

const NUM_STREET = /\b(RD|ST|AVE|BLVD|DR|LN|CT|PL|WAY|CIR|PKWY|TER)\b\.?/g;
function normStreet(str: string): string[] {
  return str.toUpperCase().replace(NUM_STREET, "").replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
}
const ENTITY_RE = /\b(LLC|L L C|TRUST|INC|LTD|LP|LLP|PROPERTIES|HOLDINGS|INVEST|CAPITAL|GROUP)\b/;

async function fetchJson(url: string, timeoutMs = 45_000): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "GenesisScout/1.0 (public-records research)" } });
      clearTimeout(t);
      if (!res.ok) throw new SignalConnectorError("cuyahoga_parcels", "http_error", `HTTP ${res.status}`);
      const json = (await res.json()) as Record<string, unknown>;
      if (json.error) throw new SignalConnectorError("cuyahoga_parcels", "upstream_error", JSON.stringify(json.error));
      return json;
    } catch (e) {
      clearTimeout(t);
      if (attempt === 2) throw e instanceof SignalConnectorError ? e
        : new SignalConnectorError("cuyahoga_parcels", "network", String(e));
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw new SignalConnectorError("cuyahoga_parcels", "network", "unreachable");
}

export async function cuyahogaHealthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await fetchJson(`${ENDPOINT}?where=1%3D1&outFields=PARCELPIN&resultRecordCount=1&returnGeometry=false&f=json`, 20_000);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
  }
}

const REF_MS = 1783900800000; // 2026-07-10 reference for hold-length

/**
 * Pull residential parcels carrying motivated-seller signals. `where` targets rows with
 * a tax balance OR (via a second pass) entity/absentee ownership. We fetch a bounded page
 * and derive signals per row. Returns normalized signals (idempotent via dedupeKey).
 */
export async function fetchCuyahogaSignals(opts: { limit?: number; offset?: number } = {}): Promise<NormalizedSignal[]> {
  const limit = opts.limit ?? 400;
  const offset = opts.offset ?? 0;
  // residential-ish with a real market value; grab a page ordered by tax balance desc so the
  // strongest distress signals surface first.
  const where = encodeURIComponent("tax_market_total > 20000 AND grand_total_balance > 0");
  const url = `${ENDPOINT}?where=${where}&outFields=${FIELDS}&orderByFields=grand_total_balance DESC`
    + `&resultRecordCount=${limit}&resultOffset=${offset}&returnGeometry=true&outSR=4326&f=json`;
  const json = await fetchJson(url);
  const feats = (json.features as Array<{ attributes: Record<string, unknown>; geometry?: { rings?: number[][][] } }>) ?? [];
  const retrievedAt = new Date().toISOString();
  const out: NormalizedSignal[] = [];

  for (const f of feats) {
    const a = f.attributes;
    const parcelId = s(a.PARCELPIN);
    if (!parcelId) continue;
    const addr = [s(a.parcel_addr), s(a.parcel_street), s(a.parcel_suffix)].filter(Boolean).join(" ").trim();
    const city = s(a.parcel_city);
    const zip = s(a.parcel_zip).slice(0, 5);
    const geo = centroid(f.geometry);
    const owner = s(a.parcel_owner);
    const mailStreet = s(a.mail_addr_street);
    const value = Number(a.tax_market_total) || 0;
    const tax = Number(a.net_tax_total) || 0;
    const bal = Number(a.grand_total_balance) || 0;
    const xfer = a.last_transfer_date ? Number(a.last_transfer_date) : null;
    const holdYears = xfer ? Math.round((REF_MS - xfer) / 3.156e10) : null;
    const absentee = !!mailStreet && normStreet(addr).slice(0, 2).join(" ") !== normStreet(mailStreet).slice(0, 2).join(" ");
    const entity = ENTITY_RE.test(owner.toUpperCase());

    const base = { fips: "39035", address: addr || null, city: city || null, zip: zip || null,
      parcelId, lat: geo?.lat ?? null, lon: geo?.lon ?? null,
      sourceAsOf: null as string | null, classification: "source_observed" as const };

    // Tax-delinquency signal (neutral language — balance detected, not "delinquent")
    if (bal > tax + 1) {
      const overBill = tax > 0 ? bal / tax : 2;
      const score = Math.min(100, 45 + Math.round(Math.min(overBill, 4) * 12));
      out.push({ ...base, sourceKey: "cuyahoga_parcels", category: "tax_delinquency" as SignalCategory,
        motivationScore: score,
        headline: `Outstanding tax balance detected${city ? ` · ${city}` : ""}`,
        detail: { owner, mailStreet, mailCity: s(a.mail_city), mailState: s(a.mail_state), mailZip: s(a.mail_zip),
          countyMarketValue: value, annualTax: tax, balanceDetected: bal, holdYears, landUse: s(a.tax_luc_description),
          note: "Tax balance detected in county record — status requires verification; not confirmed delinquency." },
        dedupeKey: `taxbal:${parcelId}` });
    }
    // Ownership motivation signal (absentee / entity / long-hold)
    const flags: string[] = [];
    if (absentee) flags.push("absentee");
    if (entity) flags.push("entity-owned");
    if ((holdYears ?? 0) >= 20) flags.push(`held ${holdYears}y`);
    if (flags.length) {
      const score = Math.min(100, 30 + (absentee ? 20 : 0) + (entity ? 15 : 0) + ((holdYears ?? 0) >= 20 ? 15 : 0));
      out.push({ ...base, sourceKey: "cuyahoga_parcels", category: "ownership" as SignalCategory,
        motivationScore: score,
        headline: `${flags.join(", ")} owner${city ? ` · ${city}` : ""}`,
        detail: { owner, mailStreet, mailCity: s(a.mail_city), mailState: s(a.mail_state), mailZip: s(a.mail_zip),
          absentee, entity, holdYears, countyMarketValue: value, landUse: s(a.tax_luc_description) },
        dedupeKey: `own:${parcelId}` });
    }
  }
  void retrievedAt;
  return out;
}
