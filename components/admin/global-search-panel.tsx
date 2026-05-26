"use client";

import { useState } from "react";
import type { RegistryRecord } from "@/lib/registry-service";

export function GlobalSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registry/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search registries, identifiers, addresses…"
          className="flex-1 rounded-lg border border-white/15 bg-[#0f1115] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] focus:border-white/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="rounded-lg border border-white/10 bg-[#0f1115]">
        {results.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#6b7280]">
            Enter a query to search across all national registry domains.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {results.map((r) => (
              <li key={r.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="mt-1 font-mono text-xs text-emerald-400/90">{r.registry_id}</p>
                  </div>
                  <span className="shrink-0 rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#9ca3af]">
                    {r.entity_type}
                  </span>
                </div>
                {r.description && (
                  <p className="mt-2 text-sm text-[#6b7280] line-clamp-2">{r.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
