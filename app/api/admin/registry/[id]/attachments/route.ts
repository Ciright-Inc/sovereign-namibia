import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { addRegistryAttachment, logRegistryAudit } from "@/lib/registry-service";
import { writeAuditLog } from "@/lib/audit";
import { getAuditGeo } from "@/lib/audit-geo";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { filename, storageKey, mimeType } = body;
  if (!filename || !storageKey) return NextResponse.json({ error: "filename and storageKey required." }, { status: 400 });

  const { ip, geoCountry } = getAuditGeo(request);
  const attachment = await addRegistryAttachment(id, filename, storageKey, mimeType, session.userId);
  await logRegistryAudit(id, "registry.attachment.add", session.userId, { filename }, ip ?? undefined, geoCountry ?? undefined);
  await writeAuditLog({ actorType: "admin", actorId: session.userId, action: "registry.attachment.add", resourceId: id, ipAddress: ip ?? undefined, metadata: { geoCountry, filename } });

  return NextResponse.json({ attachment });
}
