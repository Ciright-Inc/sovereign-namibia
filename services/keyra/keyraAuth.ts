import type { KeyraContext } from "./types";
import { createKeyraContext, getKeyraObjectId } from "./keyraClient";
import { createCitizenSession } from "@/lib/auth";
import { requestAccountOtp, verifyAccountOtp } from "@/lib/account-auth-service";
import { KeyraAudit } from "./keyraAudit";
import { KeyraAnalytics } from "./keyraAnalytics";

export const KeyraAuth = {
  async createSession(ctx?: Partial<KeyraContext>) {
    const context = createKeyraContext(ctx);
    await KeyraAnalytics.captureEvent("session_started", context);
    return { session_id: context.session_id, context };
  },

  async verifyMobileNumber(mobile: string, ctx: KeyraContext) {
    await KeyraAnalytics.captureEvent("mobile_number_entered", { ...ctx, metadata: { mobile_masked: true } });
    return { mobile, verified: false, context: ctx };
  },

  async issueOtp(mobile: string, ctx: KeyraContext & { ip?: string; userAgent?: string; deviceFingerprint?: string }) {
    const result = await requestAccountOtp(mobile, {
      ip: ctx.ip_address,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
      country: ctx.country_code,
    });

    if (result.success) {
      await KeyraAnalytics.captureEvent("otp_requested", ctx);
      await KeyraAnalytics.captureEvent("otp_sent", ctx);
    }

    return result;
  },

  async verifyOtp(
    challengeId: string,
    otp: string,
    ctx: KeyraContext & { ip?: string; userAgent?: string; deviceFingerprint?: string }
  ) {
    const result = await verifyAccountOtp(challengeId, otp, {
      ip: ctx.ip_address,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
      country: ctx.country_code,
    });

    if (result.success) {
      await KeyraAnalytics.captureEvent("otp_verified", { ...ctx, user_id: result.userId });
      await KeyraAnalytics.captureEvent("login_success", { ...ctx, user_id: result.userId });
      await KeyraAudit.logAction("keyra.auth.otp_verified", { ...ctx, user_id: result.userId });
    } else {
      await KeyraAnalytics.captureEvent("otp_failed", ctx);
      await KeyraAnalytics.captureEvent("login_failed", ctx);
    }

    return result;
  },

  async bindSession(userId: string, ctx: KeyraContext & { ip?: string; userAgent?: string; deviceFingerprint?: string }) {
    const token = await createCitizenSession(userId, {
      ip: ctx.ip_address,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
    });
    return { token, userId, keyra_object_id: getKeyraObjectId() };
  },
};

export const KeyraOtp = KeyraAuth;
