import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";

export type AuditLogRow = {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const DEMO_AUDIT: AuditLogRow[] = [
  {
    id: "audit-1",
    actor_type: "admin",
    actor_id: "demo-admin",
    action: "admin.login",
    resource_type: null,
    resource_id: null,
    metadata: {},
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    created_at: new Date().toISOString(),
  },
];

export async function listAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  if (!(await isDatabaseReady())) {
    return DEMO_AUDIT;
  }

  const result = await query(
    `SELECT id, actor_type, actor_id, action, resource_type, resource_id, metadata,
            ip_address, user_agent, created_at
     FROM sn_audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    actor_type: String(row.actor_type),
    actor_id: row.actor_id ? String(row.actor_id) : null,
    action: String(row.action),
    resource_type: row.resource_type ? String(row.resource_type) : null,
    resource_id: row.resource_id ? String(row.resource_id) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent ? String(row.user_agent) : null,
    created_at: String(row.created_at),
  }));
}
