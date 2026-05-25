import { isDatabaseReady } from "@/lib/db";

export default async function StatusSubdomainPage() {
  const dbOk = await isDatabaseReady();

  const services = [
    { name: "Public Website", status: "operational" },
    { name: "Citizen Directory", status: dbOk ? "operational" : "degraded" },
    { name: "KYC Verification", status: "operational" },
    { name: "Citizen Portal", status: "operational" },
    { name: "API Gateway", status: "operational" },
    { name: "Document Storage", status: dbOk ? "operational" : "degraded" },
    { name: "Telecom Verification", status: "operational" },
  ];

  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <header className="border-b border-[rgba(12,45,74,0.08)] px-6 py-8">
        <p className="sn-eyebrow">status.sovereignnamibia.com</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sn-blue)]">System Status</h1>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div
          className={`mb-8 rounded-xl p-6 text-center ${
            dbOk ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"
          }`}
        >
          {dbOk ? "All systems operational" : "Running in demo mode — database unavailable"}
        </div>

        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.name}
              className="sn-card flex items-center justify-between px-6 py-4"
            >
              <span className="font-medium text-[var(--sn-blue)]">{s.name}</span>
              <span
                className={`text-sm capitalize ${
                  s.status === "operational" ? "text-green-700" : "text-amber-700"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
