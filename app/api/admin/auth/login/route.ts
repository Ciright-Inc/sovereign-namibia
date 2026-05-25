import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateAdmin,
  createSessionToken,
  ADMIN_SESSION_COOKIE,
  SESSION_HOURS,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo } from "@/lib/rate-limit";
import { checkRateLimit } from "@/lib/rate-limit";

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
      if (email === "admin@sovereignnamibia.com" && password === "admin12345") {
        admin = { id: "demo-admin", fullName: "Demo Admin", role: "Super Admin" };
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
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: admin.id,
      type: "admin",
      role: admin.role,
    });

    const response = NextResponse.json({ success: true, role: admin.role });
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

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
