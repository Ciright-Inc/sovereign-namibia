import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestAccountOtp, logSecurityEvent } from "@/lib/account-auth-service";
import { isNamibiaIpAccess } from "@/lib/geo";
import { normalizeNamibiaMobile } from "@/lib/namibia";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  mobileNumber: z.string().min(8),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
});

export async function POST(request: NextRequest) {
  const geo = isNamibiaIpAccess(request);
  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);

  if (!geo.allowed) {
    await logSecurityEvent("geo.blocked", {
      ip,
      userAgent,
      deviceFingerprint,
      country: geo.country,
      metadata: { action: "request-otp" },
    });
    return NextResponse.json(
      {
        error:
          geo.reason ??
          "Access to Sovereign Namibia Registry is currently restricted to Namibia-based users.",
      },
      { status: 403 }
    );
  }

  const rate = await checkRateLimit(request, "account.otp", 5);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many OTP requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = schema.parse(await request.json());
    if (!body.termsAccepted || !body.privacyAccepted) {
      return NextResponse.json({ error: "Terms and Privacy consent are required." }, { status: 400 });
    }

    const mobile = normalizeNamibiaMobile(body.mobileNumber);
    if (!mobile.ok) {
      return NextResponse.json({ error: mobile.error }, { status: 400 });
    }

    const result = await requestAccountOtp(mobile.e164, {
      ip,
      userAgent,
      deviceFingerprint,
      country: geo.country,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      challengeId: result.challengeId,
      otpSent: result.otpSent,
      devOtp: result.devOtp,
      message: "Verification code sent to your Namibia mobile number.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to send verification code." }, { status: 500 });
  }
}
