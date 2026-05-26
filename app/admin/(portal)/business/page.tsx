import { RegistryModulePage } from "@/components/admin/registry-module-page";

export default function BusinessRegistryPage() {
  return (
    <RegistryModulePage
      entityType="business"
      title="Business Registry"
      description="National business registry — registration numbers, tax IDs, industry classification, ownership, licenses, and compliance status."
    />
  );
}
