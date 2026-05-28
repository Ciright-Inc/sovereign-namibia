import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";
import { getAuditGeo } from "@/lib/audit-geo";
import { writeAuditLog } from "@/lib/audit";
import {
  createMapPin,
  listMapPinsAdmin,
  logMapPinAudit,
} from "@/lib/map/map-pins-service";

const createSchema = z.object({
  pin_name: z.string().min(2),
  pin_type: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  region: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  trust_rating: z.number().int().min(0).max(100).optional(),
  transparency_score: z.number().int().min(0).max(100).optional(),
  source_attribution: z.string().optional(),
  public_visibility_rules: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.map_pins.read", 120);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "map_pins.read")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const result = await listMapPinsAdmin({
    q: sp.get("q") ?? undefined,
    region: sp.get("region") ?? undefined,
    pinType: sp.get("pinType") ?? undefined,
    verificationStatus: sp.get("verificationStatus") ?? undefined,
    includeArchived: sp.get("includeArchived") === "1",
    limit: sp.get("limit") ? Number(sp.get("limit")) : 50,
    offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.map_pins.write", 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "map_pins.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { ip, userAgent } = getClientInfo(request);
  const { geoCountry } = getAuditGeo(request);

  const pin = await createMapPin(parsed.data as any, session.userId);

  await logMapPinAudit(pin.id, "map_pins.create", session.userId, parsed.data as any, ip ?? undefined, geoCountry ?? undefined);
  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "map_pins.create",
    resourceType: "sn_map_pins",
    resourceId: pin.id,
    ipAddress: ip ?? undefined,
    userAgent: userAgent ?? undefined,
    metadata: { geoCountry },
  });

  return NextResponse.json({ pin });
}

