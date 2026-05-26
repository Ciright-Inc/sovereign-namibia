import { requireAdmin } from "@/lib/require-admin";
import { RegistryImportPanel } from "@/components/admin/registry-import-panel";

export default async function AdminImportsPage() {
  await requireAdmin("import.data");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Enterprise Ingestion</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Data Imports</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
          Bulk import engine supporting CSV, Excel, JSON, XML, and API ingestion with validation, duplicate detection, field mapping, import history, and rollback support.
        </p>
      </div>
      <RegistryImportPanel />
    </div>
  );
}
