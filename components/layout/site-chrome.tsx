"use client";

import Link from "next/link";
import { useState } from "react";
import { SUBDOMAIN_LABELS } from "@/lib/subdomain";
import { SiteFooter } from "@/components/layout/site-footer";
import { AdminLoginModal } from "@/components/admin/admin-login-modal";

export { SiteFooter };

const navLinks = [
  { href: "/find-account", label: "Create Account" },
  { href: "/find-account?signin=1", label: "Find My Account" },
  { href: "/map", label: "National Map" },
  { href: "/trust", label: "Trust Dashboard" },
  { href: "https://news.sovereignnamibia.com", label: "News", external: true },
  { href: "https://services.sovereignnamibia.com", label: "Services", external: true },
  { href: "https://support.sovereignnamibia.com", label: "Support", external: true },
];

export function SiteHeader({ subdomain = "main" }: { subdomain?: string }) {
  const title = SUBDOMAIN_LABELS[subdomain as keyof typeof SUBDOMAIN_LABELS] ?? "Sovereign Namibia";
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <>
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
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="rounded-md border border-[var(--sn-blue)]/20 bg-[var(--sn-blue)]/5 px-3 py-1.5 text-sm font-medium text-[var(--sn-blue)] transition hover:bg-[var(--sn-blue)]/10"
            >
              Admin Login
            </button>
          </nav>
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="rounded-md border border-[var(--sn-blue)]/20 px-3 py-1.5 text-sm font-medium text-[var(--sn-blue)] md:hidden"
          >
            Admin
          </button>
        </div>
      </header>
      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}
