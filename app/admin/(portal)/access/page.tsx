import { requireAdmin } from "@/lib/require-admin";
import { ADMIN_ROLES, PERMISSIONS } from "@/lib/admin-rbac";

export default async function AdminAccessPage() {
  await requireAdmin("access.manage");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">RBAC</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Access Management</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Role-based access control with modular, expandable permissions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
          <h2 className="font-medium text-white">Roles</h2>
          <ul className="mt-4 space-y-2">
            {ADMIN_ROLES.map((role) => (
              <li key={role} className="rounded-md bg-white/[0.03] px-3 py-2 text-sm text-[#d1d5db]">
                {role}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
          <h2 className="font-medium text-white">Permissions Matrix</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {Object.entries(PERMISSIONS).map(([perm, roles]) => (
              <li key={perm} className="border-b border-white/5 pb-2">
                <p className="font-mono text-xs text-emerald-400/90">{perm}</p>
                <p className="mt-1 text-[#6b7280]">{(roles as readonly string[]).join(", ")}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
