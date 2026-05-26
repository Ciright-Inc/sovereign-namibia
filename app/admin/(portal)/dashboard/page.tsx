import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { getRegistryStats } from "@/lib/registry-service";
import { listAuditLogs } from "@/lib/audit-read";
import { REGISTRY_ENTITY_TYPES } from "@/lib/admin-rbac";

export default async function AdminDashboardPage() {
  await requireAdmin("registry.read");
  const [stats, recentAudit] = await Promise.all([getRegistryStats(), listAuditLogs(8)]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Command Center</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">National Registry Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
          Centralized sovereign record system — searchable, indexed, audit-logged, and API accessible.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REGISTRY_ENTITY_TYPES.map((entity) => (
          <Link
            key={entity.id}
            href={entity.path}
            className="rounded-lg border border-white/10 bg-[#0f1115] p-5 transition hover:border-white/20 hover:bg-[#141820]"
          >
            <p className="text-xs text-[#6b7280]">{entity.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {stats[entity.id] ?? 0}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-500/80">Indexed</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-white">Registry Overview</h2>
            <span className="text-xs text-[#6b7280]">{stats.total ?? 0} total records</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Verified Records", value: "—", note: "Cross-registry verification pipeline" },
              { label: "Pending Verification", value: "—", note: "Awaiting institutional review" },
              { label: "API Endpoints", value: "REST + GraphQL ready", note: "Sovereign data architecture" },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between border-b border-white/5 pb-3 last:border-0">
                <div>
                  <p className="text-sm text-[#d1d5db]">{item.label}</p>
                  <p className="text-xs text-[#6b7280]">{item.note}</p>
                </div>
                <p className="text-sm font-medium text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-white">Recent Audit Activity</h2>
            <Link href="/admin/audit" className="text-xs text-[#9ca3af] hover:text-white">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="rounded-md bg-white/[0.03] px-3 py-2 text-xs">
                <span className="font-mono text-emerald-400/90">{entry.action}</span>
                <span className="mx-2 text-[#6b7280]">·</span>
                <span className="text-[#9ca3af]">{new Date(entry.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
        <h2 className="font-medium text-white">Legacy Modules</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { href: "/admin/verifications", label: "Verification Queue" },
            { href: "/admin/kyc", label: "KYC Review" },
            { href: "/admin/directory", label: "Citizen Directory" },
            { href: "/admin/cms", label: "CMS Manager" },
            { href: "/admin/analytics", label: "KEYRA Analytics" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#9ca3af] hover:border-white/20 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
