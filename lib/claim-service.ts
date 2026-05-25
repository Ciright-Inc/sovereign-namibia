import { generateOtp, hashOtp, hashValue } from "@/lib/crypto";
import { isDatabaseReady, query } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getDemoClaimsStore } from "@/lib/demo-store";

export async function startClaim(
  directoryRecordId: string,
  context: { ip?: string | null; userAgent?: string | null; deviceFingerprint?: string | null }
) {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expires = Date.now() + 10 * 60 * 1000;

  if (!(await isDatabaseReady())) {
    getDemoClaimsStore().set(directoryRecordId, {
      otpHash,
      expires,
      mobileVerified: false,
      recordId: directoryRecordId,
    });
    return { claimId: `claim-${directoryRecordId}`, otpSent: true, devOtp: otp };
  }

  const claimResult = await query<{ id: string }>(
    `INSERT INTO sn_identity_claims
      (directory_record_id, status, otp_code_hash, otp_expires_at, ip_address, device_fingerprint)
     VALUES ($1, 'Claim Started', $2, to_timestamp($3 / 1000.0), $4, $5)
     RETURNING id`,
    [
      directoryRecordId,
      otpHash,
      expires,
      context.ip ?? null,
      context.deviceFingerprint ?? null,
    ]
  );

  await query(
    `UPDATE sn_citizen_directory_records SET account_state = 'Claim Started', updated_at = NOW()
     WHERE id = $1`,
    [directoryRecordId]
  );

  await writeAuditLog({
    actorType: "citizen",
    action: "claim.started",
    resourceType: "identity_claim",
    resourceId: claimResult.rows[0]?.id,
    ipAddress: context.ip ?? undefined,
    userAgent: context.userAgent ?? undefined,
    deviceFingerprint: context.deviceFingerprint ?? undefined,
  });

  return { claimId: claimResult.rows[0]?.id, otpSent: true, devOtp: process.env.NODE_ENV !== "production" ? otp : undefined };
}

export async function verifyClaimOtp(
  claimId: string,
  otp: string,
  context: { ip?: string | null; userAgent?: string | null }
) {
  const otpHash = hashOtp(otp);

  if (!(await isDatabaseReady())) {
    const recordId = claimId.replace("claim-", "");
    const claim = getDemoClaimsStore().get(recordId);
    if (!claim || claim.expires < Date.now() || claim.otpHash !== otpHash) {
      return { success: false, message: "Invalid or expired verification code." };
    }
    claim.mobileVerified = true;
    return { success: true, message: "Mobile number verified.", claimId, recordId };
  }

  const result = await query<{ id: string; directory_record_id: string; otp_attempts: number }>(
    `SELECT id, directory_record_id, otp_attempts FROM sn_identity_claims
     WHERE id = $1 AND otp_expires_at > NOW()`,
    [claimId]
  );

  const claim = result.rows[0];
  if (!claim) return { success: false, message: "Invalid or expired verification code." };
  if (claim.otp_attempts >= 5) return { success: false, message: "Too many attempts. Please start again." };

  const valid = await query(
    `UPDATE sn_identity_claims
     SET mobile_verified = TRUE, status = 'Mobile Verified', otp_code_hash = NULL, updated_at = NOW()
     WHERE id = $1 AND otp_code_hash = $2
     RETURNING id`,
    [claimId, otpHash]
  );

  if (valid.rowCount === 0) {
    await query(`UPDATE sn_identity_claims SET otp_attempts = otp_attempts + 1 WHERE id = $1`, [
      claimId,
    ]);
    return { success: false, message: "Invalid verification code." };
  }

  await writeAuditLog({
    actorType: "citizen",
    action: "claim.mobile_verified",
    resourceType: "identity_claim",
    resourceId: claimId,
    ipAddress: context.ip ?? undefined,
    userAgent: context.userAgent ?? undefined,
  });

  return {
    success: true,
    message: "Mobile number verified.",
    claimId,
    recordId: claim.directory_record_id,
  };
}

export async function createKycFromClaim(claimId: string, userId: string) {
  if (!(await isDatabaseReady())) {
    return { kycId: `kyc-${claimId}` };
  }

  const result = await query<{ id: string }>(
    `INSERT INTO sn_kyc_applications (user_id, claim_id, status)
     VALUES ($1, $2, 'In Progress')
     RETURNING id`,
    [userId, claimId]
  );

  await query(
    `UPDATE sn_identity_claims SET user_id = $1, status = 'KYC Pending', updated_at = NOW() WHERE id = $2`,
    [userId, claimId]
  );

  return { kycId: result.rows[0]?.id };
}

export async function registerCitizenUser(mobile: string) {
  if (!(await isDatabaseReady())) {
    return { userId: `user-${Date.now()}` };
  }

  const result = await query<{ id: string }>(
    `INSERT INTO sn_users (account_state, mobile_hash)
     VALUES ('Claim Started', $1)
     RETURNING id`,
    [hashValue(mobile.replace(/\D/g, ""))]
  );

  return { userId: result.rows[0]?.id };
}
