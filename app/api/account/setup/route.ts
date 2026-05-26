import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAccountProfile } from "@/lib/account-auth-service";
import { getCitizenSession } from "@/lib/auth";
import type { AccountTypeId } from "@/lib/constants";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { getClientInfo } from "@/lib/rate-limit";

const accountTypeIds = new Set(ACCOUNT_TYPES.map((t) => t.id));

const schema = z.object({
  accountType: z.string().refine((v): v is AccountTypeId => accountTypeIds.has(v as AccountTypeId)),
  profileData: z.record(z.string(), z.unknown()),
  registryConsent: z.boolean().optional(),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await getCitizenSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Verified session required." }, { status: 401 });
  }

  if (session.type !== "citizen") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);

  try {
    const body = schema.parse(await request.json());
    if (!body.termsAccepted || !body.privacyAccepted) {
      return NextResponse.json({ error: "Terms and Privacy consent are required." }, { status: 400 });
    }

    await saveAccountProfile(session.userId, body.accountType, body.profileData, {
      ip,
      userAgent,
      deviceFingerprint,
      registryConsent: body.registryConsent,
    });

    return NextResponse.json({
      success: true,
      message: "Account profile saved.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save account profile." }, { status: 500 });
  }
}
