import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { KeyraQrPairing } from "@/services/keyra/keyraQrPairing";
import { KEYRA_MOBILE_VERIFY_PATH } from "@/services/keyra/constants";
import { getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  session_id: z.string(),
  callback_url: z.string().url().or(z.string().min(1)),
});

export async function POST(request: NextRequest) {
  const { deviceFingerprint } = getClientInfo(request);

  try {
    const body = schema.parse(await request.json());
    const baseUrl = body.callback_url.replace(/\/$/, "");
    const { payload, context } = await KeyraQrPairing.createPairingSession({
      session_id: body.session_id,
      callback_url: baseUrl,
      desktop_device_id: deviceFingerprint ?? undefined,
    });

    const verifyUrl = `${baseUrl}${KEYRA_MOBILE_VERIFY_PATH}?pairing=${payload.desktop_pairing_token}&nonce=${payload.nonce}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 280 });

    return NextResponse.json({
      pairingToken: payload.desktop_pairing_token,
      payload,
      verifyUrl,
      qrDataUrl,
      expiresAt: payload.expiration_timestamp,
      session_id: context.session_id,
    });
  } catch {
    return NextResponse.json({ error: "Unable to create QR pairing session." }, { status: 400 });
  }
}
