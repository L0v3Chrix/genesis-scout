import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell";
import Feed from "./feed";

export default async function AppHome({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  const { data: sub } = await db.from("subscribers").select("tier").eq("id", user!.id).maybeSingle();
  const { data: counties } = await db.from("counties").select("fips,name,state").eq("active", true).order("name");
  const { data: sources } = await db.from("signal_sources").select("key,name,category,terms_class,terms_note");
  return (
    <div>
      <PageHeader title="Signal feed" description="Public-record motivated-seller signals for active counties. Free plan shows teasers; upgrade to unlock full records and exports." />
      <Feed tier={sub?.tier ?? "free"} counties={counties ?? []} sources={sources ?? []} initial={sp} />
    </div>
  );
}
