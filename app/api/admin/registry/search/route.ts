import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { globalRegistrySearch } from "@/lib/registry-service";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo, checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.search", 30);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many search requests." }, { status: 429 });
  }

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "search.global")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = await globalRegistrySearch(q);

  const { ip, userAgent } = getClientInfo(request);
  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "registry.search",
    metadata: { query: q, resultCount: results.length },
    ipAddress: ip ?? undefined,
    userAgent: userAgent ?? undefined,
  });

  return NextResponse.json({ results });
}
