import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell";
import { signOut } from "./actions";

const NAV = [{ href: "/app", label: "Signal feed" }, { href: "/app/saved", label: "Saved searches" }, { href: "/account", label: "Account & plan" }];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: sub } = await db.from("subscribers").select("tier").eq("id", user.id).maybeSingle();
  return (
    <AppShell appName="Scout" tier={sub?.tier ?? "free"} userEmail={user.email ?? ""} nav={NAV}
      signOut={<form action={signOut}><button className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">Sign out</button></form>}>
      {children}
    </AppShell>
  );
}
