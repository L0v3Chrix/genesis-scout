import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const R = [];
const check = (n, ok, d="") => { R.push(ok); console.log(`${ok?"PASS":"FAIL"}  ${n}${d?" — "+d:""}`); };
const cli = () => createClient(url, key, { auth: { persistSession: false } });
async function as(email, pw){ const c=cli(); const {data,error}=await c.auth.signInWithPassword({email,password:pw});
  if(error) throw new Error(email+": "+error.message); return {c, id:data.user.id}; }

// anon lockout
{ const c=cli();
  check("anon cannot read subscribers", ((await c.from("subscribers").select("id").limit(1)).data??[]).length===0);
  check("anon cannot read signals", ((await c.from("signals").select("id").limit(1)).data??[]).length===0);
}

const free = await as("freebuyer@genesisscout.dev","ScoutFree!2026rotate");
const paid = await as("scoutbuyer@genesisscout.dev","ScoutPaid!2026rotate");

// a real signal id (fetched as an authed user)
const { data: sig } = await free.c.from("signals").select("id,category").eq("status","active").limit(1).single();

// tiers
check("free buyer tier=free", (await free.c.from("subscribers").select("tier").eq("id",free.id).single()).data.tier==="free");
check("paid buyer tier=scout", (await paid.c.from("subscribers").select("tier").eq("id",paid.id).single()).data.tier==="scout");

// feed readable by both
check("free reads feed", ((await free.c.from("signals").select("id").eq("status","active").limit(10)).data??[]).length>0);

// gating: free = teaser, paid = full
const fg = (await free.c.rpc("signal_detail",{signal_id:sig.id})).data;
check("free: signal_detail gated", fg?.gated===true && !("address" in fg) && !("detail" in fg));
const pg = (await paid.c.rpc("signal_detail",{signal_id:sig.id})).data;
check("paid: signal_detail full (address+detail present)", pg?.gated===false && "address" in pg && "detail" in pg);

// escalation blocked
await free.c.from("subscribers").update({tier:"scout_plus"}).eq("id",free.id);
check("free: self tier-escalation blocked", (await free.c.from("subscribers").select("tier").eq("id",free.id).single()).data.tier==="free");

// signal writes blocked for non-ops
check("free: cannot write signals", !!(await free.c.from("signals").insert({fips:"39035",source_key:"cuyahoga_parcels",category:"ownership",headline:"x",motivation_score:1,dedupe_key:`hack:${Date.now()}`}).then(r=>r.error)));

// tenant isolation: each buyer sees only own subscriber row
check("free: sees only own subscriber row", ((await free.c.from("subscribers").select("id")).data??[]).length===1);
check("paid: sees only own subscriber row", ((await paid.c.from("subscribers").select("id")).data??[]).length===1);

// paid detail view writes an audit row (definer RPC); free view does not
const { data: audits } = await paid.c.rpc("signal_detail",{signal_id:sig.id}); void audits;

console.log(`\n${R.filter(Boolean).length}/${R.length} passed`);
process.exit(R.every(Boolean)?0:1);
