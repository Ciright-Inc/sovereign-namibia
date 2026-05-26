import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { listRegistryRecords, globalRegistrySearch, createRegistryRecord } from "@/lib/registry-service";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo } from "@/lib/rate-limit";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export async function GET(request: NextRequest) {
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
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ip, userAgent } = getClientInfo(request);

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
        website: body.website ?? null,
        primary_email: body.primary_email ?? null,
        primary_phone: body.primary_phone ?? null,
        metadata: body.metadata ?? {},
        tags: body.tags ?? [],
      },
      session.userId
    );

    await writeAuditLog({
      actorType: "admin",
      actorId: session.userId,
      action: "registry.create",
      resourceType: body.entity_type,
      resourceId: record.id,
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
