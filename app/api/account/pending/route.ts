import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPendingVerification } from "@/lib/account-auth-service";
import { getCitizenSession } from "@/lib/auth";
import type { AccountTypeId } from "@/lib/constants";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { getClientInfo } from "@/lib/rate-limit";

const accountTypeIds = new Set(ACCOUNT_TYPES.map((t) => t.id));

const schema = z.object({
  accountType: z.string().refine((v): v is AccountTypeId => accountTypeIds.has(v as AccountTypeId)),
  submittedData: z.record(z.string(), z.unknown()),
  searchCriteria: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getCitizenSession();
  if (!session?.userId || session.type !== "citizen") {
    return NextResponse.json({ error: "Verified session required." }, { status: 401 });
  }

  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);

  try {
    const body = schema.parse(await request.json());
    const result = await createPendingVerification(
      session.userId,
      body.accountType,
      body.submittedData,
      body.searchCriteria ?? {},
      { ip, userAgent, deviceFingerprint }
    );

    return NextResponse.json({
      success: true,
      pendingId: result.pendingId,
      message:
        "No verified registry record was found. We will index your submitted information for verification.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create pending verification." }, { status: 500 });
  }
}
