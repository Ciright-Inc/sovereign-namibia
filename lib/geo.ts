import type { NextRequest } from "next/server";

export function getClientCountry(request: NextRequest): string | null {
  const header =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code") ??
    request.headers.get("x-geo-country");

  const code = header?.trim().toUpperCase();
  return code && code.length === 2 ? code : null;
}

export function isNamibiaIpAccess(request: NextRequest): {
  allowed: boolean;
  country: string | null;
  reason?: string;
} {
  if (process.env.SN_SKIP_GEO_CHECK === "true") {
    return { allowed: true, country: "NA" };
  }

  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, country: getClientCountry(request) ?? "DEV" };
  }

  const country = getClientCountry(request);

  if (!country) {
    const allowUnknown = process.env.SN_GEO_UNKNOWN_ALLOW === "true";
    return {
      allowed: allowUnknown,
      country: null,
      reason: allowUnknown
        ? undefined
        : "Unable to verify Namibia-based access for this connection.",
    };
  }

  if (country !== "NA") {
    return {
      allowed: false,
      country,
      reason:
        "Access to Sovereign Namibia Registry is currently restricted to Namibia-based users.",
    };
  }

  return { allowed: true, country };
}
