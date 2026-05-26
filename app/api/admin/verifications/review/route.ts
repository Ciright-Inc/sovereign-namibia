import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { reviewPendingVerification } from "@/lib/pending-verification-service";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  id: z.string().min(1),
  decision: z.enum(["Approved", "Rejected", "More Information Required", "Duplicate Review"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { ip, userAgent } = getClientInfo(request);

  try {
    const body = schema.parse(await request.json());
    const result = await reviewPendingVerification(
      body.id,
      body.decision,
      body.notes,
      session.userId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    await writeAuditLog({
      actorType: "admin",
      actorId: session.userId,
      action: "verification.reviewed",
      resourceType: "pending_verification",
      resourceId: body.id,
      metadata: { decision: body.decision, notes: body.notes },
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Review failed." }, { status: 500 });
  }
}
