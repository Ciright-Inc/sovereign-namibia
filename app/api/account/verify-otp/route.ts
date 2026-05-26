import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccountOtp } from "@/lib/account-auth-service";
import { isNamibiaIpAccess } from "@/lib/geo";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";
import { setCitizenSessionCookie } from "@/lib/auth";

const schema = z.object({
  challengeId: z.string().min(1),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const geo = isNamibiaIpAccess(request);
  if (!geo.allowed) {
    return NextResponse.json(
      {
        error:
          geo.reason ??
          "Access to Sovereign Namibia Registry is currently restricted to Namibia-based users.",
      },
      { status: 403 }
    );
  }

  const rate = await checkRateLimit(request, "account.otp.verify", 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many verification attempts." }, { status: 429 });
  }

  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);

  try {
    const body = schema.parse(await request.json());
    const result = await verifyAccountOtp(body.challengeId, body.otp, {
      ip,
      userAgent,
      deviceFingerprint,
      country: geo.country,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      userId: result.userId,
      accountState: result.accountState,
      profileComplete: result.profileComplete,
      accountType: result.accountType,
      message: "Mobile number verified. Your sovereign account session is active.",
    });

    setCitizenSessionCookie(response, result.token);
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
