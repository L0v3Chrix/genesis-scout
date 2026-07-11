import Link from "next/link";
import { TierBadge } from "./ui";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-bold">Scout</Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/pricing" className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">Pricing</Link>
            <Link href="/login" className="font-semibold text-[color:var(--color-accent-strong)]">Log in</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-[color:var(--color-line)] px-6 py-8 text-center text-xs text-[color:var(--color-ink-muted)]">
        Scout aggregates public-record signals for lead research. Not a consumer report; not for FCRA-regulated decisions.
        Subscribers are responsible for TCPA/DNC compliance when contacting owners. © 2026 Genesis Labs.
      </footer>
    </div>
  );
}

type NavItem = { href: string; label: string };
export function AppShell({ appName, tier, userEmail, nav, signOut, children }:
  { appName: string; tier: string; userEmail: string; nav: NavItem[]; signOut: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col bg-[color:var(--color-rail)] px-4 py-5 text-[color:var(--color-rail-ink)] sm:flex">
        <Link href="/app" className="px-2 text-lg font-bold">{appName}</Link>
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((n) => <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-[color:var(--color-rail-ink-muted)] hover:bg-[color:var(--color-rail-raised)] hover:text-[color:var(--color-rail-ink)]">{n.label}</Link>)}
        </nav>
        <div className="mt-auto border-t border-[color:var(--color-rail-line)] pt-3 text-xs text-[color:var(--color-rail-ink-muted)]">{userEmail}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[color:var(--color-line)] bg-[color:var(--color-surface-raised)] px-6">
          <TierBadge tier={tier} />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[color:var(--color-ink-muted)] sm:hidden">{userEmail}</span>
            {signOut}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-ink-muted)]">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
