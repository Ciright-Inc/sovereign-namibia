import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-rbac";
import { addRegistryNote, logRegistryAudit } from "@/lib/registry-service";
import { writeAuditLog } from "@/lib/audit";
import { getAuditGeo } from "@/lib/audit-geo";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "registry.write")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const { note } = await request.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note required." }, { status: 400 });

  const { ip, geoCountry } = getAuditGeo(request);
  const created = await addRegistryNote(id, note.trim(), session.userId);
  await logRegistryAudit(id, "registry.note.add", session.userId, { note: note.trim() }, ip ?? undefined, geoCountry ?? undefined);
  await writeAuditLog({ actorType: "admin", actorId: session.userId, action: "registry.note.add", resourceId: id, ipAddress: ip ?? undefined, metadata: { geoCountry } });

  return NextResponse.json({ note: created });
}
