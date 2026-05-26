import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateAdmin,
  createSessionToken,
  ADMIN_SESSION_COOKIE,
  SESSION_HOURS,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo, checkRateLimit } from "@/lib/rate-limit";
import { KeyraAnalytics } from "@/services/keyra/keyraAnalytics";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.login", 5);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);
    const { ip, userAgent } = getClientInfo(request);

    let admin = await authenticateAdmin(email, password);

    if (!admin && process.env.NODE_ENV !== "production") {
      const { getDefaultAdminEmail } = await import("@/lib/admin-password");
      if (email === getDefaultAdminEmail() && password === "Namibia2026!") {
        admin = {
          id: "demo-admin",
          fullName: "Demo Admin",
          role: "Super Admin",
          mustResetPassword: false,
        };
      }
    }

    if (!admin) {
      await writeAuditLog({
        actorType: "admin",
        action: "admin.login_failed",
        metadata: { email },
        ipAddress: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      });
      await KeyraAnalytics.captureEvent("admin_login_failed", { ip_address: ip ?? undefined, metadata: { email } });
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: admin.id,
      type: "admin",
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      role: admin.role,
      mustResetPassword: admin.mustResetPassword ?? false,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_HOURS * 3600,
      path: "/",
    });

    await writeAuditLog({
      actorType: "admin",
      actorId: admin.id,
      action: "admin.login",
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    await KeyraAnalytics.captureEvent("admin_login_success", {
      user_id: admin.id,
      ip_address: ip ?? undefined,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
