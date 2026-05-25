import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyClaimOtp } from "@/lib/claim-service";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  claimId: z.string().min(1),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "claim.verify_otp", 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { claimId, otp } = schema.parse(body);
    const { ip, userAgent } = getClientInfo(request);
    const result = await verifyClaimOtp(claimId, otp, { ip, userAgent });
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
}
