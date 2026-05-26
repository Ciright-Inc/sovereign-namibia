import type { RegistryRecord } from "@/lib/registry-service";
import type { RegistryEntityType } from "@/lib/admin-rbac";

type RegistryTableProps = {
  records: RegistryRecord[];
  total: number;
  entityType: RegistryEntityType;
};

export function RegistryTable({ records, total, entityType }: RegistryTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0f1115]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm text-[#9ca3af]">
          {total} indexed {entityType} record{total === 1 ? "" : "s"}
        </p>
        <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">Normalized · Audited</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-4 py-3 font-medium">Registry ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Province</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Verification</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#6b7280]">
                  No records indexed yet. Use Data Imports or API ingestion.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-emerald-400/90">{record.registry_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{record.name}</p>
                    {record.acronym && <p className="text-xs text-[#6b7280]">{record.acronym}</p>}
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af]">{record.category ?? "—"}</td>
                  <td className="px-4 py-3 text-[#9ca3af]">{record.province ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-white/10 px-2 py-0.5 text-xs capitalize text-[#d1d5db]">
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs capitalize ${
                        record.verification_status === "verified"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {record.verification_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
