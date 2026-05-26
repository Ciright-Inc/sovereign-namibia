import { NextRequest, NextResponse } from "next/server";
import { isNamibiaIpAccess } from "@/lib/geo";
import { logSecurityEvent } from "@/lib/account-auth-service";
import { getClientInfo } from "@/lib/rate-limit";
import { KeyraAnalytics } from "@/services/keyra/keyraAnalytics";

export async function GET(request: NextRequest) {
  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);
  const geo = isNamibiaIpAccess(request);
  const sessionId = request.headers.get("x-keyra-session-id") ?? undefined;

  if (!geo.allowed) {
    await logSecurityEvent("geo.blocked", {
      ip,
      userAgent,
      deviceFingerprint,
      country: geo.country,
      metadata: { path: "/api/account/access-check" },
    });
    await KeyraAnalytics.captureEvent("non_namibia_ip_blocked", {
      session_id: sessionId,
      ip_address: ip ?? undefined,
      country_code: geo.country ?? "XX",
    });
    return NextResponse.json(
      {
        allowed: false,
        message:
          "Access to Sovereign Namibia Registry is currently restricted to Namibia-based users. Your visit has been recorded for security review.",
      },
      { status: 403 }
    );
  }

  await KeyraAnalytics.captureEvent("namibia_ip_verified", {
    session_id: sessionId,
    ip_address: ip ?? undefined,
    country_code: "NA",
  });

  return NextResponse.json({ allowed: true, country: geo.country ?? "NA" });
}
