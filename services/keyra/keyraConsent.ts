import type { KeyraContext } from "./types";
import { writeAuditLog } from "@/lib/audit";
import { getKeyraObjectId } from "./keyraClient";

export const KeyraConsent = {
  async captureConsent(input: {
    accepted: boolean;
    consentType: "terms" | "privacy" | "registry_lookup";
    ctx: KeyraContext;
  }) {
    await writeAuditLog({
      actorType: "citizen",
      actorId: input.ctx.user_id,
      action: input.accepted ? "keyra.consent.accepted" : "keyra.consent.rejected",
      resourceType: "keyra_object",
      resourceId: getKeyraObjectId(),
      metadata: { consent_type: input.consentType },
      ipAddress: input.ctx.ip_address,
    });
    return { recorded: true, consent_type: input.consentType, accepted: input.accepted };
  },
};

import { KeyraAudit } from "./keyraAudit";