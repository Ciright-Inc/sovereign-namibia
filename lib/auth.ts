import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashValue } from "@/lib/crypto";
import { verifyAdminPassword } from "@/lib/admin-password";

const SESSION_COOKIE = "sn_session";
const ADMIN_SESSION_COOKIE = "sn_admin_session";
const SESSION_HOURS = 8;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "dev-secret";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  type: "citizen" | "admin";
  role?: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.userId || !payload.type) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCitizenSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (session?.type !== "admin") return null;
  return session;
}

export async function authenticateAdmin(email: string, password: string) {
  try {
    const result = await query<{
      id: string;
      password_hash: string;
      full_name: string;
      role_name: string;
      is_active: boolean;
      must_reset_password: boolean;
    }>(
      `SELECT a.id, a.password_hash, a.full_name, r.name AS role_name, a.is_active,
              COALESCE(a.must_reset_password, false) AS must_reset_password
       FROM sn_admin_users a
       LEFT JOIN sn_roles r ON r.id = a.role_id
       WHERE LOWER(a.email) = LOWER($1)`,
      [email]
    );

    const admin = result.rows[0];
    if (!admin || !admin.is_active) return null;
    if (!verifyAdminPassword(password, admin.password_hash)) return null;

    return {
      id: admin.id,
      fullName: admin.full_name,
      role: admin.role_name,
      mustResetPassword: admin.must_reset_password,
    };
  } catch {
    return null;
  }
}

export async function updateAdminPassword(adminId: string, newPassword: string): Promise<boolean> {
  const { hashAdminPassword } = await import("@/lib/admin-password");
  try {
    await query(
      `UPDATE sn_admin_users
       SET password_hash = $2, must_reset_password = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [adminId, hashAdminPassword(newPassword)]
    );
    return true;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE, ADMIN_SESSION_COOKIE, SESSION_HOURS };

export async function createCitizenSession(
  userId: string,
  context: { ip?: string | null; userAgent?: string | null; deviceFingerprint?: string | null }
): Promise<string> {
  const token = await createSessionToken({ userId, type: "citizen" });
  const tokenHash = hashValue(token);

  try {
    await query(
      `INSERT INTO sn_sessions (user_id, token_hash, ip_address, user_agent, device_fingerprint, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${SESSION_HOURS} hours')`,
      [
        userId,
        tokenHash,
        context.ip ?? null,
        context.userAgent ?? null,
        context.deviceFingerprint ?? null,
      ]
    );
    await query(
      `UPDATE sn_users SET last_login_at = NOW(), ip_last_login = $2, device_fingerprint = $3, updated_at = NOW()
       WHERE id = $1`,
      [userId, context.ip ?? null, context.deviceFingerprint ?? null]
    );
  } catch {
    /* demo mode — session table may be unavailable */
  }

  return token;
}

export function setCitizenSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function getCitizenAccountState(userId: string): Promise<{
  accountState: string;
  accountType: string | null;
  profileComplete: boolean;
}> {
  try {
    const result = await query<{
      account_state: string;
      account_type: string | null;
      profile_id: string | null;
    }>(
      `SELECT u.account_state, u.account_type, p.id AS profile_id
       FROM sn_users u
       LEFT JOIN sn_citizen_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return { accountState: "Unknown", accountType: null, profileComplete: false };
    return {
      accountState: row.account_state,
      accountType: row.account_type,
      profileComplete: Boolean(row.profile_id),
    };
  } catch {
    const { getDemoUsersStore } = await import("@/lib/demo-store");
    const user = getDemoUsersStore().get(userId);
    return {
      accountState: user?.accountState ?? "Mobile Verified",
      accountType: user?.accountType ?? null,
      profileComplete: Boolean(user?.profileData),
    };
  }
}
