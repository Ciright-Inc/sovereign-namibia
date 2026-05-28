import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";
import { getDefaultVisibilityRules, type MapPinVisibilityRules } from "@/lib/map/map-pins-constants";

export type MapPinRecord = {
  id: string;
  pin_name: string;
  pin_type: string;
  latitude: number;
  longitude: number;
  region: string | null;
  description: string | null;
  verification_status: string;
  verification_authority: string | null;
  verification_date: string | null;
  trust_rating: number;
  public_visibility_rules: MapPinVisibilityRules;
  priority: number;
  source_attribution: string | null;
  transparency_score: number;
  community_feedback_status: string;
  correction_request_status: string;
  is_active: boolean;
  is_archived: boolean;
  created_by: string | null;
  last_modified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MapPinAuditEntry = {
  id: string;
  action: string;
  actor_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  geo_country: string | null;
  created_at: string;
};

export type MapPinCorrectionRequest = {
  id: string;
  pin_id: string | null;
  request_type: string;
  proposed_changes: Record<string, unknown>;
  evidence_text: string | null;
  status: string;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const DEMO_PINS: MapPinRecord[] = [
  {
    id: "demo-pin-1",
    pin_name: "Walvis Bay Port — Logistics Corridor",
    pin_type: "Port",
    latitude: -22.9576,
    longitude: 14.5053,
    region: "Erongo",
    description: "National trade gateway with opportunity corridors and verified institutional metadata.",
    verification_status: "verified",
    verification_authority: "National Infrastructure Office",
    verification_date: new Date().toISOString(),
    trust_rating: 88,
    public_visibility_rules: { public: true, allowPreciseCoordinates: true, showOnLowBandwidthList: true },
    priority: 80,
    source_attribution: "Public infrastructure dataset (demo)",
    transparency_score: 82,
    community_feedback_status: "open",
    correction_request_status: "none",
    is_active: true,
    is_archived: false,
    created_by: null,
    last_modified_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-pin-2",
    pin_name: "Rundu Regional Hospital",
    pin_type: "Hospital",
    latitude: -17.9222,
    longitude: 19.7665,
    region: "Kavango East",
    description: "Healthcare visibility for regional access planning and public services navigation.",
    verification_status: "pending",
    verification_authority: null,
    verification_date: null,
    trust_rating: 64,
    public_visibility_rules: { public: true, allowPreciseCoordinates: true, showOnLowBandwidthList: true },
    priority: 55,
    source_attribution: "Community submission (demo)",
    transparency_score: 60,
    community_feedback_status: "open",
    correction_request_status: "submitted",
    is_active: true,
    is_archived: false,
    created_by: null,
    last_modified_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-pin-3",
    pin_name: "Regional Water Infrastructure (Restricted)",
    pin_type: "Water Infrastructure",
    latitude: -22.0,
    longitude: 17.0,
    region: "Khomas",
    description: "Safety-sensitive infrastructure — restricted by default.",
    verification_status: "pending",
    verification_authority: null,
    verification_date: null,
    trust_rating: 50,
    public_visibility_rules: getDefaultVisibilityRules("Water Infrastructure"),
    priority: 50,
    source_attribution: "Institutional record (demo)",
    transparency_score: 58,
    community_feedback_status: "open",
    correction_request_status: "none",
    is_active: true,
    is_archived: false,
    created_by: null,
    last_modified_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function rowToPin(row: any): MapPinRecord {
  return {
    id: row.id,
    pin_name: row.pin_name,
    pin_type: row.pin_type,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    region: row.region ?? null,
    description: row.description ?? null,
    verification_status: row.verification_status,
    verification_authority: row.verification_authority ?? null,
    verification_date: row.verification_date ? new Date(row.verification_date).toISOString() : null,
    trust_rating: Number(row.trust_rating ?? 50),
    public_visibility_rules: (row.public_visibility_rules ?? {}) as MapPinVisibilityRules,
    priority: Number(row.priority ?? 50),
    source_attribution: row.source_attribution ?? null,
    transparency_score: Number(row.transparency_score ?? 50),
    community_feedback_status: row.community_feedback_status ?? "open",
    correction_request_status: row.correction_request_status ?? "none",
    is_active: Boolean(row.is_active),
    is_archived: Boolean(row.is_archived),
    created_by: row.created_by ?? null,
    last_modified_by: row.last_modified_by ?? null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

export async function listMapPinsAdmin(filters?: {
  q?: string;
  region?: string;
  pinType?: string;
  verificationStatus?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ pins: MapPinRecord[]; total: number }> {
  const ready = await isDatabaseReady();
  if (!ready) {
    const pins = DEMO_PINS.filter((p) => (filters?.includeArchived ? true : !p.is_archived));
    return { pins, total: pins.length };
  }

  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
  const offset = Math.max(filters?.offset ?? 0, 0);
  const where: string[] = [];
  const params: any[] = [];

  if (!filters?.includeArchived) {
    params.push(false);
    where.push(`is_archived = $${params.length}`);
  }
  if (filters?.region) {
    params.push(filters.region);
    where.push(`region = $${params.length}`);
  }
  if (filters?.pinType) {
    params.push(filters.pinType);
    where.push(`pin_type = $${params.length}`);
  }
  if (filters?.verificationStatus) {
    params.push(filters.verificationStatus);
    where.push(`verification_status = $${params.length}`);
  }
  if (filters?.q) {
    params.push(`%${filters.q}%`);
    where.push(`(pin_name ILIKE $${params.length} OR coalesce(description,'') ILIKE $${params.length})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM sn_map_pins ${whereSql}`, params);

  params.push(limit, offset);
  const res = await query(
    `SELECT *
     FROM sn_map_pins
     ${whereSql}
     ORDER BY priority DESC, updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { pins: res.rows.map(rowToPin), total: Number(count.rows[0]?.count ?? 0) };
}

export async function getMapPinAdmin(id: string): Promise<{
  pin: MapPinRecord | null;
  audit: MapPinAuditEntry[];
  corrections: MapPinCorrectionRequest[];
}> {
  const ready = await isDatabaseReady();
  if (!ready) {
    const pin = DEMO_PINS.find((p) => p.id === id) ?? null;
    return { pin, audit: [], corrections: [] };
  }

  const pinRes = await query(`SELECT * FROM sn_map_pins WHERE id = $1`, [id]);
  const pin = pinRes.rows[0] ? rowToPin(pinRes.rows[0]) : null;
  const [auditRes, corrRes] = await Promise.all([
    query(`SELECT * FROM sn_map_pin_audit WHERE pin_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
    query(`SELECT * FROM sn_map_pin_corrections WHERE pin_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
  ]);

  return {
    pin,
    audit: auditRes.rows.map((r: any) => ({
      id: r.id,
      action: r.action,
      actor_id: r.actor_id ?? null,
      changes: (r.changes ?? {}) as Record<string, unknown>,
      ip_address: r.ip_address ?? null,
      geo_country: r.geo_country ?? null,
      created_at: new Date(r.created_at).toISOString(),
    })),
    corrections: corrRes.rows.map((r: any) => ({
      id: r.id,
      pin_id: r.pin_id ?? null,
      request_type: r.request_type,
      proposed_changes: (r.proposed_changes ?? {}) as Record<string, unknown>,
      evidence_text: r.evidence_text ?? null,
      status: r.status,
      reviewed_by: r.reviewed_by ?? null,
      review_notes: r.review_notes ?? null,
      created_at: new Date(r.created_at).toISOString(),
      reviewed_at: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
    })),
  };
}

export async function createMapPin(input: Partial<MapPinRecord> & {
  pin_name: string;
  pin_type: string;
  latitude: number;
  longitude: number;
}, actorId?: string): Promise<MapPinRecord> {
  const ready = await isDatabaseReady();
  const visibilityRules =
    (input.public_visibility_rules && Object.keys(input.public_visibility_rules).length)
      ? input.public_visibility_rules
      : getDefaultVisibilityRules(input.pin_type);

  if (!ready) {
    return {
      ...DEMO_PINS[0],
      id: `demo-created-${Date.now()}`,
      pin_name: input.pin_name,
      pin_type: input.pin_type,
      latitude: input.latitude,
      longitude: input.longitude,
      region: input.region ?? null,
      description: input.description ?? null,
      public_visibility_rules: visibilityRules,
      created_by: actorId ?? null,
      last_modified_by: actorId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const res = await query(
    `INSERT INTO sn_map_pins
      (pin_name, pin_type, latitude, longitude, region, description, verification_status, verification_authority, verification_date,
       trust_rating, public_visibility_rules, priority, source_attribution, transparency_score, community_feedback_status, correction_request_status,
       is_active, is_archived, created_by, last_modified_by)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [
      input.pin_name,
      input.pin_type,
      input.latitude,
      input.longitude,
      input.region ?? null,
      input.description ?? null,
      input.verification_status ?? "pending",
      input.verification_authority ?? null,
      input.verification_date ?? null,
      input.trust_rating ?? 50,
      JSON.stringify(visibilityRules),
      input.priority ?? 50,
      input.source_attribution ?? null,
      input.transparency_score ?? 50,
      input.community_feedback_status ?? "open",
      input.correction_request_status ?? "none",
      input.is_active ?? true,
      input.is_archived ?? false,
      actorId ?? null,
      actorId ?? null,
    ]
  );
  return rowToPin(res.rows[0]);
}

export async function updateMapPin(id: string, patch: Partial<MapPinRecord>, actorId?: string): Promise<MapPinRecord | null> {
  const ready = await isDatabaseReady();
  if (!ready) {
    const existing = DEMO_PINS.find((p) => p.id === id);
    if (!existing) return null;
    return { ...existing, ...patch, updated_at: new Date().toISOString(), last_modified_by: actorId ?? existing.last_modified_by };
  }

  const fields: string[] = [];
  const params: any[] = [];
  const set = (col: string, val: any) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };

  if (patch.pin_name !== undefined) set("pin_name", patch.pin_name);
  if (patch.pin_type !== undefined) set("pin_type", patch.pin_type);
  if (patch.latitude !== undefined) set("latitude", patch.latitude);
  if (patch.longitude !== undefined) set("longitude", patch.longitude);
  if (patch.region !== undefined) set("region", patch.region);
  if (patch.description !== undefined) set("description", patch.description);
  if (patch.verification_status !== undefined) set("verification_status", patch.verification_status);
  if (patch.verification_authority !== undefined) set("verification_authority", patch.verification_authority);
  if (patch.verification_date !== undefined) set("verification_date", patch.verification_date);
  if (patch.trust_rating !== undefined) set("trust_rating", patch.trust_rating);
  if (patch.public_visibility_rules !== undefined) set("public_visibility_rules", JSON.stringify(patch.public_visibility_rules));
  if (patch.priority !== undefined) set("priority", patch.priority);
  if (patch.source_attribution !== undefined) set("source_attribution", patch.source_attribution);
  if (patch.transparency_score !== undefined) set("transparency_score", patch.transparency_score);
  if (patch.community_feedback_status !== undefined) set("community_feedback_status", patch.community_feedback_status);
  if (patch.correction_request_status !== undefined) set("correction_request_status", patch.correction_request_status);
  if (patch.is_active !== undefined) set("is_active", patch.is_active);
  if (patch.is_archived !== undefined) set("is_archived", patch.is_archived);

  set("last_modified_by", actorId ?? null);
  fields.push("updated_at = NOW()");

  if (fields.length === 0) return await getMapPinOnly(id);
  params.push(id);
  const res = await query(`UPDATE sn_map_pins SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
  return res.rows[0] ? rowToPin(res.rows[0]) : null;
}

async function getMapPinOnly(id: string): Promise<MapPinRecord | null> {
  const ready = await isDatabaseReady();
  if (!ready) return DEMO_PINS.find((p) => p.id === id) ?? null;
  const res = await query(`SELECT * FROM sn_map_pins WHERE id = $1`, [id]);
  return res.rows[0] ? rowToPin(res.rows[0]) : null;
}

export async function deleteMapPin(id: string): Promise<boolean> {
  const ready = await isDatabaseReady();
  if (!ready) return true;
  const res = await query(`DELETE FROM sn_map_pins WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function logMapPinAudit(
  pinId: string,
  action: string,
  actorId?: string,
  changes?: Record<string, unknown>,
  ip?: string,
  geoCountry?: string
) {
  const ready = await isDatabaseReady();
  if (!ready) return;
  await query(
    `INSERT INTO sn_map_pin_audit (pin_id, action, actor_id, changes, ip_address, geo_country)
     VALUES ($1, $2, $3, $4::jsonb, $5::inet, $6)`,
    [pinId, action, actorId ?? null, JSON.stringify(changes ?? {}), ip ?? null, geoCountry ?? null]
  );
}

export async function listPublicMapPins(options?: { region?: string; type?: string }) {
  const ready = await isDatabaseReady();
  if (!ready) {
    const pins = DEMO_PINS.filter((p) => p.public_visibility_rules?.public !== false);
    return { pins, total: pins.length };
  }
  const where: string[] = [
    "is_active = TRUE",
    "is_archived = FALSE",
    "(public_visibility_rules->>'public')::boolean IS DISTINCT FROM FALSE",
  ];
  const params: any[] = [];
  if (options?.region) {
    params.push(options.region);
    where.push(`region = $${params.length}`);
  }
  if (options?.type) {
    params.push(options.type);
    where.push(`pin_type = $${params.length}`);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const res = await query(`SELECT * FROM sn_map_pins ${whereSql} ORDER BY priority DESC, updated_at DESC LIMIT 200`, params);
  return { pins: res.rows.map(rowToPin), total: res.rows.length };
}

export async function getPublicTrustMetrics(): Promise<{
  totalPublicPins: number;
  verifiedPublicPins: number;
  regionsCovered: number;
  regionalCoverage: Array<{ region: string; total: number; verified: number }>;
  correctionStats: { submitted: number; inReview: number; approved: number; rejected: number };
}> {
  const ready = await isDatabaseReady();
  if (!ready) {
    return {
      totalPublicPins: 2,
      verifiedPublicPins: 1,
      regionsCovered: 2,
      regionalCoverage: [
        { region: "Erongo", total: 1, verified: 1 },
        { region: "Kavango East", total: 1, verified: 0 },
      ],
      correctionStats: { submitted: 1, inReview: 0, approved: 0, rejected: 0 },
    };
  }

  const pinsRes = await query<{ total: string; verified: string; region: string | null }>(
    `SELECT
       coalesce(region,'Unknown') AS region,
       COUNT(*)::text AS total,
       SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END)::text AS verified
     FROM sn_map_pins
     WHERE is_active = TRUE
       AND is_archived = FALSE
       AND (public_visibility_rules->>'public')::boolean IS DISTINCT FROM FALSE
     GROUP BY coalesce(region,'Unknown')
     ORDER BY region ASC`
  );

  const totals = pinsRes.rows.reduce(
    (acc, r) => {
      acc.total += Number(r.total);
      acc.verified += Number(r.verified);
      return acc;
    },
    { total: 0, verified: 0 }
  );

  const corrRes = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM sn_map_pin_corrections
     GROUP BY status`
  );
  const corrMap = Object.fromEntries(corrRes.rows.map((r) => [r.status, Number(r.count)]));

  return {
    totalPublicPins: totals.total,
    verifiedPublicPins: totals.verified,
    regionsCovered: pinsRes.rows.filter((r) => (r.region ?? "Unknown") !== "Unknown").length,
    regionalCoverage: pinsRes.rows.map((r) => ({
      region: (r.region ?? "Unknown") as string,
      total: Number(r.total),
      verified: Number(r.verified),
    })),
    correctionStats: {
      submitted: corrMap.submitted ?? 0,
      inReview: corrMap.in_review ?? 0,
      approved: corrMap.approved ?? 0,
      rejected: corrMap.rejected ?? 0,
    },
  };
}

export async function submitPublicCorrection(input: {
  pin_id?: string;
  request_type: string;
  proposed_changes?: Record<string, unknown>;
  evidence_text?: string;
}) {
  const ready = await isDatabaseReady();
  if (!ready) {
    return { id: `demo-corr-${Date.now()}` };
  }
  const res = await query<{ id: string }>(
    `INSERT INTO sn_map_pin_corrections (pin_id, request_type, proposed_changes, evidence_text, status)
     VALUES ($1, $2, $3::jsonb, $4, 'submitted')
     RETURNING id`,
    [input.pin_id ?? null, input.request_type, JSON.stringify(input.proposed_changes ?? {}), input.evidence_text ?? null]
  );
  if (input.pin_id) {
    await query(`UPDATE sn_map_pins SET correction_request_status = 'submitted', updated_at = NOW() WHERE id = $1`, [input.pin_id]);
  }
  return { id: res.rows[0]?.id };
}

