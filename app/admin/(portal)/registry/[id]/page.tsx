import { requireAdmin } from "@/lib/require-admin";
import { RegistryDetailView } from "@/components/admin/registry-detail-view";

export default async function RegistryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("registry.read");
  const { id } = await params;
  return <RegistryDetailView id={id} />;
}
