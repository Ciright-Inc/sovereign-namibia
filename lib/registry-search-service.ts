import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";
import { buildSearchText, getRegistryRecord, type RegistryRecord } from "@/lib/registry-service";
import { REGISTRY_SEED_DATA } from "@/lib/registry-seed-data";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export type SearchFilters = {
  q?: string;
  entityType?: RegistryEntityType | "all";
  province?: string;
  status?: string;
  category?: string;
  verificationStatus?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  relatedTo?: string;
  mode?: "standard" | "fuzzy" | "phonetic" | "ai";
  limit?: number;
  offset?: number;
};

function demoRecords(): RegistryRecord[] {
  return REGISTRY_SEED_DATA.map((r, i) => ({
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
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function aiExpandQuery(q: string): string {
  const lower = q.toLowerCase();
  const expansions: Record<string, string[]> = {
    bank: ["banking", "financial", "swift"],
    hospital: ["healthcare", "medical", "clinic"],
    power: ["nampower", "energy", "electricity"],
    government: ["ministry", "municipality", "regulator"],
  };
  const extra = Object.entries(expansions)
    .filter(([k]) => lower.includes(k))
    .flatMap(([, v]) => v);
  return [q, ...extra].join(" ");
}

export async function advancedRegistrySearch(filters: SearchFilters): Promise<{ results: RegistryRecord[]; total: number }> {
  const limit = filters.limit ?? 25;
  const offset = filters.offset ?? 0;
  const q = filters.q?.trim() ?? "";
  const mode = filters.mode ?? "standard";
  const searchQ = mode === "ai" && q ? aiExpandQuery(q) : q;

  if (!(await isDatabaseReady())) {
    let results = demoRecords();
    if (filters.entityType && filters.entityType !== "all") {
      results = results.filter((r) => r.entity_type === filters.entityType);
    }
    if (filters.province) results = results.filter((r) => r.province === filters.province);
    if (filters.status) results = results.filter((r) => r.status === filters.status);
    if (filters.category) results = results.filter((r) => r.category === filters.category);
    if (searchQ) {
      const lower = searchQ.toLowerCase();
      results = results.filter((r) => buildSearchText(r).toLowerCase().includes(lower));
    }
    if (filters.lat != null && filters.lng != null) {
      const radius = filters.radiusKm ?? 50;
      results = results.filter((r) => {
        if (r.gps_lat == null || r.gps_lng == null) return false;
        return haversineKm(filters.lat!, filters.lng!, r.gps_lat, r.gps_lng) <= radius;
      });
    }
    if (filters.relatedTo) {
      results = results.filter((r) =>
        r.relationships.some((rel) => rel.registry_id === filters.relatedTo) ||
        r.registry_id === filters.relatedTo
      );
    }
    return { results: results.slice(offset, offset + limit), total: results.length };
  }

  const params: unknown[] = [];
  const conditions: string[] = [];

  if (filters.entityType && filters.entityType !== "all") {
    params.push(filters.entityType);
    conditions.push(`entity_type = $${params.length}`);
  }
  if (filters.province) {
    params.push(filters.province);
    conditions.push(`province = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }
  if (filters.verificationStatus) {
    params.push(filters.verificationStatus);
    conditions.push(`verification_status = $${params.length}`);
  }

  if (searchQ) {
    if (mode === "fuzzy") {
      params.push(`%${searchQ.replace(/\s+/g, "%")}%`);
      conditions.push(`(name ILIKE $${params.length} OR search_text ILIKE $${params.length} OR registry_id ILIKE $${params.length})`);
    } else if (mode === "phonetic") {
      params.push(searchQ, `%${searchQ.split("").join("%")}%`);
      conditions.push(
        `(name ILIKE $${params.length} OR name ILIKE $${params.length + 1} OR to_tsvector('english', coalesce(search_text, name)) @@ plainto_tsquery('english', $${params.length - 1}))`
      );
    } else {
      params.push(searchQ, `%${searchQ}%`);
      conditions.push(
        `(to_tsvector('english', coalesce(search_text, name)) @@ plainto_tsquery('english', $${params.length - 1})
          OR name ILIKE $${params.length} OR acronym ILIKE $${params.length} OR registry_id ILIKE $${params.length})`
      );
    }
  }

  if (filters.lat != null && filters.lng != null) {
    params.push(filters.lat, filters.lng, filters.radiusKm ?? 50);
    conditions.push(
      `gps_lat IS NOT NULL AND gps_lng IS NOT NULL AND (
        6371 * acos(cos(radians($${params.length - 2})) * cos(radians(gps_lat)) * cos(radians(gps_lng) - radians($${params.length - 1})) + sin(radians($${params.length - 2})) * sin(radians(gps_lat)))
      ) <= $${params.length}`
    );
  }

  if (filters.relatedTo) {
    const related = await getRegistryRecord(filters.relatedTo);
    if (related) {
      params.push(JSON.stringify([{ registry_id: related.registry_id }]));
      conditions.push(`(relationships @> $${params.length}::jsonb OR registry_id = $${params.length + 1})`);
      params.push(related.registry_id);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM sn_national_registry ${where}`, params);
  params.push(limit, offset);
  const result = await query(
    `SELECT * FROM sn_national_registry ${where} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    results: result.rows.map((row) => ({
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
    })),
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function globalRegistrySearch(q: string, limit = 25): Promise<RegistryRecord[]> {
  const { results } = await advancedRegistrySearch({ q, limit, mode: "standard" });
  return results;
}
