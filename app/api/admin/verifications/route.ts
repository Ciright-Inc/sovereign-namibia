import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listVerificationQueue } from "@/lib/pending-verification-service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const queue = await listVerificationQueue();
  return NextResponse.json({ queue });
}
