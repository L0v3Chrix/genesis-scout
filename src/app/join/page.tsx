"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Join() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) { setErr("Please accept the terms to continue."); return; }
    setBusy(true); setErr(null);
    const db = supabaseBrowser();
    const { error } = await db.auth.signUp({ email, password });
    if (error) { setErr(error.message); setBusy(false); return; }
    await db.auth.signInWithPassword({ email, password });
    router.push("/app"); router.refresh();
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] p-8">
        <h1 className="text-xl font-bold">Start free</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">Browse the signal feed. Upgrade later for full records and exports.</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[color:var(--color-line-strong)] px-3 py-2" />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[color:var(--color-line-strong)] px-3 py-2" />
        <label className="mt-4 flex items-start gap-2 text-xs text-[color:var(--color-ink-muted)]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
          <span>I understand Scout provides public-record research signals only — not a consumer report — and I am responsible for TCPA/DNC compliance and applicable laws when contacting property owners.</span>
        </label>
        {err && <p className="mt-3 text-sm text-[color:var(--color-negative)]" role="alert">{err}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-[color:var(--color-accent-strong)] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create free account"}</button>
      </form>
    </main>
  );
}
