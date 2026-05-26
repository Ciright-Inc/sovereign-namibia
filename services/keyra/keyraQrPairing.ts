import { randomUUID } from "crypto";
import type { KeyraContext, QrPairingPayload } from "./types";
import { KEYRA_QR_TTL_MS, KEYRA_SOVEREIGN_REGISTRY } from "./constants";
import { createKeyraContext, getKeyraObjectId } from "./keyraClient";
import {
  createQrPairingSession,
  getQrPairingSession,
  updateQrPairingSession,
} from "@/lib/keyra-persistence";
import { KeyraAnalytics } from "./keyraAnalytics";
import { KeyraAudit } from "./keyraAudit";

export const KeyraQrPairing = {
  async createPairingSession(input: {
    session_id: string;
    callback_url: string;
    desktop_device_id?: string;
    ctx?: Partial<KeyraContext>;
  }) {
    const context = createKeyraContext(input.ctx);
    const desktop_pairing_token = randomUUID();
    const nonce = randomUUID();
    const expiration_timestamp = Date.now() + KEYRA_QR_TTL_MS;

    const payload: QrPairingPayload = {
      keyra_object_id: getKeyraObjectId(),
      sovereign_country_code: "NA",
      session_id: input.session_id,
      desktop_pairing_token,
      callback_url: input.callback_url,
      expiration_timestamp,
      nonce,
    };

    await createQrPairingSession({
      id: randomUUID(),
      keyra_object_id: payload.keyra_object_id,
      session_id: payload.session_id,
      desktop_pairing_token,
      nonce,
      callback_url: input.callback_url,
      expiration_timestamp,
      status: "pending",
      desktop_device_id: input.desktop_device_id,
    });

    await KeyraAnalytics.captureEvent("qr_generated", {
      ...context,
      metadata: { pairing_token: desktop_pairing_token },
    });
    await KeyraAnalytics.captureEvent("desktop_mobile_pairing_started", context);

    return { payload, qr_url: `${input.callback_url}?pairing=${desktop_pairing_token}&nonce=${nonce}`, context };
  },

  async verifyPairingSession(token: string, patch: { status?: string; user_id?: string; mobile_verified?: boolean; scanned?: boolean }) {
    const existing = await getQrPairingSession(token);
    if (!existing) return { success: false as const, error: "Pairing session not found." };

    if (new Date(existing.expires_at) < new Date()) {
      await updateQrPairingSession(token, { status: "expired" });
      await KeyraAnalytics.captureEvent("desktop_mobile_pairing_expired", createKeyraContext({ session_id: existing.session_id }));
      return { success: false as const, error: "QR code expired. Refresh on desktop." };
    }

    if (patch.scanned) {
      await updateQrPairingSession(token, { status: "scanned", scanned_at: new Date().toISOString() });
      await KeyraAnalytics.captureEvent("qr_scanned", createKeyraContext({ session_id: existing.session_id }));
    }

    if (patch.mobile_verified && patch.user_id) {
      await updateQrPairingSession(token, {
        status: "paired",
        user_id: patch.user_id,
        mobile_verified: true,
        paired_at: new Date().toISOString(),
      });
      await KeyraAnalytics.captureEvent("desktop_mobile_pairing_completed", createKeyraContext({ session_id: existing.session_id, user_id: patch.user_id }));
      await KeyraAudit.logAction("keyra.qr.paired", createKeyraContext({ session_id: existing.session_id, user_id: patch.user_id }));
      return { success: true as const, status: "paired" as const, session_id: existing.session_id, user_id: patch.user_id };
    }

    return { success: true as const, status: existing.status as string, session_id: existing.session_id };
  },

  async getPairingStatus(token: string) {
    const row = await getQrPairingSession(token);
    if (!row) return { status: "not_found" as const };
    if (new Date(row.expires_at) < new Date()) return { status: "expired" as const };
    return {
      status: row.status as "pending" | "scanned" | "paired" | "expired",
      mobile_verified: row.mobile_verified,
      user_id: row.user_id,
      session_id: row.session_id,
      expires_at: row.expires_at,
    };
  },

};
