import { NextResponse } from "next/server";
import { getPublicTrustMetrics } from "@/lib/map/map-pins-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await getPublicTrustMetrics();
  return NextResponse.json(metrics, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

