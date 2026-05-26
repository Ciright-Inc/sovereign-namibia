import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { importRegistryData, listImports, rollbackImport } from "@/lib/registry-import-service";
import { writeAuditLog } from "@/lib/audit";
import { getAuditGeo } from "@/lib/audit-geo";
import type { RegistryEntityType } from "@/lib/admin-rbac";

export async function GET() {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "import.data")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const imports = await listImports();
  return NextResponse.json({ imports });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "import.data")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const { format, entityType, content, filename, fieldMapping } = body;
  if (!format || !entityType || !content) {
    return NextResponse.json({ error: "format, entityType, and content required." }, { status: 400 });
  }

  const { ip, geoCountry } = getAuditGeo(request);
  const result = await importRegistryData({
    format,
    entityType: entityType as RegistryEntityType,
    content,
    filename,
    fieldMapping,
    adminId: session.userId,
  });

  await writeAuditLog({
    actorType: "admin",
    actorId: session.userId,
    action: "registry.import",
    metadata: { format, entityType, imported: result.recordsImported, failed: result.recordsFailed, geoCountry },
    ipAddress: ip ?? undefined,
  });

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "import.data")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const importId = request.nextUrl.searchParams.get("id");
  if (!importId) return NextResponse.json({ error: "id required." }, { status: 400 });

  const ok = await rollbackImport(importId, session.userId);
  if (!ok) return NextResponse.json({ error: "Rollback failed or already rolled back." }, { status: 400 });

  await writeAuditLog({ actorType: "admin", actorId: session.userId, action: "registry.import.rollback", resourceId: importId });
  return NextResponse.json({ success: true });
}
