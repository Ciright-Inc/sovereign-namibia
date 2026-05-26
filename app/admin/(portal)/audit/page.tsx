import { requireAdmin } from "@/lib/require-admin";
import { listAuditLogs } from "@/lib/audit-read";

export default async function AdminAuditPage() {
  await requireAdmin("audit.read");
  const logs = await listAuditLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Security & Compliance</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Audit Logs</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Immutable audit trail — logins, edits, exports, searches, deletions, and failed access attempts.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0f1115]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-[#9ca3af]">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-400/90">{log.action}</td>
                <td className="px-4 py-3 text-[#d1d5db]">
                  {log.actor_type}
                  {log.actor_id ? ` · ${log.actor_id.slice(0, 8)}` : ""}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{log.ip_address ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
