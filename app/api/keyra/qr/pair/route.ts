import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { KeyraQrPairing } from "@/services/keyra/keyraQrPairing";

const schema = z.object({
  pairing_token: z.string(),
  user_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await KeyraQrPairing.verifyPairingSession(body.pairing_token, {
      mobile_verified: true,
      user_id: body.user_id,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: result.status });
  } catch {
    return NextResponse.json({ error: "Pairing failed." }, { status: 400 });
  }
}
