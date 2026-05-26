import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { advancedRegistrySearch } from "@/lib/registry-search-service";
import { getRegistryRecord, getRegistryStats } from "@/lib/registry-service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "graphql", 30);
  if (!rate.allowed) return NextResponse.json({ errors: [{ message: "Rate limited." }] }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "search.global")) {
    return NextResponse.json({ errors: [{ message: "Unauthorized." }] }, { status: 401 });
  }

  try {
    const body = await request.json();
    const query: string = body.query ?? "";

    if (query.includes("registryStats")) {
      const stats = await getRegistryStats();
      return NextResponse.json({ data: { registryStats: stats } });
    }

    const searchMatch = query.match(/registrySearch\s*\(\s*q\s*:\s*"([^"]*)"/);
    const entityMatch = query.match(/entityType\s*:\s*"([^"]*)"/);
    const q = searchMatch?.[1] ?? "";
    const entityType = entityMatch?.[1] ?? "all";

    if (query.includes("registrySearch")) {
      const { results, total } = await advancedRegistrySearch({
        q,
        entityType: entityType as "all" | "government" | "banking" | "healthcare" | "infrastructure" | "business" | "citizen",
        limit: 25,
      });
      return NextResponse.json({
        data: {
          registrySearch: results.map((r) => ({
            id: r.id,
            registryId: r.registry_id,
            name: r.name,
            entityType: r.entity_type,
            category: r.category,
            province: r.province,
            status: r.status,
          })),
          total,
        },
      });
    }

    const idMatch = query.match(/registryRecord\s*\(\s*id\s*:\s*"([^"]*)"/);
    if (idMatch) {
      const record = await getRegistryRecord(idMatch[1]);
      return NextResponse.json({ data: { registryRecord: record } });
    }

    return NextResponse.json({
      data: null,
      errors: [{ message: "Unsupported query. Supported: registrySearch, registryRecord, registryStats." }],
    });
  } catch (err) {
    return NextResponse.json({ errors: [{ message: err instanceof Error ? err.message : "GraphQL error." }] }, { status: 400 });
  }
}
