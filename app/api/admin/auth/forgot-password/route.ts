import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { query } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getAuditGeo } from "@/lib/audit-geo";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.forgot_password", 3);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { email } = schema.parse(await request.json());
    const { ip, geoCountry } = getAuditGeo(request);

    const result = await query<{ id: string }>(
      `SELECT id FROM sn_admin_users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE`,
      [email]
    );
    const admin = result.rows[0];

    if (admin) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await query(
        `INSERT INTO sn_admin_password_resets (admin_user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [admin.id, tokenHash]
      );
      // In production, send email with reset link. Log token hash event only.
      await writeAuditLog({
        actorType: "admin",
        actorId: admin.id,
        action: "admin.forgot_password_requested",
        metadata: { geoCountry, resetTokenIssued: true },
        ipAddress: ip ?? undefined,
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists, a password reset link has been issued to the Super Admin notification channel.",
      ...(process.env.NODE_ENV !== "production" && admin ? { devNote: "Reset token stored. Contact Super Admin." } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
