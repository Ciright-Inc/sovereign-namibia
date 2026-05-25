import Link from "next/link";
import { listPendingKycReviews } from "@/lib/kyc-service";
import { getPublishedArticles } from "@/lib/cms-service";

export default async function AdminDashboardPage() {
  const [kycQueue, articles] = await Promise.all([
    listPendingKycReviews(),
    getPublishedArticles(5),
  ]);

  const nav = [
    { href: "/admin/cms", label: "CMS Manager" },
    { href: "/admin/directory", label: "Citizen Directory" },
    { href: "/admin/kyc", label: "KYC Review" },
    { href: "/admin/moderation", label: "Moderation Queue" },
    { href: "/admin/audit", label: "Audit Logs" },
    { href: "/admin/health", label: "System Health" },
  ];

  return (
    <div className="min-h-screen bg-[#0c1a2e] text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <p className="text-xs uppercase tracking-widest text-white/50">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-semibold">Dashboard</h1>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium">KYC Review Queue</h2>
            <p className="mt-1 text-sm text-white/50">{kycQueue.length} pending reviews</p>
            <div className="mt-4 space-y-2">
              {kycQueue.length === 0 ? (
                <p className="text-sm text-white/40">No pending applications.</p>
              ) : (
                kycQueue.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/kyc/${item.id}`}
                    className="flex justify-between rounded-lg bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                  >
                    <span>{item.id.slice(0, 8)}…</span>
                    <span className="text-white/50">{item.status}</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium">Recent Published Articles</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {articles.map((a) => (
                <li key={a.id}>{a.title}</li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Duplicate Detection", value: "0 flagged" },
              { label: "Fraud Review", value: "0 active" },
              { label: "Telecom Pending", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">{stat.label}</p>
                <p className="mt-2 text-lg font-medium">{stat.value}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
