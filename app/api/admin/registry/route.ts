import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { listRegistryRecords, createRegistryRecord, logRegistryAudit } from "@/lib/registry-service";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo, checkRateLimit } from "@/lib/rate-limit";
import { getAuditGeo } from "@/lib/audit-geo";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.registry.read", 120);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.read")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entityType = request.nextUrl.searchParams.get("entityType") as RegistryEntityType | null;
  const q = request.nextUrl.searchParams.get("q") ?? undefined;

  if (!entityType) {
    return NextResponse.json({ error: "entityType required." }, { status: 400 });
  }

  const result = await listRegistryRecords(entityType, { q, limit: 100 });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "admin.registry.write", 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ip, userAgent } = getClientInfo(request);
    const { geoCountry } = getAuditGeo(request);

    const record = await createRegistryRecord(
      {
        entity_type: body.entity_type,
        name: body.name,
        acronym: body.acronym ?? null,
        description: body.description ?? null,
        category: body.category ?? null,
        status: body.status ?? "active",
        verification_status: body.verification_status ?? "pending",
        national_classification: body.national_classification ?? "sovereign",
        province: body.province ?? null,
        address: body.address ?? null,
        gps_lat: body.gps_lat ?? null,
        gps_lng: body.gps_lng ?? null,
        website: body.website ?? null,
        primary_email: body.primary_email ?? null,
        primary_phone: body.primary_phone ?? null,
        metadata: body.metadata ?? {},
        tags: body.tags ?? [],
        relationships: body.relationships ?? [],
      },
      session.userId
    );

    await logRegistryAudit(record.id, "registry.create", session.userId, { name: record.name }, ip ?? undefined, geoCountry ?? undefined);
    await writeAuditLog({
      actorType: "admin",
      actorId: session.userId,
      action: "registry.create",
      resourceType: body.entity_type,
      resourceId: record.id,
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
      metadata: { geoCountry },
    });

    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
