import { NextResponse } from "next/server";
import { getPlatformStatus } from "@/lib/status-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getPlatformStatus();
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
