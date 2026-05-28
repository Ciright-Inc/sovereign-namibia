"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NAMIBIA_REGIONS } from "@/lib/constants";
import { MAP_PIN_TYPES } from "@/lib/map/map-pins-constants";
import type { MapPinRecord } from "@/lib/map/map-pins-service";

export function MapPinsAdmin() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");
  const [pinType, setPinType] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [pins, setPins] = useState<MapPinRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const statusOptions = useMemo(() => ["pending", "verified", "rejected", "needs_more_info"], []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (region) params.set("region", region);
      if (pinType) params.set("pinType", pinType);
      if (verificationStatus) params.set("verificationStatus", verificationStatus);
      if (includeArchived) params.set("includeArchived", "1");
      const res = await fetch(`/api/admin/map-pins?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load pins");
      setPins(data.pins ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Infrastructure + Opportunity Layer</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Map Pins Administration</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
            Verified, auditable national infrastructure visibility — region-balanced, privacy-preserving, and appealable.
          </p>
        </div>
        <Link
          href="/admin/map-pins/new"
          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          New Pin
        </Link>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(); }}
        className="rounded-lg border border-white/10 bg-[#0f1115] p-5 space-y-4"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pin name, description…"
          className="w-full rounded-lg border border-white/15 bg-[#050608] px-4 py-3 text-sm text-white placeholder:text-[#6b7280]"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="">All regions</option>
            {NAMIBIA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={pinType} onChange={(e) => setPinType(e.target.value)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="">All types</option>
            {MAP_PIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="">All verification statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#050608] px-3 py-2 text-sm text-[#d1d5db]">
            <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
            Include archived
          </label>
          <button type="submit" disabled={loading} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
            {loading ? "Loading…" : "Search"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0f1115]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm text-[#9ca3af]">{total} pin{total === 1 ? "" : "s"} · Audit-ready</p>
          <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">Trust · Transparency · Inclusion</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#6b7280]">
                <th className="px-4 py-3 font-medium">Pin</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {pins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#6b7280]">
                    No pins found. Create a new pin to begin regional visibility.
                  </td>
                </tr>
              ) : (
                pins.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/admin/map-pins/${p.id}`} className="font-medium text-white hover:opacity-90">
                        {p.pin_name}
                      </Link>
                      {p.is_archived && <span className="ml-2 rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#9ca3af]">archived</span>}
                      {!p.is_active && <span className="ml-2 rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#9ca3af]">inactive</span>}
                      <p className="mt-1 font-mono text-[11px] text-[#6b7280]">{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</p>
                    </td>
                    <td className="px-4 py-3 text-[#d1d5db]">{p.pin_type}</td>
                    <td className="px-4 py-3 text-[#d1d5db]">{p.region ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-xs text-emerald-400/90">
                        {p.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#d1d5db]">
                      <span className="font-mono text-xs">{p.trust_rating}</span>
                      <span className="text-[#6b7280]"> / 100</span>
                    </td>
                    <td className="px-4 py-3 text-[#d1d5db]">
                      {(p.public_visibility_rules?.public ?? true) ? "Public" : "Restricted"}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{new Date(p.updated_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

