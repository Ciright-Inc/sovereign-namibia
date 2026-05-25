import Link from "next/link";
import { SUBDOMAIN_LABELS } from "@/lib/subdomain";

const navLinks = [
  { href: "/find-account", label: "Find My Account" },
  { href: "/register", label: "Register" },
  { href: "https://news.sovereignnamibia.com", label: "News", external: true },
  { href: "https://services.sovereignnamibia.com", label: "Services", external: true },
  { href: "https://support.sovereignnamibia.com", label: "Support", external: true },
];

export function SiteHeader({ subdomain = "main" }: { subdomain?: string }) {
  const title = SUBDOMAIN_LABELS[subdomain as keyof typeof SUBDOMAIN_LABELS] ?? "Sovereign Namibia";

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(12,45,74,0.08)] bg-[rgba(248,246,242,0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col">
          <span className="sn-eyebrow">Republic of Namibia</span>
          <span className="text-lg font-semibold tracking-tight text-[var(--sn-blue)]">
            {title}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[rgba(12,45,74,0.65)] transition hover:text-[var(--sn-blue)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[rgba(12,45,74,0.65)] transition hover:text-[var(--sn-blue)]"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[rgba(12,45,74,0.08)] bg-white/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 md:flex-row md:justify-between">
        <div>
          <p className="sn-eyebrow">Sovereign Namibia</p>
          <p className="mt-2 max-w-sm sn-prose text-sm">
            Your information is protected. Official national digital identity infrastructure.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-[rgba(12,45,74,0.6)]">
          <Link href="/legal/privacy">Privacy Policy</Link>
          <Link href="/legal/terms">Terms of Use</Link>
          <Link href="/legal/rights">Citizen Rights</Link>
          <a href="https://status.sovereignnamibia.com">System Status</a>
        </div>
      </div>
      <div className="border-t border-[rgba(12,45,74,0.06)] px-6 py-4 text-center text-xs text-[rgba(12,45,74,0.45)]">
        © {new Date().getFullYear()} Sovereign Namibia. All rights reserved.
      </div>
    </footer>
  );
}
