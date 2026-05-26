import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import {
  getRegistryRecord,
  updateRegistryRecord,
  deleteRegistryRecord,
  listRegistryNotes,
  listRegistryAttachments,
  listRegistryAuditHistory,
  logRegistryAudit,
} from "@/lib/registry-service";
import { writeAuditLog } from "@/lib/audit";
import { getAuditGeo } from "@/lib/audit-geo";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.read")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const record = await getRegistryRecord(id);
  if (!record) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [notes, attachments, auditHistory] = await Promise.all([
    listRegistryNotes(id),
    listRegistryAttachments(id),
    listRegistryAuditHistory(id),
  ]);

  return NextResponse.json({ record, notes, attachments, auditHistory });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rate = await checkRateLimit(request, "admin.registry.write", 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { ip, geoCountry } = getAuditGeo(request);

  const record = await updateRegistryRecord(id, body, session.userId);
  if (!record) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await logRegistryAudit(id, "registry.update", session.userId, body, ip ?? undefined, geoCountry ?? undefined);
  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "registry.update",
    resourceType: record.entity_type,
    resourceId: record.id,
    metadata: { geoCountry },
    ipAddress: ip ?? undefined,
  });

  return NextResponse.json({ record });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.delete")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const { ip, geoCountry } = getAuditGeo(request);
  const existing = await getRegistryRecord(id);
  const ok = await deleteRegistryRecord(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "registry.delete",
    resourceType: existing?.entity_type,
    resourceId: existing?.id,
    metadata: { geoCountry },
    ipAddress: ip ?? undefined,
  });

  return NextResponse.json({ success: true });
}
