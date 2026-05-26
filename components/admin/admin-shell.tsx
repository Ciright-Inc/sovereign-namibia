"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/admin-rbac";
import { hasPermission, type Permission } from "@/lib/admin-rbac";

type AdminShellProps = {
  children: React.ReactNode;
  adminName?: string;
  adminRole?: string;
};

export function AdminShell({ children, adminName, adminRole }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = ADMIN_NAV.filter((item) => hasPermission(adminRole, item.permission as Permission));

  const navContent = (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b929a]">Sovereign Registry</p>
        <h1 className="mt-1 text-sm font-semibold text-white">National Admin Portal</h1>
        <p className="mt-1 text-xs text-[#6b7280]">Republic of Namibia</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-sm transition ${active ? "bg-white/10 text-white" : "text-[#9ca3af] hover:bg-white/5 hover:text-white"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-xs font-medium text-white">{adminName ?? "Administrator"}</p>
        <p className="truncate text-[10px] text-[#6b7280]">{adminRole ?? "Super Admin"}</p>
        <button
          type="button"
          className="mt-3 text-xs text-[#9ca3af] transition hover:text-white"
          onClick={() => fetch("/api/admin/auth/logout", { method: "POST" }).then(() => { window.location.href = "/admin"; })}
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#050608] text-[#e8eaed]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a0c0f] lg:flex">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-[#0a0c0f]">{navContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0a0c0f]/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded border border-white/15 px-2 py-1 text-xs text-white lg:hidden" onClick={() => setMobileOpen(true)}>
              Menu
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#6b7280]">Secure Infrastructure</p>
              <p className="text-sm text-[#d1d5db]">Sovereign Namibia Registry Network</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-400 sm:inline">
              Systems Operational
            </span>
            <Link href="/" className="text-xs text-[#9ca3af] hover:text-white">Public Site</Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
