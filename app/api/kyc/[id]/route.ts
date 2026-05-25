import { NextRequest, NextResponse } from "next/server";
import { getKycApplication } from "@/lib/kyc-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = await getKycApplication(id);
  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  return NextResponse.json(app);
}
