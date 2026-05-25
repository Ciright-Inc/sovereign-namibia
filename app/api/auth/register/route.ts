import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerCitizenUser } from "@/lib/claim-service";
import { writeAuditLog } from "@/lib/audit";
import { getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  fullLegalName: z.string().min(2),
  mobileNumber: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const { ip, userAgent } = getClientInfo(request);
    const { userId } = await registerCitizenUser(input.mobileNumber);

    await writeAuditLog({
      actorType: "citizen",
      actorId: userId,
      action: "citizen.register",
      resourceType: "user",
      resourceId: userId,
      metadata: { hasEmail: !!input.email },
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return NextResponse.json({ userId, message: "Registration received." });
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 400 });
  }
}
