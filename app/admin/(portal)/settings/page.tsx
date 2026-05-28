import { requireAdmin } from "@/lib/require-admin";

export default async function AdminSettingsPage() {
  await requireAdmin("settings.manage");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Platform Configuration</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          National registry platform configuration, security policies, and deployment settings.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { label: "Session Duration", value: "8 hours (JWT)" },
          { label: "Password Hashing", value: "bcrypt (12 rounds)" },
          { label: "MFA", value: "Architecture ready (not yet enforced)" },
          { label: "Search Index", value: "PostgreSQL full-text + pg_trgm fuzzy + similarity-based phonetic" },
          { label: "Audit Logging", value: "Enabled — immutable hashes" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0f1115] px-5 py-4"
          >
            <span className="text-sm text-[#9ca3af]">{item.label}</span>
            <span className="text-sm font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
