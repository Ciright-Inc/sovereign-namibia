import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, updateAdminPassword, ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  password: z.string().min(12),
  confirmPassword: z.string().min(12),
});

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { password, confirmPassword } = schema.parse(body);

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const ok = await updateAdminPassword(session.userId, password);
    if (!ok) {
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    const { ip, userAgent } = getClientInfo(request);
    await writeAuditLog({
      actorType: "admin",
      actorId: session.userId,
      action: "admin.password_reset",
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
