import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createKycFromClaim, registerCitizenUser } from "@/lib/claim-service";
import { getClientInfo } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  claimId: z.string().min(1),
  recordId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, recordId } = schema.parse(body);
    const { ip, userAgent } = getClientInfo(request);

    const { userId } = await registerCitizenUser("");
    const { kycId } = await createKycFromClaim(claimId, userId);

    await writeAuditLog({
      actorType: "citizen",
      actorId: userId,
      action: "claim.kyc_started",
      resourceType: "identity_claim",
      resourceId: claimId,
      metadata: { recordId },
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return NextResponse.json({ kycId, userId });
  } catch {
    return NextResponse.json({ error: "Failed to complete claim." }, { status: 500 });
  }
}
