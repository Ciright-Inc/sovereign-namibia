"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export function RegistryImportPanel() {
  const [format, setFormat] = useState<"csv" | "json" | "xml">("csv");
  const [entityType, setEntityType] = useState<RegistryEntityType>("government");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [imports, setImports] = useState<Array<Record<string, unknown>>>([]);

  async function loadImports() {
    const res = await fetch("/api/admin/registry/import");
    if (res.ok) { const data = await res.json(); setImports(data.imports ?? []); }
  }

  useEffect(() => { loadImports(); }, []);

  async function handleImport() {
    if (!content.trim()) { toast.error("Paste or upload content first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registry/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, entityType, content, filename: `import.${format}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast.success(`Imported ${data.recordsImported}/${data.recordsTotal} records`);
      if (data.errors?.length) toast.warning(`${data.recordsFailed} rows failed validation`);
      loadImports();
      setContent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback(id: string) {
    if (!confirm("Rollback this import? Created records will be deleted.")) return;
    const res = await fetch(`/api/admin/registry/import?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Import rolled back"); loadImports(); }
    else toast.error("Rollback failed");
  }

  const sampleCsv = "name,acronym,category,province,description\nExample Ministry,EM,Ministry,Khomas,Sample import record";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6 space-y-4">
        <h2 className="font-medium text-white">Bulk Import Engine</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <select value={format} onChange={(e) => setFormat(e.target.value as "csv" | "json" | "xml")} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="csv">CSV / Excel</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value as RegistryEntityType)} className="rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
            <option value="government">Government</option>
            <option value="banking">Banking</option>
            <option value="healthcare">Healthcare</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="business">Business</option>
            <option value="citizen">Citizen</option>
          </select>
          <button type="button" onClick={() => setContent(sampleCsv)} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#9ca3af]">
            Load sample CSV
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Paste CSV, JSON, or XML content…"
          className="w-full rounded-lg border border-white/15 bg-[#050608] px-4 py-3 font-mono text-xs text-white"
        />
        <button type="button" onClick={handleImport} disabled={loading} className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50">
          {loading ? "Importing…" : "Run Import (validation + duplicate detection)"}
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
        <h2 className="font-medium text-white">Import History</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {imports.length === 0 ? (
            <li className="text-[#6b7280]">No imports yet</li>
          ) : (
            imports.map((imp) => (
              <li key={String(imp.id)} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white/[0.03] px-3 py-2">
                <span className="text-[#9ca3af]">
                  {String(imp.format).toUpperCase()} · {String(imp.entity_type)} · {String(imp.records_imported)}/{String(imp.records_total)} · {String(imp.status)}
                </span>
                {imp.status !== "rolled_back" && !imp.rolled_back_at && (
                  <button type="button" onClick={() => handleRollback(String(imp.id))} className="text-xs text-red-400 hover:underline">
                    Rollback
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
