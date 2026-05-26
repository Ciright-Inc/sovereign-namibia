import type { NextRequest } from "next/server";

export function getAuditGeo(request: NextRequest): { ip: string | null; geoCountry: string | null } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const geoCountry =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code") ??
    null;
  return { ip, geoCountry: geoCountry?.toUpperCase() ?? null };
}
