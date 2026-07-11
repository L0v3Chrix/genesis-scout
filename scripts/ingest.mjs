/**
 * Ingest Cuyahoga signals into the genesis-scout Supabase project.
 * Usage: node --env-file=.env.local scripts/ingest.mjs [limit]
 * Uses the ops service login (RLS: signals writable via service; here we sign in as ops).
 * Idempotent via (source_key, dedupe_key) unique constraint.
 */
import { createClient } from "@supabase/supabase-js";
// tsx-less: replicate the connector fetch inline (Node can't import the TS module directly).
const ENDPOINT = "https://gis.cuyahogacounty.us/server/rest/services/CCFO/APPRAISAL_PARCELS_CAMA_WGS84/MapServer/2/query";
const FIELDS = "PARCELPIN,parcel_addr,parcel_street,parcel_suffix,parcel_city,parcel_zip,parcel_owner,mail_addr_street,mail_city,mail_state,mail_zip,tax_market_total,net_tax_total,grand_total_balance,last_transfer_date,tax_luc_description";
const REF_MS = 1783900800000;
const ENTITY_RE = /\b(LLC|L L C|TRUST|INC|LTD|LP|LLP|PROPERTIES|HOLDINGS|INVEST|CAPITAL|GROUP)\b/;
const NUM_STREET = /\b(RD|ST|AVE|BLVD|DR|LN|CT|PL|WAY|CIR|PKWY|TER)\b\.?/g;
const s = (v) => (v == null ? "" : String(v).trim());
const normStreet = (str) => str.toUpperCase().replace(NUM_STREET, "").replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
function centroid(g){ if(!g?.rings?.[0]?.length) return null; const r=g.rings[0];
  return {lat:r.reduce((a,p)=>a+p[1],0)/r.length, lon:r.reduce((a,p)=>a+p[0],0)/r.length}; }

async function fetchPage(limit, offset){
  const where=encodeURIComponent("tax_market_total > 20000 AND grand_total_balance > 0");
  const url=`${ENDPOINT}?where=${where}&outFields=${FIELDS}&orderByFields=grand_total_balance DESC&resultRecordCount=${limit}&resultOffset=${offset}&returnGeometry=true&outSR=4326&f=json`;
  const res=await fetch(url,{headers:{"User-Agent":"GenesisScout/1.0 (public-records research)"}});
  if(!res.ok) throw new Error("HTTP "+res.status);
  const j=await res.json(); if(j.error) throw new Error(JSON.stringify(j.error));
  return j.features||[];
}
function derive(feats){
  const out=[];
  for(const f of feats){ const a=f.attributes; const parcelId=s(a.PARCELPIN); if(!parcelId) continue;
    const addr=[s(a.parcel_addr),s(a.parcel_street),s(a.parcel_suffix)].filter(Boolean).join(" ").trim();
    const city=s(a.parcel_city), zip=s(a.parcel_zip).slice(0,5), geo=centroid(f.geometry);
    const owner=s(a.parcel_owner), mailStreet=s(a.mail_addr_street);
    const value=Number(a.tax_market_total)||0, tax=Number(a.net_tax_total)||0, bal=Number(a.grand_total_balance)||0;
    const xfer=a.last_transfer_date?Number(a.last_transfer_date):null;
    const holdYears=xfer?Math.round((REF_MS-xfer)/3.156e10):null;
    const absentee=!!mailStreet && normStreet(addr).slice(0,2).join(" ")!==normStreet(mailStreet).slice(0,2).join(" ");
    const entity=ENTITY_RE.test(owner.toUpperCase());
    const base={fips:"39035",address:addr||null,city:city||null,zip:zip||null,parcel_id:parcelId,
      lat:geo?.lat??null,lon:geo?.lon??null,source_as_of:null,classification:"source_observed",status:"active"};
    if(bal>tax+1){ const overBill=tax>0?bal/tax:2; const score=Math.min(100,45+Math.round(Math.min(overBill,4)*12));
      out.push({...base,source_key:"cuyahoga_parcels",category:"tax_delinquency",motivation_score:score,
        headline:`Outstanding tax balance detected${city?` · ${city}`:""}`,
        detail:{owner,mailStreet,mailCity:s(a.mail_city),mailState:s(a.mail_state),mailZip:s(a.mail_zip),
          countyMarketValue:value,annualTax:tax,balanceDetected:bal,holdYears,landUse:s(a.tax_luc_description),
          note:"Tax balance detected in county record — status requires verification; not confirmed delinquency."},
        dedupe_key:`taxbal:${parcelId}`}); }
    const flags=[]; if(absentee)flags.push("absentee"); if(entity)flags.push("entity-owned");
    if((holdYears??0)>=20)flags.push(`held ${holdYears}y`);
    if(flags.length){ const score=Math.min(100,30+(absentee?20:0)+(entity?15:0)+((holdYears??0)>=20?15:0));
      out.push({...base,source_key:"cuyahoga_parcels",category:"ownership",motivation_score:score,
        headline:`${flags.join(", ")} owner${city?` · ${city}`:""}`,
        detail:{owner,mailStreet,mailCity:s(a.mail_city),mailState:s(a.mail_state),mailZip:s(a.mail_zip),
          absentee,entity,holdYears,countyMarketValue:value,landUse:s(a.tax_luc_description)},
        dedupe_key:`own:${parcelId}`}); }
  }
  return out;
}

const limit=Number(process.argv[2]||400);
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const {error:authErr}=await db.auth.signInWithPassword({email:"ops@genesisscout.dev",password:process.env.OPS_PASSWORD||"ScoutOps!2026rotate"});
if(authErr){ console.error("auth:",authErr.message); process.exit(1); }
console.log("fetching",limit,"parcels…");
const feats=await fetchPage(limit,0);
const signals=derive(feats);
console.log("derived",signals.length,"signals from",feats.length,"parcels");
let ins=0, err=0;
for(let i=0;i<signals.length;i+=100){ const chunk=signals.slice(i,i+100);
  const {error}=await db.from("signals").upsert(chunk,{onConflict:"source_key,dedupe_key",ignoreDuplicates:false});
  if(error){ err++; console.error("chunk err:",error.message); } else ins+=chunk.length; }
console.log(`upserted ~${ins} signals (${err} chunk errors)`);
const {count}=await db.from("signals").select("id",{count:"exact",head:true});
console.log("total signals in db:",count);
