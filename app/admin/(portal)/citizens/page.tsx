import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminSession } from "@/lib/auth";
import { listCitizenRegistry } from "@/lib/citizen-registry-service";

export default async function CitizenRegistryPage() {
  const session = await requireAdmin("citizen.read");
  const { citizens, total, sensitiveAccess } = await listCitizenRegistry(session.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Privacy-First</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Citizen Registry</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#9ca3af]">
            Secure sovereign citizen directory. Sensitive fields require elevated permissions, are encrypted at rest, access-logged, and masked by default.
          </p>
          <p className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90">
            {sensitiveAccess
              ? "Elevated access granted — full PII visible. All views are audit-logged."
              : "Standard access — PII is masked. Request Security Officer role for sensitive fields."}
          </p>
        </div>
        <Link href="/admin/registry/new/citizens" className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black">
          + New Citizen Record
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0f1115]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-4 py-3">Registry ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Digital ID</th>
              <th className="px-4 py-3">Consent</th>
              {sensitiveAccess && <th className="px-4 py-3">National ID</th>}
            </tr>
          </thead>
          <tbody>
            {citizens.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-emerald-400/90">
                  <Link href={`/admin/registry/${c.id}`} className="hover:underline">{c.registry_id}</Link>
                </td>
                <td className="px-4 py-3 text-white">{c.name}</td>
                <td className="px-4 py-3 text-[#9ca3af]">{c.province ?? "—"}</td>
                <td className="px-4 py-3 text-[#9ca3af]">{c.digital_identity_status ?? "—"}</td>
                <td className="px-4 py-3 text-[#9ca3af]">{c.consent_status ?? "—"}</td>
                {sensitiveAccess && <td className="px-4 py-3 font-mono text-xs">{c.national_id ?? c.masked_national_id ?? "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-white/10 px-4 py-3 text-xs text-[#6b7280]">{total} citizen records</p>
      </div>
    </div>
  );
}
