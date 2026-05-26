import type { KeyraContext } from "./types";
import { writeAuditLog } from "@/lib/audit";
import { getKeyraObjectId } from "./keyraClient";

export const KeyraAudit = {
  async logAction(action: string, ctx: Partial<KeyraContext>) {
    await writeAuditLog({
      actorType: ctx.user_id ? "citizen" : "system",
      actorId: ctx.user_id,
      action,
      resourceType: "keyra_object",
      resourceId: getKeyraObjectId(),
      metadata: ctx.metadata,
      ipAddress: ctx.ip_address,
    });
  },
};
