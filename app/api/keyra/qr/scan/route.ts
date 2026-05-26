import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { KeyraQrPairing } from "@/services/keyra/keyraQrPairing";

const schema = z.object({
  pairing_token: z.string(),
  nonce: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await KeyraQrPairing.verifyPairingSession(body.pairing_token, { scanned: true });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: result.status, session_id: result.session_id });
  } catch {
    return NextResponse.json({ error: "Invalid scan request." }, { status: 400 });
  }
}
