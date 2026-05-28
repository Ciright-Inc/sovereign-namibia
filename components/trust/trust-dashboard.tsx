"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NAMIBIA_REGIONS } from "@/lib/constants";

type TrustMetrics = {
  totalPublicPins: number;
  verifiedPublicPins: number;
  regionsCovered: number;
  regionalCoverage: Array<{ region: string; total: number; verified: number }>;
  correctionStats: { submitted: number; inReview: number; approved: number; rejected: number };
};

export function TrustDashboard() {
  const [data, setData] = useState<TrustMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/trust");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load trust metrics");
        setData(json);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load trust metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const regionRows = useMemo(() => {
    const rows = data?.regionalCoverage ?? [];
    const by = new Map(rows.map((r) => [r.region, r]));
    // Ensure all 14 regions are represented (balance principle)
    const normalized = NAMIBIA_REGIONS.map((r) => by.get(r) ?? { region: r, total: 0, verified: 0 });
    // Keep Unknown at end if present
    if (by.has("Unknown")) normalized.push(by.get("Unknown")!);
    return normalized;
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="sn-card p-8">
        <p className="sn-eyebrow">Public Trust Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--sn-blue)]">Trust · Transparency · Accountability</h1>
        <p className="mt-4 sn-prose text-sm">
          Public visibility with constitutional respect: infrastructure transparency without exposing private citizen data.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/map" className="sn-btn sn-btn-primary">View Map</Link>
          <a href="#rights" className="sn-btn sn-btn-outline">Your Rights</a>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Public pins", value: data?.totalPublicPins ?? 0, hint: "Visible to everyone (with safeguards)" },
          { label: "Verified pins", value: data?.verifiedPublicPins ?? 0, hint: "Verified with authority + timestamp" },
          { label: "Regions covered", value: data?.regionsCovered ?? 0, hint: "Balanced national representation" },
          { label: "Corrections submitted", value: data?.correctionStats.submitted ?? 0, hint: "Public correction workflow" },
        ].map((c) => (
          <div key={c.label} className="sn-card p-6">
            <p className="text-xs text-[rgba(12,45,74,0.6)]">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--sn-blue)]">{loading ? "—" : c.value}</p>
            <p className="mt-2 text-xs text-[rgba(12,45,74,0.55)]">{c.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 sn-card p-6">
          <h2 className="font-semibold text-[var(--sn-blue)]">Regional coverage balance</h2>
          <p className="mt-2 text-sm text-[rgba(12,45,74,0.65)]">
            Every region is represented equally in the dashboard — to avoid urban or coastal dominance.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(12,45,74,0.12)] text-[10px] uppercase tracking-wider text-[rgba(12,45,74,0.55)]">
                  <th className="py-3 pr-3">Region</th>
                  <th className="py-3 pr-3">Public pins</th>
                  <th className="py-3 pr-3">Verified</th>
                  <th className="py-3 pr-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => {
                  const pct = r.total === 0 ? 0 : Math.round((r.verified / r.total) * 100);
                  return (
                    <tr key={r.region} className="border-b border-[rgba(12,45,74,0.08)]">
                      <td className="py-3 pr-3 font-medium text-[var(--sn-blue)]">{r.region}</td>
                      <td className="py-3 pr-3 tabular-nums text-[rgba(12,45,74,0.72)]">{r.total}</td>
                      <td className="py-3 pr-3 tabular-nums text-[rgba(12,45,74,0.72)]">{r.verified}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-36 overflow-hidden rounded-full bg-[rgba(12,45,74,0.08)]">
                            <div className="h-2 bg-[var(--sn-blue)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[rgba(12,45,74,0.6)]">{pct}% verified</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="sn-card p-6">
            <h2 className="font-semibold text-[var(--sn-blue)]">Correction & appeal</h2>
            <p className="mt-2 text-sm text-[rgba(12,45,74,0.65)]">
              Corrections are reviewable, auditable, and neutral — designed to protect dignity and fairness.
            </p>
            <div className="mt-4 grid gap-2">
              {[
                ["Submitted", data?.correctionStats.submitted ?? 0],
                ["In review", data?.correctionStats.inReview ?? 0],
                ["Approved", data?.correctionStats.approved ?? 0],
                ["Rejected", data?.correctionStats.rejected ?? 0],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-[rgba(12,45,74,0.12)] bg-white px-4 py-3">
                  <span className="text-sm text-[rgba(12,45,74,0.7)]">{k}</span>
                  <span className="font-mono text-sm text-[var(--sn-blue)]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="rights" className="sn-card p-6">
            <p className="sn-eyebrow">Your Rights</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--sn-blue)]">Privacy-first public infrastructure</h2>
            <ul className="mt-4 space-y-2 text-sm text-[rgba(12,45,74,0.7)]">
              <li><strong>Ownership:</strong> citizens retain ownership of personal data.</li>
              <li><strong>Public vs private:</strong> the map shows infrastructure, not people’s private records.</li>
              <li><strong>Consent:</strong> participation is optional and consent-based.</li>
              <li><strong>Appeal:</strong> verification decisions are transparent and appealable.</li>
              <li><strong>Protection:</strong> sensitive infrastructure can be restricted for safety.</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="mt-8 sn-card p-8">
        <h2 className="font-semibold text-[var(--sn-blue)]">Anti-corruption & fairness principles</h2>
        <p className="mt-3 text-sm text-[rgba(12,45,74,0.65)]">
          No paid visibility preference. No political ranking systems. Administrator actions are audit-logged.
          Fairness through transparency — for every region.
        </p>
      </section>
    </div>
  );
}

