import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";
import { createRegistryRecord, buildSearchText, deleteRegistryRecord } from "@/lib/registry-service";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export type ImportResult = {
  id: string;
  recordsTotal: number;
  recordsImported: number;
  recordsFailed: number;
  status: string;
  errors: Array<{ row: number; error: string }>;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.match(/(".*?"|[^,]+)/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) ?? [];
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

function parseXml(text: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  const recordMatches = text.matchAll(/<record>([\s\S]*?)<\/record>/gi);
  for (const match of recordMatches) {
    const block = match[1];
    const row: Record<string, string> = {};
    for (const field of block.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) {
      row[field[1]] = field[2].trim();
    }
    if (Object.keys(row).length) records.push(row);
  }
  return records;
}

function mapRowToRecord(
  row: Record<string, string>,
  entityType: RegistryEntityType,
  fieldMapping?: Record<string, string>
): { valid: boolean; data?: Parameters<typeof createRegistryRecord>[0]; error?: string } {
  const map = (key: string) => row[fieldMapping?.[key] ?? key]?.trim() ?? "";
  const name = map("name");
  if (!name) return { valid: false, error: "Missing name" };

  const metadata: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!["name", "acronym", "description", "category", "province", "address", "website", "primary_email", "primary_phone", "entity_type"].includes(k) && v) {
      metadata[k] = v;
    }
  }

  return {
    valid: true,
    data: {
      entity_type: entityType,
      name,
      acronym: map("acronym") || null,
      description: map("description") || null,
      category: map("category") || null,
      province: map("province") || null,
      address: map("address") || null,
      website: map("website") || null,
      primary_email: map("primary_email") || null,
      primary_phone: map("primary_phone") || null,
      metadata,
      tags: map("tags") ? map("tags").split(";").filter(Boolean) : [],
    },
  };
}

function detectDuplicate(name: string, entityType: string, existing: Set<string>): boolean {
  const key = `${entityType}:${name.toLowerCase()}`;
  if (existing.has(key)) return true;
  existing.add(key);
  return false;
}

export async function importRegistryData(opts: {
  format: "csv" | "json" | "xml" | "excel" | "api";
  entityType: RegistryEntityType;
  content: string | Record<string, unknown>[];
  filename?: string;
  fieldMapping?: Record<string, string>;
  adminId?: string;
}): Promise<ImportResult> {
  let rows: Record<string, string>[] = [];

  if (opts.format === "json" || opts.format === "api") {
    const parsed = Array.isArray(opts.content) ? opts.content : JSON.parse(String(opts.content));
    rows = parsed.map((r: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
    );
  } else if (opts.format === "csv" || opts.format === "excel") {
    rows = parseCsv(String(opts.content));
  } else if (opts.format === "xml") {
    rows = parseXml(String(opts.content));
  }

  const errors: Array<{ row: number; error: string }> = [];
  const importedIds: string[] = [];
  const seen = new Set<string>();
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapRowToRecord(rows[i], opts.entityType, opts.fieldMapping);
    if (!mapped.valid || !mapped.data) {
      errors.push({ row: i + 1, error: mapped.error ?? "Invalid row" });
      continue;
    }
    if (detectDuplicate(mapped.data.name, opts.entityType, seen)) {
      errors.push({ row: i + 1, error: "Duplicate record detected" });
      continue;
    }
    try {
      const record = await createRegistryRecord(mapped.data, opts.adminId);
      importedIds.push(record.id);
      imported++;
    } catch (err) {
      errors.push({ row: i + 1, error: err instanceof Error ? err.message : "Import failed" });
    }
  }

  const status = errors.length === 0 ? "completed" : imported > 0 ? "partial" : "failed";

  if (await isDatabaseReady()) {
    const result = await query(
      `INSERT INTO sn_registry_imports (filename, format, entity_type, records_total, records_imported, records_failed, status, imported_by, error_log, field_mapping, rollback_snapshot, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
      [
        opts.filename ?? null, opts.format, opts.entityType, rows.length, imported, errors.length,
        status, opts.adminId ?? null, JSON.stringify(errors),
        JSON.stringify(opts.fieldMapping ?? {}), JSON.stringify(importedIds),
      ]
    );
    return {
      id: String(result.rows[0].id),
      recordsTotal: rows.length,
      recordsImported: imported,
      recordsFailed: errors.length,
      status,
      errors,
    };
  }

  return { id: "demo-import", recordsTotal: rows.length, recordsImported: imported, recordsFailed: errors.length, status, errors };
}

export async function rollbackImport(importId: string, adminId?: string): Promise<boolean> {
  if (!(await isDatabaseReady())) return true;

  const result = await query<{ rollback_snapshot: string[]; rolled_back_at: string | null }>(
    `SELECT rollback_snapshot, rolled_back_at FROM sn_registry_imports WHERE id = $1`,
    [importId]
  );
  const row = result.rows[0];
  if (!row || row.rolled_back_at) return false;

  const ids = row.rollback_snapshot ?? [];
  for (const id of ids) {
    await deleteRegistryRecord(id);
  }

  await query(
    `UPDATE sn_registry_imports SET rolled_back_at = NOW(), status = 'rolled_back' WHERE id = $1`,
    [importId]
  );
  return true;
}

export async function listImports(limit = 20) {
  if (!(await isDatabaseReady())) return [];
  const result = await query(
    `SELECT id, filename, format, entity_type, records_total, records_imported, records_failed, status, created_at, completed_at, rolled_back_at
     FROM sn_registry_imports ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export { parseCsv, mapRowToRecord };
