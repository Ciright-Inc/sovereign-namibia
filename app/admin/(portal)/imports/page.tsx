import { requireAdmin } from "@/lib/require-admin";

export default async function AdminImportsPage() {
  await requireAdmin("import.data");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Enterprise Ingestion</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Data Imports</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
          Bulk import engine supporting CSV, Excel, JSON, XML, and API ingestion with validation,
          duplicate detection, field mapping, import history, and rollback support.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {["CSV", "Excel", "JSON", "XML", "API"].map((format) => (
          <div
            key={format}
            className="rounded-lg border border-dashed border-white/15 bg-[#0f1115] p-6"
          >
            <p className="font-medium text-white">{format} Import</p>
            <p className="mt-2 text-sm text-[#6b7280]">
              Upload or configure {format} ingestion pipeline. Validation and duplicate detection enabled.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md border border-white/15 px-4 py-2 text-sm text-[#9ca3af]"
              disabled
            >
              Configure (coming soon)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
