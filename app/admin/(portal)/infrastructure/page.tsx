import { RegistryModulePage } from "@/components/admin/registry-module-page";

export default function InfrastructureRegistryPage() {
  return (
    <RegistryModulePage
      entityType="infrastructure"
      title="Infrastructure Registry"
      description="Strategic national infrastructure — NAMPOWER, NSX, telecom, utilities, ports, airports, rail, energy, water, and data centers."
    />
  );
}
