import { query } from "@/lib/db";
import { isDatabaseReady } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { maskName, maskMobile, maskEmail, maskNationalId } from "@/lib/masking";
import { hasPermission, type Permission } from "@/lib/admin-rbac";

export type CitizenRegistryView = {
  id: string;
  registry_id: string;
  name: string;
  masked_name: string;
  province: string | null;
  verification_status: string;
  digital_identity_status: string | null;
  consent_status: string | null;
  national_id?: string;
  masked_national_id?: string;
  mobile?: string;
  masked_mobile?: string;
  email?: string;
  masked_email?: string;
  date_of_birth?: string;
  employment?: string | null;
  directory_record_id?: string;
};

export async function listCitizenRegistry(
  adminRole: string | undefined,
  opts?: { q?: string; limit?: number }
): Promise<{ citizens: CitizenRegistryView[]; total: number; sensitiveAccess: boolean }> {
  const canViewSensitive = hasPermission(adminRole, "citizen.read_sensitive" as Permission);
  const limit = opts?.limit ?? 50;

  if (!(await isDatabaseReady())) {
    const { DEMO_REGISTRY } = await import("@/lib/registry-service");
    let citizens = DEMO_REGISTRY.filter((r) => r.entity_type === "citizen").map((r) =>
      toCitizenView(r, canViewSensitive)
    );
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      citizens = citizens.filter((c) => c.name.toLowerCase().includes(q) || c.registry_id.toLowerCase().includes(q));
    }
    return { citizens, total: citizens.length, sensitiveAccess: canViewSensitive };
  }

  const params: unknown[] = ["citizen"];
  let where = "entity_type = $1";
  if (opts?.q) {
    params.push(`%${opts.q}%`);
    where += ` AND (name ILIKE $${params.length} OR registry_id ILIKE $${params.length})`;
  }
  params.push(limit);

  const result = await query(`SELECT * FROM sn_national_registry WHERE ${where} ORDER BY name ASC LIMIT $${params.length}`, params);
  const citizens = result.rows.map((row) => {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    return toCitizenView(
      {
        id: String(row.id),
        registry_id: String(row.registry_id),
        name: String(row.name),
        province: row.province ? String(row.province) : null,
        verification_status: String(row.verification_status),
        metadata: meta,
      },
      canViewSensitive
    );
  });

  return { citizens, total: citizens.length, sensitiveAccess: canViewSensitive };
}

function toCitizenView(
  r: { id: string; registry_id: string; name: string; province: string | null; verification_status: string; metadata: Record<string, unknown> },
  sensitive: boolean
): CitizenRegistryView {
  const meta = r.metadata;
  const nationalId = meta.national_id ? String(meta.national_id) : undefined;
  const mobile = meta.mobile ? String(meta.mobile) : undefined;
  const email = meta.email ? String(meta.email) : undefined;

  return {
    id: r.id,
    registry_id: r.registry_id,
    name: sensitive ? r.name : maskName(r.name),
    masked_name: maskName(r.name),
    province: r.province,
    verification_status: r.verification_status,
    digital_identity_status: meta.digital_identity_status ? String(meta.digital_identity_status) : null,
    consent_status: meta.consent_status ? String(meta.consent_status) : null,
    ...(sensitive
      ? {
          national_id: nationalId,
          mobile,
          email,
          date_of_birth: meta.date_of_birth ? String(meta.date_of_birth) : undefined,
          employment: meta.employment ? String(meta.employment) : null,
          directory_record_id: meta.directory_record_id ? String(meta.directory_record_id) : undefined,
        }
      : {
          masked_national_id: nationalId ? maskNationalId(nationalId) : undefined,
          masked_mobile: mobile ? maskMobile(mobile) : undefined,
          masked_email: email ? maskEmail(email) : undefined,
        }),
  };
}

export async function getEncryptedCitizenFromDirectory(directoryId: string): Promise<{
  legalName: string;
  nationalId: string;
  mobile: string;
  email: string | null;
} | null> {
  if (!(await isDatabaseReady())) return null;
  try {
    const result = await query<{
      legal_name_encrypted: Buffer;
      national_id_encrypted: Buffer;
      mobile_encrypted: Buffer;
      email_encrypted: Buffer | null;
    }>(`SELECT legal_name_encrypted, national_id_encrypted, mobile_encrypted, email_encrypted FROM sn_citizen_directory_records WHERE id = $1`, [directoryId]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      legalName: decrypt(row.legal_name_encrypted),
      nationalId: decrypt(row.national_id_encrypted),
      mobile: decrypt(row.mobile_encrypted),
      email: row.email_encrypted ? decrypt(row.email_encrypted) : null,
    };
  } catch {
    return null;
  }
}
