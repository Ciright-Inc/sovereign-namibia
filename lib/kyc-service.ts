import { KYC_STEPS, type KycStatus } from "@/lib/constants";
import { isDatabaseReady, query } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getDemoKycStore } from "@/lib/demo-store";

export type KycApplicationView = {
  id: string;
  status: KycStatus;
  currentStep: number;
  steps: typeof KYC_STEPS;
  personalInfo?: Record<string, unknown>;
  addressInfo?: Record<string, unknown>;
};

export async function getKycApplication(kycId: string): Promise<KycApplicationView | null> {
  if (!(await isDatabaseReady())) {
    const demoKyc = getDemoKycStore();
    const demo = demoKyc.get(kycId) ?? { status: "In Progress" as KycStatus, step: 1, data: {} };
    if (!demoKyc.has(kycId)) {
      demoKyc.set(kycId, demo);
    }
    return {
      id: kycId,
      status: demo.status,
      currentStep: demo.step,
      steps: KYC_STEPS,
      personalInfo: demo.data.personal as Record<string, unknown> | undefined,
      addressInfo: demo.data.address as Record<string, unknown> | undefined,
    };
  }

  const result = await query<{
    id: string;
    status: KycStatus;
    personal_info: Record<string, unknown>;
    address_info: Record<string, unknown>;
  }>(`SELECT id, status, personal_info, address_info FROM sn_kyc_applications WHERE id = $1`, [
    kycId,
  ]);

  const row = result.rows[0];
  if (!row) return null;

  const stepMap: Record<KycStatus, number> = {
    "Not Started": 1,
    "In Progress": 2,
    "Documents Uploaded": 4,
    "Awaiting Telecom Verification": 6,
    "Awaiting Admin Review": 7,
    Approved: 8,
    Rejected: 8,
    "More Information Required": 3,
    Suspended: 7,
    Locked: 7,
  };

  return {
    id: row.id,
    status: row.status,
    currentStep: stepMap[row.status] ?? 1,
    steps: KYC_STEPS,
    personalInfo: row.personal_info,
    addressInfo: row.address_info,
  };
}

export async function updateKycStep(
  kycId: string,
  step: string,
  data: Record<string, unknown>,
  context?: { userId?: string; ip?: string | null }
) {
  const statusByStep: Record<string, KycStatus> = {
    personal: "In Progress",
    mobile: "In Progress",
    documents: "Documents Uploaded",
    selfie: "Documents Uploaded",
    address: "Documents Uploaded",
    telecom: "Awaiting Telecom Verification",
    review: "Awaiting Admin Review",
  };

  const newStatus = statusByStep[step] ?? "In Progress";

  if (!(await isDatabaseReady())) {
    const demoKyc = getDemoKycStore();
    const existing = demoKyc.get(kycId) ?? { status: "In Progress" as KycStatus, step: 1, data: {} };
    existing.data[step] = data;
    existing.status = newStatus;
    existing.step = Math.min(existing.step + 1, 8);
    demoKyc.set(kycId, existing);
    return { success: true, status: newStatus };
  }

  const field = step === "address" ? "address_info" : "personal_info";

  await query(
    `UPDATE sn_kyc_applications
     SET status = $1, ${field} = COALESCE(${field}, '{}'::jsonb) || $2::jsonb, updated_at = NOW()
     WHERE id = $3`,
    [newStatus, JSON.stringify(data), kycId]
  );

  await writeAuditLog({
    actorType: "citizen",
    actorId: context?.userId,
    action: `kyc.step.${step}`,
    resourceType: "kyc_application",
    resourceId: kycId,
    ipAddress: context?.ip ?? undefined,
  });

  return { success: true, status: newStatus };
}

export async function listPendingKycReviews() {
  if (!(await isDatabaseReady())) {
    return [];
  }

  const result = await query<{
    id: string;
    status: string;
    submitted_at: string | null;
    created_at: string;
  }>(
    `SELECT id, status, submitted_at, created_at
     FROM sn_kyc_applications
     WHERE status IN ('Awaiting Admin Review', 'Documents Uploaded', 'Awaiting Telecom Verification')
     ORDER BY created_at ASC`
  );

  return result.rows;
}

export async function reviewKyc(
  kycId: string,
  decision: "Approved" | "Rejected" | "More Information Required",
  reviewerId: string,
  notes?: string
) {
  if (!(await isDatabaseReady())) {
    const demoKyc = getDemoKycStore();
    const demo = demoKyc.get(kycId) ?? {
      status: "Awaiting Admin Review" as KycStatus,
      step: 7,
      data: {},
    };
    demo.status = decision;
    demoKyc.set(kycId, demo);
    return { success: true };
  }

  await query(
    `UPDATE sn_kyc_applications
     SET status = $1::varchar,
         reviewer_id = $2::uuid,
         review_notes = $3,
         approved_at = CASE WHEN $1::varchar = 'Approved' THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $4::uuid`,
    [decision, reviewerId, notes ?? null, kycId]
  );

  if (decision === "Approved") {
    await query(
      `UPDATE sn_users SET account_state = 'Active', updated_at = NOW()
       WHERE id = (SELECT user_id FROM sn_kyc_applications WHERE id = $1)`,
      [kycId]
    );
  }

  await writeAuditLog({
    actorType: "admin",
    actorId: reviewerId,
    action: `kyc.review.${decision.toLowerCase().replace(/\s/g, "_")}`,
    resourceType: "kyc_application",
    resourceId: kycId,
    metadata: { notes },
  });

  return { success: true };
}
