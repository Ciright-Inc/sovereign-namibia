import { RegistryModulePage } from "@/components/admin/registry-module-page";

export default function BankingRegistryPage() {
  return (
    <RegistryModulePage
      entityType="banking"
      title="Banking Registry"
      description="National banking directory — commercial banks, investment banks, development banks, microfinance, payment platforms, and mobile money operators."
    />
  );
}
