import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { RegistryForm } from "@/components/admin/registry-form";
import type { RegistryEntityType } from "@/lib/admin-rbac";

const PATH_MAP: Record<string, RegistryEntityType> = {
  government: "government",
  banking: "banking",
  healthcare: "healthcare",
  infrastructure: "infrastructure",
  business: "business",
  citizens: "citizen",
};

export default async function RegistryNewPage({ params }: { params: Promise<{ entityType: string }> }) {
  await requireAdmin("registry.write");
  const { entityType: path } = await params;
  const entityType = PATH_MAP[path];
  if (!entityType) return <p className="text-red-400">Invalid entity type.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/${path}`} className="text-sm text-[#9ca3af] hover:text-white">← Back</Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">Create Registry Record</h1>
      </div>
      <RegistryForm entityType={entityType} />
    </div>
  );
}
