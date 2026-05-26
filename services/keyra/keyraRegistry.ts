import type { KeyraContext } from "./types";
import { getKeyraObjectId } from "./keyraClient";
import { saveAccountProfile, createPendingVerification } from "@/lib/account-auth-service";
import { searchDirectory } from "@/lib/directory-service";
import type { AccountTypeId } from "@/lib/constants";
import { KeyraAnalytics } from "./keyraAnalytics";
import { KeyraAudit } from "./keyraAudit";

export const KeyraRegistry = {
  async createRegistryAccount(input: {
    userId: string;
    accountType: AccountTypeId;
    profileData: Record<string, unknown>;
    primaryDeviceId: string;
    desktopDeviceId?: string;
    mobile: string;
    ctx: KeyraContext;
  }) {
    await saveAccountProfile(input.userId, input.accountType, input.profileData, {
      ip: input.ctx.ip_address,
      registryConsent: true,
    });

    await KeyraAnalytics.captureEvent("account_form_completed", {
      ...input.ctx,
      user_id: input.userId,
      metadata: { account_type: input.accountType },
    });
    await KeyraAnalytics.captureEvent("account_type_selected", {
      ...input.ctx,
      user_id: input.userId,
      metadata: { account_type: input.accountType },
    });

    return {
      user_id: input.userId,
      keyra_object_id: getKeyraObjectId(),
      account_type: input.accountType,
      mobile_number: input.mobile,
      mobile_verified: true,
      primary_device_id: input.primaryDeviceId,
      desktop_device_id: input.desktopDeviceId,
      country_code: "NA" as const,
      status: "active_pending_profile",
      created_at: new Date().toISOString(),
    };
  },

  async searchRegistry(input: {
    userId: string;
    accountType: AccountTypeId;
    search: Record<string, unknown>;
    submittedProfile: Record<string, unknown>;
    ctx: KeyraContext & { ip?: string; userAgent?: string; deviceFingerprint?: string };
  }) {
    await KeyraAnalytics.captureEvent("registry_search_started", { ...input.ctx, user_id: input.userId });

    const result = await searchDirectory(
      {
        fullLegalName: String(input.search.fullLegalName ?? input.submittedProfile.fullLegalName ?? ""),
        mobileNumber: String(input.search.mobileNumber ?? input.submittedProfile.mobileNumber ?? ""),
        dateOfBirth: String(input.search.dateOfBirth ?? input.submittedProfile.dateOfBirth ?? ""),
        nationalId: input.search.nationalId ? String(input.search.nationalId) : undefined,
        email: input.search.email ? String(input.search.email) : undefined,
      },
      { ip: input.ctx.ip_address, userAgent: input.ctx.userAgent, actorId: input.userId }
    );

    await KeyraAnalytics.captureEvent("registry_search_completed", {
      ...input.ctx,
      user_id: input.userId,
      metadata: { match_count: result.matches.length },
    });

    if (result.matches.length > 0) {
      await KeyraAnalytics.captureEvent("registry_match_found", { ...input.ctx, user_id: input.userId });
    } else {
      await KeyraAnalytics.captureEvent("registry_match_not_found", { ...input.ctx, user_id: input.userId });
      const pending = await createPendingVerification(
        input.userId,
        input.accountType,
        input.submittedProfile,
        input.search,
        {
          ip: input.ctx.ip_address,
          userAgent: input.ctx.userAgent,
          deviceFingerprint: input.ctx.deviceFingerprint,
        }
      );
      await KeyraAnalytics.captureEvent("pending_verification_created", {
        ...input.ctx,
        user_id: input.userId,
        metadata: { pending_id: pending.pendingId },
      });
      await KeyraAudit.logAction("keyra.registry.pending_created", {
        ...input.ctx,
        user_id: input.userId,
        metadata: { pending_id: pending.pendingId },
      });
      return { ...result, pendingVerificationId: pending.pendingId };
    }

    return result;
  },
};
