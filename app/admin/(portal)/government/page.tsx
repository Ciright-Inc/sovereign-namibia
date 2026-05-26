import { RegistryModulePage } from "@/components/admin/registry-module-page";

export default function GovernmentRegistryPage() {
  return (
    <RegistryModulePage
      entityType="government"
      path="government"
      title="Government Registry"
      description="Comprehensive Namibia government directory — ministries, regulators, courts, municipalities, public agencies, state-owned enterprises, departments, commissions, and authorities."
    />
  );
}
