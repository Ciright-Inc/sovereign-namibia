import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";
import type { RegistryEntityType } from "@/lib/admin-rbac";

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
  website: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const DEMO_REGISTRY: RegistryRecord[] = [
  {
    id: "gov-001",
    registry_id: "REG-NA-GOV-001",
    entity_type: "government",
    name: "Ministry of Finance and Public Enterprises",
    acronym: "MOFPE",
    description: "Central ministry responsible for fiscal policy and public enterprise oversight.",
    category: "Ministry",
    status: "active",
    verification_status: "verified",
    national_classification: "sovereign",
    province: "Khomas",
    address: "Corner of Luther and Robert Mugabe Avenue, Windhoek",
    website: "https://www.mof.gov.na",
    primary_email: "info@mof.gov.na",
    primary_phone: "+26461209511",
    metadata: { minister: "Hon. Minister", departments: ["Budget", "Treasury", "SOE Oversight"] },
    tags: ["ministry", "finance"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bank-001",
    registry_id: "REG-NA-BNK-001",
    entity_type: "banking",
    name: "Bank Windhoek",
    acronym: "BWH",
    description: "Leading commercial bank in Namibia.",
    category: "Commercial Bank",
    status: "active",
    verification_status: "verified",
    national_classification: "financial",
    province: "Khomas",
    address: "Independence Avenue, Windhoek",
    website: "https://www.bankwindhoek.com.na",
    primary_email: "info@bankwindhoek.com.na",
    primary_phone: "+26461299501",
    metadata: { swift: "BWLINANX", branches: 52, license: "BoN Commercial Banking" },
    tags: ["bank", "commercial"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "health-001",
    registry_id: "REG-NA-HLT-001",
    entity_type: "healthcare",
    name: "Windhoek Central Hospital",
    acronym: "WCH",
    description: "National referral hospital serving Khomas region.",
    category: "Hospital",
    status: "active",
    verification_status: "verified",
    national_classification: "healthcare",
    province: "Khomas",
    address: "Corner of Robert Mugabe Ave and Hans-Dietrich Genscher St",
    website: "https://www.mhss.gov.na",
    primary_email: "wch@mhss.gov.na",
    primary_phone: "+264612033000",
    metadata: { beds: 855, emergency: true, ownership: "Public" },
    tags: ["hospital", "referral"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "infra-001",
    registry_id: "REG-NA-INF-001",
    entity_type: "infrastructure",
    name: "NamPower",
    acronym: "NAMPOWER",
    description: "National power utility of Namibia.",
    category: "Energy Infrastructure",
    status: "active",
    verification_status: "verified",
    national_classification: "critical",
    province: "Khomas",
    address: "15 Luther Street, Windhoek",
    website: "https://www.nampower.com.na",
    primary_email: "info@nampower.com.na",
    primary_phone: "+264612041111",
    metadata: { capacity_mw: 500, criticality: "critical", operator: "NamPower Ltd" },
    tags: ["energy", "utility"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "biz-001",
    registry_id: "REG-NA-BIZ-001",
    entity_type: "business",
    name: "Namibia Breweries Limited",
    acronym: "NBL",
    description: "Leading beverage manufacturer in Namibia.",
    category: "Manufacturing",
    status: "active",
    verification_status: "verified",
    national_classification: "commercial",
    province: "Khomas",
    address: "Iscor Street, Windhoek",
    website: "https://www.nbl.com.na",
    primary_email: "info@nbl.com.na",
    primary_phone: "+26461200500",
    metadata: { registration_number: "1957/001", tax_id: "VAT-001", industry: "Beverages" },
    tags: ["manufacturing", "listed"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
    website: row.website ? String(row.website) : null,
    primary_email: row.primary_email ? String(row.primary_email) : null,
    primary_phone: row.primary_phone ? String(row.primary_phone) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    tags: (row.tags as string[]) ?? [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function buildSearchText(r: Partial<RegistryRecord>): string {
  return [r.name, r.acronym, r.description, r.category, r.province, r.address, r.primary_email]
    .filter(Boolean)
    .join(" ");
}

export async function listRegistryRecords(
  entityType: RegistryEntityType,
  opts?: { limit?: number; offset?: number; q?: string }
): Promise<{ records: RegistryRecord[]; total: number }> {
  if (!(await isDatabaseReady())) {
    let records = DEMO_REGISTRY.filter((r) => r.entity_type === entityType);
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      records = records.filter((r) => buildSearchText(r).toLowerCase().includes(q));
    }
    return { records: records.slice(opts?.offset ?? 0, (opts?.offset ?? 0) + (opts?.limit ?? 50)), total: records.length };
  }

  const params: unknown[] = [entityType];
  let where = "entity_type = $1";
  if (opts?.q) {
    params.push(`%${opts.q}%`);
    where += ` AND (name ILIKE $${params.length} OR search_text ILIKE $${params.length} OR acronym ILIKE $${params.length})`;
  }

  const count = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM sn_national_registry WHERE ${where}`,
    params
  );

  params.push(opts?.limit ?? 50, opts?.offset ?? 0);
  const result = await query(
    `SELECT * FROM sn_national_registry WHERE ${where} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    records: result.rows.map(rowToRecord),
    total: Number(count.rows[0]?.count ?? 0),
  };
}

export async function getRegistryStats(): Promise<Record<string, number>> {
  if (!(await isDatabaseReady())) {
    const stats: Record<string, number> = {};
    for (const r of DEMO_REGISTRY) {
      stats[r.entity_type] = (stats[r.entity_type] ?? 0) + 1;
    }
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

export async function globalRegistrySearch(q: string, limit = 25): Promise<RegistryRecord[]> {
  if (!q.trim()) return [];

  if (!(await isDatabaseReady())) {
    const lower = q.toLowerCase();
    return DEMO_REGISTRY.filter((r) => buildSearchText(r).toLowerCase().includes(lower)).slice(0, limit);
  }

  const result = await query(
    `SELECT * FROM sn_national_registry
     WHERE to_tsvector('english', coalesce(search_text, name)) @@ plainto_tsquery('english', $1)
        OR name ILIKE $2 OR acronym ILIKE $2 OR registry_id ILIKE $2
     ORDER BY name ASC LIMIT $3`,
    [q, `%${q}%`, limit]
  );
  return result.rows.map(rowToRecord);
}

export async function createRegistryRecord(
  input: Omit<RegistryRecord, "id" | "registry_id" | "created_at" | "updated_at"> & { entity_type: RegistryEntityType },
  adminId?: string
): Promise<RegistryRecord> {
  const prefix = input.entity_type.slice(0, 3).toUpperCase();
  const registryId = `REG-NA-${prefix}-${Date.now().toString().slice(-6)}`;
  const searchText = buildSearchText(input as Partial<RegistryRecord>);

  if (!(await isDatabaseReady())) {
    const record: RegistryRecord = {
      ...input,
      id: `demo-${Date.now()}`,
      registry_id: registryId,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DEMO_REGISTRY.push(record);
    return record;
  }

  const result = await query(
    `INSERT INTO sn_national_registry
      (registry_id, entity_type, name, acronym, description, category, status, verification_status,
       national_classification, province, address, website, primary_email, primary_phone, metadata, tags, search_text, created_by, last_modified_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)
     RETURNING *`,
    [
      registryId,
      input.entity_type,
      input.name,
      input.acronym,
      input.description,
      input.category,
      input.status ?? "active",
      input.verification_status ?? "pending",
      input.national_classification ?? "sovereign",
      input.province,
      input.address,
      input.website,
      input.primary_email,
      input.primary_phone,
      JSON.stringify(input.metadata ?? {}),
      input.tags ?? [],
      searchText,
      adminId ?? null,
    ]
  );
  return rowToRecord(result.rows[0]);
}

export async function seedNationalRegistry(records: Array<Omit<RegistryRecord, "id" | "created_at" | "updated_at">>) {
  if (!(await isDatabaseReady())) return;
  for (const r of records) {
    await query(
      `INSERT INTO sn_national_registry
        (registry_id, entity_type, name, acronym, description, category, status, verification_status,
         national_classification, province, address, website, primary_email, primary_phone, metadata, tags, search_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (registry_id) DO NOTHING`,
      [
        r.registry_id,
        r.entity_type,
        r.name,
        r.acronym,
        r.description,
        r.category,
        r.status,
        r.verification_status,
        r.national_classification,
        r.province,
        r.address,
        r.website,
        r.primary_email,
        r.primary_phone,
        JSON.stringify(r.metadata),
        r.tags,
        buildSearchText(r),
      ]
    );
  }
}

export { DEMO_REGISTRY };
