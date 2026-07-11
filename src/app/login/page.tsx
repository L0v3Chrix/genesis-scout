"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function Form() {
  const router = useRouter(); const params = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); setBusy(false); return; }
    router.push(params.get("next") ?? "/app"); router.refresh();
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] p-8">
        <h1 className="text-xl font-bold">Sign in to Scout</h1>
        <label className="mt-6 block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[color:var(--color-line-strong)] px-3 py-2" />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[color:var(--color-line-strong)] px-3 py-2" />
        {err && <p className="mt-3 text-sm text-[color:var(--color-negative)]" role="alert">{err}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-[color:var(--color-accent-strong)] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
        <p className="mt-4 text-sm text-[color:var(--color-ink-muted)]">No account? <a href="/join" className="text-[color:var(--color-accent-strong)] hover:underline">Start free</a></p>
      </form>
    </main>
  );
}
export default function Login() { return <Suspense><Form /></Suspense>; }
