import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";
import type { RegistryEntityType } from "@/lib/admin-rbac";
import { REGISTRY_SEED_DATA } from "@/lib/registry-seed-data";

export type RegistryRecord = {
  id: string;
  registry_id: string;
  entity_type: string;
  name: string;
  acronym: string | null;
  description: string | null;
  category: string | null;
  status: string;
  verification_status: string;
  national_classification: string | null;
  province: string | null;
  address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  website: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  relationships: Array<{ registry_id: string; type: string; name?: string }>;
  created_by: string | null;
  last_modified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistryNote = {
  id: string;
  note: string;
  created_by: string | null;
  created_at: string;
};

export type RegistryAttachment = {
  id: string;
  filename: string;
  mime_type: string | null;
  storage_key: string;
  created_at: string;
};

export type RegistryAuditEntry = {
  id: string;
  action: string;
  actor_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  geo_country: string | null;
  created_at: string;
};

const DEMO_REGISTRY: RegistryRecord[] = REGISTRY_SEED_DATA.map((r, i) => ({
  id: `demo-${i + 1}`,
  registry_id: r.registry_id,
  entity_type: r.entity_type,
  name: r.name,
  acronym: r.acronym ?? null,
  description: r.description ?? null,
  category: r.category ?? null,
  status: "active",
  verification_status: "verified",
  national_classification: "sovereign",
  province: r.province ?? null,
  address: r.address ?? null,
  gps_lat: r.gps_lat ?? null,
  gps_lng: r.gps_lng ?? null,
  website: r.website ?? null,
  primary_email: r.primary_email ?? null,
  primary_phone: r.primary_phone ?? null,
  metadata: r.metadata ?? {},
  tags: r.tags ?? [],
  relationships: [],
  created_by: null,
  last_modified_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

function rowToRecord(row: Record<string, unknown>): RegistryRecord {
  return {
    id: String(row.id),
    registry_id: String(row.registry_id),
    entity_type: String(row.entity_type),
    name: String(row.name),
    acronym: row.acronym ? String(row.acronym) : null,
    description: row.description ? String(row.description) : null,
    category: row.category ? String(row.category) : null,
    status: String(row.status),
    verification_status: String(row.verification_status),
    national_classification: row.national_classification ? String(row.national_classification) : null,
    province: row.province ? String(row.province) : null,
    address: row.address ? String(row.address) : null,
    gps_lat: row.gps_lat != null ? Number(row.gps_lat) : null,
    gps_lng: row.gps_lng != null ? Number(row.gps_lng) : null,
    website: row.website ? String(row.website) : null,
    primary_email: row.primary_email ? String(row.primary_email) : null,
    primary_phone: row.primary_phone ? String(row.primary_phone) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    tags: (row.tags as string[]) ?? [],
    relationships: (row.relationships as RegistryRecord["relationships"]) ?? [],
    created_by: row.created_by ? String(row.created_by) : null,
    last_modified_by: row.last_modified_by ? String(row.last_modified_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function buildSearchText(r: Partial<RegistryRecord>): string {
  const meta = r.metadata ? JSON.stringify(r.metadata) : "";
  return [r.name, r.acronym, r.description, r.category, r.province, r.address, r.primary_email, r.registry_id, meta]
    .filter(Boolean)
    .join(" ");
}

export async function listRegistryRecords(
  entityType: RegistryEntityType,
  opts?: { limit?: number; offset?: number; q?: string; status?: string; province?: string }
): Promise<{ records: RegistryRecord[]; total: number }> {
  if (!(await isDatabaseReady())) {
    let records = DEMO_REGISTRY.filter((r) => r.entity_type === entityType);
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      records = records.filter((r) => buildSearchText(r).toLowerCase().includes(q));
    }
    if (opts?.status) records = records.filter((r) => r.status === opts.status);
    if (opts?.province) records = records.filter((r) => r.province === opts.province);
    return { records: records.slice(opts?.offset ?? 0, (opts?.offset ?? 0) + (opts?.limit ?? 50)), total: records.length };
  }

  const params: unknown[] = [entityType];
  let where = "entity_type = $1";
  if (opts?.q) {
    params.push(`%${opts.q}%`);
    where += ` AND (name ILIKE $${params.length} OR search_text ILIKE $${params.length} OR acronym ILIKE $${params.length})`;
  }
  if (opts?.status) {
    params.push(opts.status);
    where += ` AND status = $${params.length}`;
  }
  if (opts?.province) {
    params.push(opts.province);
    where += ` AND province = $${params.length}`;
  }

  const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM sn_national_registry WHERE ${where}`, params);
  params.push(opts?.limit ?? 50, opts?.offset ?? 0);
  const result = await query(
    `SELECT * FROM sn_national_registry WHERE ${where} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { records: result.rows.map(rowToRecord), total: Number(count.rows[0]?.count ?? 0) };
}

export async function getRegistryRecord(id: string): Promise<RegistryRecord | null> {
  if (!(await isDatabaseReady())) {
    return DEMO_REGISTRY.find((r) => r.id === id || r.registry_id === id) ?? null;
  }
  const result = await query(`SELECT * FROM sn_national_registry WHERE id::text = $1 OR registry_id = $1`, [id]);
  return result.rows[0] ? rowToRecord(result.rows[0]) : null;
}

export async function getRegistryStats(): Promise<Record<string, number>> {
  if (!(await isDatabaseReady())) {
    const stats: Record<string, number> = {};
    for (const r of DEMO_REGISTRY) stats[r.entity_type] = (stats[r.entity_type] ?? 0) + 1;
    stats.total = DEMO_REGISTRY.length;
    return stats;
  }
  const result = await query<{ entity_type: string; count: string }>(
    `SELECT entity_type, COUNT(*)::text AS count FROM sn_national_registry GROUP BY entity_type`
  );
  const stats: Record<string, number> = { total: 0 };
  for (const row of result.rows) {
    stats[row.entity_type] = Number(row.count);
    stats.total += Number(row.count);
  }
  return stats;
}

export type CreateRegistryInput = {
  entity_type: RegistryEntityType;
  name: string;
  acronym?: string | null;
  description?: string | null;
  category?: string | null;
  status?: string;
  verification_status?: string;
  national_classification?: string | null;
  province?: string | null;
  address?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  website?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  relationships?: RegistryRecord["relationships"];
};

export async function createRegistryRecord(input: CreateRegistryInput, adminId?: string): Promise<RegistryRecord> {
  const prefix = input.entity_type.slice(0, 3).toUpperCase();
  const registryId = `REG-NA-${prefix}-${Date.now().toString().slice(-6)}`;
  const searchText = buildSearchText(input as Partial<RegistryRecord>);

  if (!(await isDatabaseReady())) {
    const record: RegistryRecord = {
      ...input,
      id: `demo-${Date.now()}`,
      registry_id: registryId,
      acronym: input.acronym ?? null,
      description: input.description ?? null,
      category: input.category ?? null,
      status: input.status ?? "active",
      verification_status: input.verification_status ?? "pending",
      national_classification: input.national_classification ?? "sovereign",
      province: input.province ?? null,
      address: input.address ?? null,
      gps_lat: input.gps_lat ?? null,
      gps_lng: input.gps_lng ?? null,
      website: input.website ?? null,
      primary_email: input.primary_email ?? null,
      primary_phone: input.primary_phone ?? null,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      relationships: input.relationships ?? [],
      created_by: adminId ?? null,
      last_modified_by: adminId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DEMO_REGISTRY.push(record);
    return record;
  }

  const result = await query(
    `INSERT INTO sn_national_registry
      (registry_id, entity_type, name, acronym, description, category, status, verification_status,
       national_classification, province, address, gps_lat, gps_lng, website, primary_email, primary_phone,
       metadata, tags, relationships, search_text, created_by, last_modified_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21)
     RETURNING *`,
    [
      registryId, input.entity_type, input.name, input.acronym ?? null, input.description ?? null,
      input.category ?? null, input.status ?? "active", input.verification_status ?? "pending",
      input.national_classification ?? "sovereign", input.province ?? null, input.address ?? null,
      input.gps_lat ?? null, input.gps_lng ?? null, input.website ?? null, input.primary_email ?? null,
      input.primary_phone ?? null, JSON.stringify(input.metadata ?? {}), input.tags ?? [],
      JSON.stringify(input.relationships ?? []), searchText, adminId ?? null,
    ]
  );
  return rowToRecord(result.rows[0]);
}

export async function updateRegistryRecord(
  id: string,
  input: Partial<CreateRegistryInput>,
  adminId?: string
): Promise<RegistryRecord | null> {
  const existing = await getRegistryRecord(id);
  if (!existing) return null;

  const merged = { ...existing, ...input, metadata: { ...existing.metadata, ...(input.metadata ?? {}) } };
  const searchText = buildSearchText(merged);

  if (!(await isDatabaseReady())) {
    Object.assign(existing, merged, { updated_at: new Date().toISOString(), last_modified_by: adminId ?? null });
    return existing;
  }

  const result = await query(
    `UPDATE sn_national_registry SET
      name = COALESCE($2, name), acronym = COALESCE($3, acronym), description = COALESCE($4, description),
      category = COALESCE($5, category), status = COALESCE($6, status), verification_status = COALESCE($7, verification_status),
      national_classification = COALESCE($8, national_classification), province = COALESCE($9, province),
      address = COALESCE($10, address), gps_lat = COALESCE($11, gps_lat), gps_lng = COALESCE($12, gps_lng),
      website = COALESCE($13, website), primary_email = COALESCE($14, primary_email), primary_phone = COALESCE($15, primary_phone),
      metadata = COALESCE($16, metadata), tags = COALESCE($17, tags), relationships = COALESCE($18, relationships),
      search_text = $19, last_modified_by = $20, updated_at = NOW()
     WHERE id::text = $1 OR registry_id = $1 RETURNING *`,
    [
      id, input.name ?? null, input.acronym ?? null, input.description ?? null, input.category ?? null,
      input.status ?? null, input.verification_status ?? null, input.national_classification ?? null,
      input.province ?? null, input.address ?? null, input.gps_lat ?? null, input.gps_lng ?? null,
      input.website ?? null, input.primary_email ?? null, input.primary_phone ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.tags ?? null, input.relationships ? JSON.stringify(input.relationships) : null,
      searchText, adminId ?? null,
    ]
  );
  return result.rows[0] ? rowToRecord(result.rows[0]) : null;
}

export async function deleteRegistryRecord(id: string): Promise<boolean> {
  if (!(await isDatabaseReady())) {
    const idx = DEMO_REGISTRY.findIndex((r) => r.id === id || r.registry_id === id);
    if (idx >= 0) { DEMO_REGISTRY.splice(idx, 1); return true; }
    return false;
  }
  const result = await query(`DELETE FROM sn_national_registry WHERE id::text = $1 OR registry_id = $1 RETURNING id`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function addRegistryNote(recordId: string, note: string, adminId?: string): Promise<RegistryNote | null> {
  const record = await getRegistryRecord(recordId);
  if (!record || !(await isDatabaseReady())) return { id: "demo-note", note, created_by: adminId ?? null, created_at: new Date().toISOString() };
  const result = await query(
    `INSERT INTO sn_registry_notes (registry_record_id, note, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [record.id, note, adminId ?? null]
  );
  const row = result.rows[0];
  return { id: String(row.id), note: String(row.note), created_by: row.created_by ? String(row.created_by) : null, created_at: String(row.created_at) };
}

export async function listRegistryNotes(recordId: string): Promise<RegistryNote[]> {
  const record = await getRegistryRecord(recordId);
  if (!record || !(await isDatabaseReady())) return [];
  const result = await query(
    `SELECT id, note, created_by, created_at FROM sn_registry_notes WHERE registry_record_id = $1 ORDER BY created_at DESC`,
    [record.id]
  );
  return result.rows.map((row) => ({
    id: String(row.id), note: String(row.note),
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at),
  }));
}

export async function addRegistryAttachment(
  recordId: string,
  filename: string,
  storageKey: string,
  mimeType?: string,
  adminId?: string
): Promise<RegistryAttachment | null> {
  const record = await getRegistryRecord(recordId);
  if (!record || !(await isDatabaseReady())) {
    return { id: "demo-attach", filename, mime_type: mimeType ?? null, storage_key: storageKey, created_at: new Date().toISOString() };
  }
  const result = await query(
    `INSERT INTO sn_registry_attachments (registry_record_id, filename, storage_key, mime_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [record.id, filename, storageKey, mimeType ?? null, adminId ?? null]
  );
  const row = result.rows[0];
  return { id: String(row.id), filename: String(row.filename), mime_type: row.mime_type ? String(row.mime_type) : null, storage_key: String(row.storage_key), created_at: String(row.created_at) };
}

export async function listRegistryAttachments(recordId: string): Promise<RegistryAttachment[]> {
  const record = await getRegistryRecord(recordId);
  if (!record || !(await isDatabaseReady())) return [];
  const result = await query(
    `SELECT id, filename, mime_type, storage_key, created_at FROM sn_registry_attachments WHERE registry_record_id = $1`,
    [record.id]
  );
  return result.rows.map((row) => ({
    id: String(row.id), filename: String(row.filename),
    mime_type: row.mime_type ? String(row.mime_type) : null,
    storage_key: String(row.storage_key), created_at: String(row.created_at),
  }));
}

export async function logRegistryAudit(
  recordId: string,
  action: string,
  actorId?: string,
  changes?: Record<string, unknown>,
  ip?: string,
  geoCountry?: string
): Promise<void> {
  const record = await getRegistryRecord(recordId);
  if (!record || !(await isDatabaseReady())) return;
  await query(
    `INSERT INTO sn_registry_audit_history (registry_record_id, action, actor_id, changes, ip_address, geo_country)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [record.id, action, actorId ?? null, JSON.stringify(changes ?? {}), ip ?? null, geoCountry ?? null]
  );
}

export async function listRegistryAuditHistory(recordId: string): Promise<RegistryAuditEntry[]> {
  const record = await getRegistryRecord(recordId);
  if (!record || !(await isDatabaseReady())) return [];
  const result = await query(
    `SELECT id, action, actor_id, changes, ip_address::text, geo_country, created_at
     FROM sn_registry_audit_history WHERE registry_record_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [record.id]
  );
  return result.rows.map((row) => ({
    id: String(row.id), action: String(row.action),
    actor_id: row.actor_id ? String(row.actor_id) : null,
    changes: (row.changes as Record<string, unknown>) ?? {},
    ip_address: row.ip_address ? String(row.ip_address) : null,
    geo_country: row.geo_country ? String(row.geo_country) : null,
    created_at: String(row.created_at),
  }));
}

export { DEMO_REGISTRY };
