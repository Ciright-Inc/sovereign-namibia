import { decrypt } from "@/lib/crypto";
import { isDatabaseReady, query } from "@/lib/db";
import { getDemoPendingStore, getDemoSecurityEvents } from "@/lib/demo-store";

export type VerificationQueueItem = {
  id: string;
  accountType: string;
  verificationStatus: string;
  reviewStatus: string;
  flagReason: string | null;
  createdAt: string;
  summary: string;
  category: "individual" | "business" | "government" | "duplicate" | "suspicious" | "security";
};

export async function listVerificationQueue(): Promise<VerificationQueueItem[]> {
  const items: VerificationQueueItem[] = [];

  if (!(await isDatabaseReady())) {
    for (const [id, row] of getDemoPendingStore()) {
      items.push({
        id,
        accountType: String(row.accountType ?? "individual"),
        verificationStatus: String(row.verificationStatus ?? "Pending"),
        reviewStatus: String(row.reviewStatus ?? "Unreviewed"),
        flagReason: null,
        createdAt: String(row.createdAt ?? new Date().toISOString()),
        summary: summarizeSubmitted(String(row.accountType ?? "individual"), row.submittedData as Record<string, unknown>),
        category: categorize(String(row.accountType ?? "individual"), null),
      });
    }
    for (const event of getDemoSecurityEvents()) {
      if (String(event.eventType).includes("geo") || String(event.eventType).includes("otp")) {
        items.push({
          id: `sec-${items.length}`,
          accountType: "security",
          verificationStatus: "Suspicious",
          reviewStatus: "Unreviewed",
          flagReason: String(event.eventType),
          createdAt: String(event.at ?? new Date().toISOString()),
          summary: String(event.eventType),
          category: String(event.eventType).includes("geo") ? "security" : "suspicious",
        });
      }
    }
    return items;
  }

  const pending = await query<{
    id: string;
    account_type: string;
    verification_status: string;
    review_status: string;
    flag_reason: string | null;
    created_at: Date;
    submitted_data_encrypted: Buffer;
  }>(
    `SELECT id, account_type, verification_status, review_status, flag_reason, created_at, submitted_data_encrypted
     FROM sn_pending_verifications
     ORDER BY created_at DESC
     LIMIT 100`
  );

  for (const row of pending.rows) {
    let submitted: Record<string, unknown> = {};
    try {
      submitted = JSON.parse(decrypt(row.submitted_data_encrypted));
    } catch {
      submitted = {};
    }
    items.push({
      id: row.id,
      accountType: row.account_type,
      verificationStatus: row.verification_status,
      reviewStatus: row.review_status,
      flagReason: row.flag_reason,
      createdAt: row.created_at.toISOString(),
      summary: summarizeSubmitted(row.account_type, submitted),
      category: categorize(row.account_type, row.flag_reason),
    });
  }

  const security = await query<{
    id: string;
    event_type: string;
    created_at: Date;
    country_code: string | null;
  }>(
    `SELECT id, event_type, created_at, country_code FROM sn_security_events
     WHERE event_type IN ('geo.blocked', 'otp.failed')
     ORDER BY created_at DESC LIMIT 50`
  );

  for (const row of security.rows) {
    items.push({
      id: row.id,
      accountType: "security",
      verificationStatus: "Suspicious",
      reviewStatus: "Unreviewed",
      flagReason: row.event_type,
      createdAt: row.created_at.toISOString(),
      summary: row.event_type === "geo.blocked"
        ? `Non-Namibia access attempt (${row.country_code ?? "unknown"})`
        : "Failed OTP attempt",
      category: row.event_type === "geo.blocked" ? "security" : "suspicious",
    });
  }

  return items;
}

function summarizeSubmitted(accountType: string, data: Record<string, unknown>): string {
  if (accountType === "individual") return String(data.fullLegalName ?? "Individual submission");
  if (accountType === "business") return String(data.businessLegalName ?? "Business submission");
  return String(data.agencyName ?? data.businessLegalName ?? "Entity submission");
}

function categorize(
  accountType: string,
  flagReason: string | null
): VerificationQueueItem["category"] {
  if (flagReason?.includes("duplicate")) return "duplicate";
  if (flagReason?.includes("otp") || flagReason?.includes("geo")) return "suspicious";
  if (accountType === "individual") return "individual";
  if (accountType === "business" || accountType === "financial" || accountType === "utility" || accountType === "healthcare") {
    return "business";
  }
  if (accountType === "government" || accountType === "government_office") return "government";
  return "individual";
}

export async function reviewPendingVerification(
  id: string,
  decision: "Approved" | "Rejected" | "More Information Required" | "Duplicate Review",
  notes: string | undefined,
  reviewerId: string
) {
  if (!(await isDatabaseReady())) {
    const row = getDemoPendingStore().get(id);
    if (!row) return { success: false as const, error: "Record not found." };
    row.verificationStatus = decision;
    row.reviewStatus = "Completed";
    row.reviewNotes = notes;
    return { success: true as const };
  }

  await query(
    `UPDATE sn_pending_verifications
     SET verification_status = $2, review_status = 'Completed', review_notes = $3, reviewer_id = $4, updated_at = NOW()
     WHERE id = $1`,
    [id, decision, notes ?? null, reviewerId]
  );

  return { success: true as const };
}
