import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAuditGeo } from "@/lib/audit-geo";
import { writeAuditLog } from "@/lib/audit";
import {
  deleteMapPin,
  getMapPinAdmin,
  logMapPinAudit,
  updateMapPin,
} from "@/lib/map/map-pins-service";

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  pin_name: z.string().min(2).optional(),
  pin_type: z.string().min(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  region: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  verification_status: z.string().optional(),
  verification_authority: z.string().nullable().optional(),
  verification_date: z.string().nullable().optional(),
  trust_rating: z.number().int().min(0).max(100).optional(),
  public_visibility_rules: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  source_attribution: z.string().nullable().optional(),
  transparency_score: z.number().int().min(0).max(100).optional(),
  community_feedback_status: z.string().optional(),
  correction_request_status: z.string().optional(),
  is_active: z.boolean().optional(),
  is_archived: z.boolean().optional(),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "map_pins.read")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;
  const data = await getMapPinAdmin(id);
  if (!data.pin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rate = await checkRateLimit(request, "admin.map_pins.write", 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "map_pins.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  // Verification workflow requires extra permission.
  if (
    parsed.data.verification_status !== undefined ||
    parsed.data.verification_authority !== undefined ||
    parsed.data.verification_date !== undefined
  ) {
    if (!hasPermission(session.role, "map_pins.verify")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const { ip, geoCountry } = getAuditGeo(request);
  const updated = await updateMapPin(id, parsed.data as any, session.userId);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await logMapPinAudit(id, "map_pins.update", session.userId, parsed.data as any, ip ?? undefined, geoCountry ?? undefined);
  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "map_pins.update",
    resourceType: "sn_map_pins",
    resourceId: id,
    metadata: { geoCountry },
    ipAddress: ip ?? undefined,
  });

  return NextResponse.json({ pin: updated });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "map_pins.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;
  const { ip, geoCountry } = getAuditGeo(request);

  const ok = await deleteMapPin(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await logMapPinAudit(id, "map_pins.delete", session.userId, {}, ip ?? undefined, geoCountry ?? undefined);
  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "map_pins.delete",
    resourceType: "sn_map_pins",
    resourceId: id,
    metadata: { geoCountry },
    ipAddress: ip ?? undefined,
  });

  return NextResponse.json({ success: true });
}

