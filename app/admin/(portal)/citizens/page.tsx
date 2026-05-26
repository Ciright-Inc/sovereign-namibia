import { RegistryModulePage } from "@/components/admin/registry-module-page";

export default function CitizenRegistryPage() {
  return (
    <RegistryModulePage
      entityType="citizen"
      title="Citizen Registry"
      description="Secure sovereign citizen directory with privacy-first architecture. Sensitive fields require elevated permissions and are access-logged."
      privacyNotice="Privacy-first: citizen records require permissioned access, support field masking, consent workflows, and full audit history. PII is encrypted at rest."
    />
  );
}
