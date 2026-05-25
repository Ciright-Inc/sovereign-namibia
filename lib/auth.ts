import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

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
    }>(
      `SELECT a.id, a.password_hash, a.full_name, r.name AS role_name, a.is_active
       FROM sn_admin_users a
       LEFT JOIN sn_roles r ON r.id = a.role_id
       WHERE LOWER(a.email) = LOWER($1)`,
      [email]
    );

    const admin = result.rows[0];
    if (!admin || !admin.is_active) return null;
    if (!verifyPassword(password, admin.password_hash)) return null;

    return {
      id: admin.id,
      fullName: admin.full_name,
      role: admin.role_name,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, ADMIN_SESSION_COOKIE, SESSION_HOURS };
