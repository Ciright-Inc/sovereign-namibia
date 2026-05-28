import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { submitPublicCorrection } from "@/lib/map/map-pins-service";

export const dynamic = "force-dynamic";

const schema = z.object({
  pin_id: z.string().optional(),
  request_type: z.string().min(3),
  proposed_changes: z.record(z.string(), z.unknown()).optional(),
  evidence_text: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "public.map_corrections.submit", 20);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { ip, userAgent } = getClientInfo(request);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await submitPublicCorrection(parsed.data);
  await writeAuditLog({
    actorType: "system",
    action: "public.map_corrections.submit",
    resourceType: "sn_map_pin_corrections",
    resourceId: result.id,
    ipAddress: ip ?? undefined,
    userAgent: userAgent ?? undefined,
    metadata: { pin_id: parsed.data.pin_id ?? null, request_type: parsed.data.request_type },
  });

  return NextResponse.json({ success: true, id: result.id });
}

