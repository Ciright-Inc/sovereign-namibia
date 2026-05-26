import { requireAdmin } from "@/lib/require-admin";

export default async function AdminApiPage() {
  await requireAdmin("api.manage");

  const endpoints = [
    { method: "GET", path: "/api/admin/registry/search?q=", desc: "Global registry search" },
    { method: "GET", path: "/api/admin/registry?entityType=", desc: "List registry by type" },
    { method: "POST", path: "/api/admin/registry", desc: "Create registry record" },
    { method: "POST", path: "/api/admin/auth/login", desc: "Admin authentication" },
    { method: "GET", path: "/api/directory/search", desc: "Citizen directory (session-gated)" },
    { method: "GET", path: "/api/status", desc: "Platform status" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Sovereign API</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">API Management</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          REST endpoints for national registry access. GraphQL gateway planned. Rate limiting and throttling enabled.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0f1115]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Endpoint</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep) => (
              <tr key={ep.path} className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{ep.method}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#d1d5db]">{ep.path}</td>
                <td className="px-4 py-3 text-[#9ca3af]">{ep.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
