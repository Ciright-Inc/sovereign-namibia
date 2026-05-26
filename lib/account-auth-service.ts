import { encrypt, generateOtp, hashOtp, hashValue } from "@/lib/crypto";
import { isDatabaseReady, query } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { normalizeNamibiaMobile } from "@/lib/namibia";
import type { AccountTypeId } from "@/lib/constants";
import {
  getDemoOtpStore,
  getDemoPendingStore,
  getDemoSecurityEvents,
  getDemoUsersStore,
} from "@/lib/demo-store";
import { createCitizenSession } from "@/lib/auth";

type ClientContext = {
  ip?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  country?: string | null;
};

export async function logSecurityEvent(
  eventType: string,
  context: ClientContext & { mobile?: string; metadata?: Record<string, unknown> }
) {
  const mobileHash = context.mobile
    ? hashValue(
        (() => {
          const n = normalizeNamibiaMobile(context.mobile);
          return n.ok ? n.digits : context.mobile.replace(/\D/g, "");
        })()
      )
    : null;

  if (!(await isDatabaseReady())) {
    getDemoSecurityEvents().push({
      eventType,
      mobileHash,
      ip: context.ip,
      country: context.country,
      metadata: context.metadata ?? {},
      at: new Date().toISOString(),
    });
    return;
  }

  await query(
    `INSERT INTO sn_security_events (event_type, mobile_hash, ip_address, country_code, device_fingerprint, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      eventType,
      mobileHash,
      context.ip ?? null,
      context.country ?? null,
      context.deviceFingerprint ?? null,
      JSON.stringify(context.metadata ?? {}),
    ]
  );
}

export async function requestAccountOtp(mobileInput: string, context: ClientContext) {
  const mobile = normalizeNamibiaMobile(mobileInput);
  if (!mobile.ok) return { success: false as const, error: mobile.error };

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expires = Date.now() + 10 * 60 * 1000;
  const mobileHash = hashValue(mobile.digits);

  if (!(await isDatabaseReady())) {
    const userId = `user-${mobileHash.slice(0, 12)}`;
    const challengeId = `otp-${mobileHash.slice(0, 12)}`;
    getDemoOtpStore().set(challengeId, {
      otpHash,
      expires,
      attempts: 0,
      verified: false,
      userId,
      mobile: mobile.e164,
    });
    if (!getDemoUsersStore().has(userId)) {
      getDemoUsersStore().set(userId, {
        id: userId,
        mobile: mobile.e164,
        accountState: "Pre-Created",
        accountType: null,
        profileData: null,
        registryConsent: false,
      });
    }

    await writeAuditLog({
      actorType: "system",
      action: "account.otp_requested",
      metadata: { mobileHash },
      ipAddress: context.ip ?? undefined,
      userAgent: context.userAgent ?? undefined,
      deviceFingerprint: context.deviceFingerprint ?? undefined,
    });

    return {
      success: true as const,
      challengeId,
      otpSent: true,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  let userResult = await query<{ id: string }>(`SELECT id FROM sn_users WHERE mobile_hash = $1`, [
    mobileHash,
  ]);
  let userId = userResult.rows[0]?.id;

  if (!userId) {
    const created = await query<{ id: string }>(
      `INSERT INTO sn_users (account_state, mobile_hash, ip_last_login, device_fingerprint)
       VALUES ('Pre-Created', $1, $2, $3)
       RETURNING id`,
      [mobileHash, context.ip ?? null, context.deviceFingerprint ?? null]
    );
    userId = created.rows[0]?.id;
  }

  const challenge = await query<{ id: string }>(
    `INSERT INTO sn_auth_otp_challenges
      (mobile_hash, otp_code_hash, otp_expires_at, user_id, ip_address, device_fingerprint)
     VALUES ($1, $2, to_timestamp($3 / 1000.0), $4, $5, $6)
     RETURNING id`,
    [mobileHash, otpHash, expires, userId, context.ip ?? null, context.deviceFingerprint ?? null]
  );

  await writeAuditLog({
    actorType: "citizen",
    actorId: userId,
    action: "account.otp_requested",
    resourceType: "auth_otp_challenge",
    resourceId: challenge.rows[0]?.id,
    ipAddress: context.ip ?? undefined,
    userAgent: context.userAgent ?? undefined,
    deviceFingerprint: context.deviceFingerprint ?? undefined,
  });

  return {
    success: true as const,
    challengeId: challenge.rows[0]?.id,
    otpSent: true,
    devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
  };
}

export async function verifyAccountOtp(
  challengeId: string,
  otp: string,
  context: ClientContext
) {
  const otpHash = hashOtp(otp);

  if (!(await isDatabaseReady())) {
    const challenge = getDemoOtpStore().get(challengeId);
    if (!challenge || challenge.expires < Date.now()) {
      await logSecurityEvent("otp.failed", { ...context, metadata: { reason: "expired" } });
      return { success: false as const, error: "Invalid or expired verification code." };
    }
    if (challenge.attempts >= 5) {
      await logSecurityEvent("otp.failed", { ...context, mobile: challenge.mobile, metadata: { reason: "max_attempts" } });
      return { success: false as const, error: "Too many attempts. Please request a new code." };
    }
    if (challenge.otpHash !== otpHash) {
      challenge.attempts += 1;
      await logSecurityEvent("otp.failed", { ...context, mobile: challenge.mobile, metadata: { reason: "invalid_code" } });
      return { success: false as const, error: "Invalid verification code." };
    }

    challenge.verified = true;
    const user = getDemoUsersStore().get(challenge.userId);
    if (user) user.accountState = "Mobile Verified";

    const token = await createCitizenSession(challenge.userId, context);

    await writeAuditLog({
      actorType: "citizen",
      actorId: challenge.userId,
      action: "account.otp_verified",
      ipAddress: context.ip ?? undefined,
      userAgent: context.userAgent ?? undefined,
    });

    return {
      success: true as const,
      userId: challenge.userId,
      token,
      accountState: "Mobile Verified" as const,
      profileComplete: Boolean(user?.profileData),
      accountType: user?.accountType ?? null,
    };
  }

  const result = await query<{
    id: string;
    user_id: string;
    otp_attempts: number;
    mobile_hash: string;
  }>(
    `SELECT id, user_id, otp_attempts, mobile_hash FROM sn_auth_otp_challenges
     WHERE id = $1 AND otp_expires_at > NOW() AND verified = FALSE`,
    [challengeId]
  );

  const challenge = result.rows[0];
  if (!challenge) {
    await logSecurityEvent("otp.failed", { ...context, metadata: { reason: "not_found" } });
    return { success: false as const, error: "Invalid or expired verification code." };
  }

  if (challenge.otp_attempts >= 5) {
    await logSecurityEvent("otp.failed", { ...context, metadata: { reason: "max_attempts", challengeId } });
    return { success: false as const, error: "Too many attempts. Please request a new code." };
  }

  const valid = await query<{ user_id: string }>(
    `UPDATE sn_auth_otp_challenges
     SET verified = TRUE, otp_code_hash = NULL
     WHERE id = $1 AND otp_code_hash = $2
     RETURNING user_id`,
    [challengeId, otpHash]
  );

  if (valid.rowCount === 0) {
    await query(`UPDATE sn_auth_otp_challenges SET otp_attempts = otp_attempts + 1 WHERE id = $1`, [
      challengeId,
    ]);
    await logSecurityEvent("otp.failed", {
      ...context,
      metadata: { reason: "invalid_code", challengeId },
    });
    return { success: false as const, error: "Invalid verification code." };
  }

  const userId = valid.rows[0]?.user_id ?? challenge.user_id;

  await query(
    `UPDATE sn_users SET account_state = 'Mobile Verified', updated_at = NOW() WHERE id = $1`,
    [userId]
  );

  const token = await createCitizenSession(userId, context);

  const profile = await query<{ id: string; account_type: string | null }>(
    `SELECT p.id, u.account_type FROM sn_users u
     LEFT JOIN sn_citizen_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  await writeAuditLog({
    actorType: "citizen",
    actorId: userId,
    action: "account.otp_verified",
    resourceType: "user",
    resourceId: userId,
    ipAddress: context.ip ?? undefined,
    userAgent: context.userAgent ?? undefined,
    deviceFingerprint: context.deviceFingerprint ?? undefined,
  });

  return {
    success: true as const,
    userId,
    token,
    accountState: "Mobile Verified" as const,
    profileComplete: Boolean(profile.rows[0]?.id),
    accountType: (profile.rows[0]?.account_type as AccountTypeId | null) ?? null,
  };
}

export async function saveAccountProfile(
  userId: string,
  accountType: AccountTypeId,
  profileData: Record<string, unknown>,
  context: ClientContext & { registryConsent?: boolean }
) {
  const encryptedPayload = encrypt(JSON.stringify(profileData));

  if (!(await isDatabaseReady())) {
    const user = getDemoUsersStore().get(userId);
    if (user) {
      user.accountType = accountType;
      user.profileData = profileData;
      user.registryConsent = Boolean(context.registryConsent);
      user.accountState = "Active";
    }
    return { success: true as const };
  }

  const legalName =
    String(profileData.fullLegalName ?? profileData.businessLegalName ?? profileData.agencyName ?? "Account Holder");

  const existing = await query<{ id: string }>(
    `SELECT id FROM sn_citizen_profiles WHERE user_id = $1`,
    [userId]
  );

  if (existing.rows[0]) {
    await query(
      `UPDATE sn_citizen_profiles
       SET legal_name_encrypted = $2,
           date_of_birth_encrypted = $3,
           national_id_encrypted = $4,
           region = $5,
           metadata = $6,
           updated_at = NOW()
       WHERE user_id = $1`,
      [
        userId,
        encrypt(legalName),
        profileData.dateOfBirth ? encrypt(String(profileData.dateOfBirth)) : null,
        profileData.nationalId ? encrypt(String(profileData.nationalId)) : null,
        String(profileData.region ?? profileData.businessRegion ?? "") || null,
        JSON.stringify({ accountType, ...profileData, registryConsent: context.registryConsent }),
      ]
    );
  } else {
    await query(
      `INSERT INTO sn_citizen_profiles (user_id, legal_name_encrypted, date_of_birth_encrypted, national_id_encrypted, region, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        encrypt(legalName),
        profileData.dateOfBirth ? encrypt(String(profileData.dateOfBirth)) : null,
        profileData.nationalId ? encrypt(String(profileData.nationalId)) : null,
        String(profileData.region ?? profileData.businessRegion ?? "") || null,
        JSON.stringify({ accountType, ...profileData, registryConsent: context.registryConsent }),
      ]
    );
  }

  await query(
    `UPDATE sn_users SET account_type = $2, account_state = 'Active', updated_at = NOW() WHERE id = $1`,
    [userId, accountType]
  );

  await writeAuditLog({
    actorType: "citizen",
    actorId: userId,
    action: "account.profile_saved",
    resourceType: "user",
    resourceId: userId,
    metadata: { accountType },
    ipAddress: context.ip ?? undefined,
    userAgent: context.userAgent ?? undefined,
    deviceFingerprint: context.deviceFingerprint ?? undefined,
  });

  return { success: true as const };
}

export async function createPendingVerification(
  userId: string,
  accountType: AccountTypeId,
  submittedData: Record<string, unknown>,
  searchCriteria: Record<string, unknown>,
  context: ClientContext
) {
  const payload = encrypt(JSON.stringify(submittedData));
  const mobile = String(submittedData.mobileNumber ?? submittedData.representativeMobile ?? submittedData.officerMobile ?? "");
  const mobileNorm = normalizeNamibiaMobile(mobile);
  const mobileHash = mobileNorm.ok ? hashValue(mobileNorm.digits) : null;

  if (!(await isDatabaseReady())) {
    const id = `pending-${Date.now()}`;
    getDemoPendingStore().set(id, {
      id,
      userId,
      accountType,
      verificationStatus: "Pending",
      reviewStatus: "Unreviewed",
      submittedData,
      searchCriteria,
      createdAt: new Date().toISOString(),
    });
    return { success: true as const, pendingId: id };
  }

  const result = await query<{ id: string }>(
    `INSERT INTO sn_pending_verifications
      (user_id, account_type, submitted_data_encrypted, mobile_hash, ip_address, device_fingerprint, search_criteria)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      userId,
      accountType,
      payload,
      mobileHash,
      context.ip ?? null,
      context.deviceFingerprint ?? null,
      JSON.stringify(searchCriteria),
    ]
  );

  await writeAuditLog({
    actorType: "citizen",
    actorId: userId,
    action: "verification.pending_created",
    resourceType: "pending_verification",
    resourceId: result.rows[0]?.id,
    metadata: { accountType },
    ipAddress: context.ip ?? undefined,
    userAgent: context.userAgent ?? undefined,
    deviceFingerprint: context.deviceFingerprint ?? undefined,
  });

  return { success: true as const, pendingId: result.rows[0]?.id };
}
