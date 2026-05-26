import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { listRegistryRecords } from "@/lib/registry-service";
import { RegistryTable } from "@/components/admin/registry-table";
import type { RegistryEntityType } from "@/lib/admin-rbac";

type RegistryModulePageProps = {
  entityType: RegistryEntityType;
  path: string;
  title: string;
  description: string;
  privacyNotice?: string;
  canWrite?: boolean;
};

export async function RegistryModulePage({
  entityType,
  path,
  title,
  description,
  privacyNotice,
}: RegistryModulePageProps) {
  await requireAdmin("registry.read");
  const { records, total } = await listRegistryRecords(entityType, { limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">National Registry</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#9ca3af]">{description}</p>
          {privacyNotice && (
            <p className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90">
              {privacyNotice}
            </p>
          )}
        </div>
        <Link
          href={`/admin/registry/new/${path}`}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90"
        >
          + New Record
        </Link>
      </div>

      <RegistryTable records={records} total={total} entityType={entityType} />
    </div>
  );
}
