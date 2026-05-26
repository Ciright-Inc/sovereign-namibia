import Link from "next/link";
import { getAnalyticsSummary } from "@/lib/keyra-persistence";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminAnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const stats = await getAnalyticsSummary();

  const cards = [
    { label: "Total Visitors", value: stats.totalVisitors },
    { label: "Namibia Visitors", value: stats.namibiaVisitors },
    { label: "Blocked Non-Namibia", value: stats.blockedNonNamibia },
    { label: "Mobile Users", value: stats.mobileUsers },
    { label: "Desktop Users", value: stats.desktopUsers },
    { label: "QR Generated", value: stats.qrGenerated },
    { label: "QR Scanned", value: stats.qrScanned },
    { label: "OTP Requested", value: stats.otpRequested },
    { label: "OTP Verified", value: stats.otpVerified },
    { label: "OTP Success Rate", value: stats.otpRequested ? `${Math.round((stats.otpVerified / stats.otpRequested) * 100)}%` : "—" },
    { label: "QR Conversion", value: stats.qrGenerated ? `${Math.round((stats.qrScanned / stats.qrGenerated) * 100)}%` : "—" },
    { label: "Registry Searches", value: stats.searchAttempts },
    { label: "Match Found", value: stats.matchFound },
    { label: "Match Not Found", value: stats.matchNotFound },
    { label: "Pending Verifications", value: stats.pendingVerifications },
    { label: "Failed OTP", value: stats.failedOtp },
    { label: "Failed Admin Logins", value: stats.failedAdminLogin },
  ];

  return (
    <div className="min-h-screen bg-[#0c1a2e] text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <Link href="/admin/dashboard" className="text-xs text-white/40 hover:text-white/70">← Dashboard</Link>
        <h1 className="mt-2 text-2xl font-semibold">KEYRA Analytics</h1>
        <p className="mt-1 text-sm text-white/50">keyra.ie/countries/namibia/sovereign-registry</p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
