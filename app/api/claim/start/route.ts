import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startClaim } from "@/lib/claim-service";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  directoryRecordId: z.string().min(1),
  mobile: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "claim.start", 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { directoryRecordId } = schema.parse(body);
    const { ip, userAgent, deviceFingerprint } = getClientInfo(request);
    const result = await startClaim(directoryRecordId, { ip, userAgent, deviceFingerprint });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to start claim." }, { status: 500 });
  }
}
