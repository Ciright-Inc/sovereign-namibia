import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo } from "@/lib/rate-limit";
import { listPublicMapPins } from "@/lib/map/map-pins-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "public.map_pins.read", 180);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const sp = request.nextUrl.searchParams;
  const { ip, userAgent } = getClientInfo(request);

  const result = await listPublicMapPins({
    region: sp.get("region") ?? undefined,
    type: sp.get("type") ?? undefined,
  });

  await writeAuditLog({
    actorType: "system",
    action: "public.map_pins.read",
    resourceType: "sn_map_pins",
    metadata: { region: sp.get("region") ?? null, type: sp.get("type") ?? null },
    ipAddress: ip ?? undefined,
    userAgent: userAgent ?? undefined,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

