import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { advancedRegistrySearch } from "@/lib/registry-search-service";
import { writeAuditLog } from "@/lib/audit";
import { getAuditGeo } from "@/lib/audit-geo";
import { checkRateLimit } from "@/lib/rate-limit";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.search", 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many search requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "search.global")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const { ip, geoCountry } = getAuditGeo(request);

  const { results, total } = await advancedRegistrySearch({
    q: sp.get("q") ?? undefined,
    entityType: (sp.get("entityType") as RegistryEntityType | "all") ?? "all",
    province: sp.get("province") ?? undefined,
    status: sp.get("status") ?? undefined,
    category: sp.get("category") ?? undefined,
    verificationStatus: sp.get("verificationStatus") ?? undefined,
    lat: sp.get("lat") ? Number(sp.get("lat")) : undefined,
    lng: sp.get("lng") ? Number(sp.get("lng")) : undefined,
    radiusKm: sp.get("radiusKm") ? Number(sp.get("radiusKm")) : undefined,
    relatedTo: sp.get("relatedTo") ?? undefined,
    mode: (sp.get("mode") as "standard" | "fuzzy" | "phonetic" | "ai") ?? "standard",
    limit: sp.get("limit") ? Number(sp.get("limit")) : 25,
    offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
  });

  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "registry.search",
    metadata: { query: sp.get("q"), mode: sp.get("mode"), resultCount: results.length, geoCountry },
    ipAddress: ip ?? undefined,
  });

  return NextResponse.json({ results, total });
}
