import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateKycStep } from "@/lib/kyc-service";
import { getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  step: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { step, data } = schema.parse(body);
    const { ip } = getClientInfo(request);
    const result = await updateKycStep(id, step, data, { ip });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to update step." }, { status: 400 });
  }
}
