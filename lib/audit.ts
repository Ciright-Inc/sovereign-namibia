import { query } from "@/lib/db";
import { createAuditHash } from "@/lib/crypto";

export type AuditEntry = {
  actorType: "citizen" | "admin" | "system";
  actorId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
};

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const immutableHash = createAuditHash({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    await query(
      `INSERT INTO sn_audit_logs
        (actor_type, actor_id, action, resource_type, resource_id, metadata, ip_address, user_agent, device_fingerprint, immutable_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.actorType,
        entry.actorId ?? null,
        entry.action,
        entry.resourceType ?? null,
        entry.resourceId ?? null,
        JSON.stringify(entry.metadata ?? {}),
        entry.ipAddress ?? null,
        entry.userAgent ?? null,
        entry.deviceFingerprint ?? null,
        immutableHash,
      ]
    );
  } catch {
    // Audit logging is best-effort when database is unavailable (demo mode).
  }
}
