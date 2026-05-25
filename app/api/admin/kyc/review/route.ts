import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reviewKyc } from "@/lib/kyc-service";
import { getAdminSession } from "@/lib/auth";

const schema = z.object({
  kycId: z.string(),
  decision: z.enum(["Approved", "Rejected", "More Information Required"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { kycId, decision, notes } = schema.parse(body);
    await reviewKyc(kycId, decision, session.userId, notes);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
