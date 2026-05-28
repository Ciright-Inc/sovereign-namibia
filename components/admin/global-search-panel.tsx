"use client";

import { useState } from "react";
import Link from "next/link";
import type { RegistryRecord } from "@/lib/registry-service";
import { NAMIBIA_PROVINCES } from "@/lib/registry-entity-schemas";

const ENTITY_TYPES = [
  { id: "all", label: "All" },
  { id: "government", label: "Government" },
  { id: "banking", label: "Banking" },
  { id: "healthcare", label: "Healthcare" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "business", label: "Business" },
  { id: "citizen", label: "Citizens" },
];

export function GlobalSearchPanel() {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [province, setProvince] = useState("");
  const [mode, setMode] = useState("standard");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [results, setResults] = useState<RegistryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (entityType !== "all") params.set("entityType", entityType);
      if (province) params.set("province", province);
      if (mode) params.set("mode", mode);
      if (lat && lng) { params.set("lat", lat); params.set("lng", lng); params.set("radiusKm", "100"); }
      const res = await fetch(`/api/admin/registry/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="rounded-lg border border-white/10 bg-[#0f1115] p-5 space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search registries, identifiers, addresses, metadata…"
          className="w-full rounded-lg border border-white/15 bg-[#050608] px-4 py-3 text-sm text-white placeholder:text-[#6b7280]"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            {ENTITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="">All provinces</option>
            {NAMIBIA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="standard">Standard</option>
            <option value="fuzzy">Fuzzy (trigram)</option>
            <option value="phonetic">Phonetic (similarity)</option>
            <option value="ai">AI-assisted</option>
          </select>
          <button type="submit" disabled={loading} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Map search — latitude" className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Map search — longitude" className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
        </div>
      </form>

      <p className="text-xs text-[#6b7280]">{total} results · All searches audit-logged</p>

      <div className="rounded-lg border border-white/10 bg-[#0f1115]">
        {results.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#6b7280]">Enter a query to search across all national registry domains.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {results.map((r) => (
              <li key={r.id} className="px-6 py-4">
                <Link href={`/admin/registry/${r.id}`} className="flex items-start justify-between gap-4 hover:opacity-90">
                  <div>
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="mt-1 font-mono text-xs text-emerald-400/90">{r.registry_id}</p>
                    {r.province && <p className="mt-1 text-xs text-[#6b7280]">{r.province} · {r.category}</p>}
                  </div>
                  <span className="shrink-0 rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#9ca3af]">{r.entity_type}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
