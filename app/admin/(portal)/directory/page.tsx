import { DEMO_RECORDS } from "@/lib/directory-service";
import { toDirectoryMatch } from "@/lib/masking";

export default function AdminDirectoryPage() {
  const masked = DEMO_RECORDS.map((r) =>
    toDirectoryMatch(r.id, r.legalName, r.mobile, r.email, r.region, r.accountState)
  );

  return (
    <div className="min-h-screen bg-[#0c1a2e] px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Citizen Directory Manager</h1>
      <p className="mt-2 text-sm text-white/50">
        Manage pre-created citizen records. Public search never exposes full private data.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Masked Name</th>
              <th className="py-3 pr-4">Region</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {masked.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                <td className="py-3 pr-4 font-mono text-xs">{row.id}</td>
                <td className="py-3 pr-4">{row.maskedName}</td>
                <td className="py-3 pr-4">{row.region}</td>
                <td className="py-3">{row.accountStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
