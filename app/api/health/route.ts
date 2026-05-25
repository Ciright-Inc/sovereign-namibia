import { NextResponse } from "next/server";
import { isDatabaseReady } from "@/lib/db";

export async function GET() {
  const db = await isDatabaseReady();
  return NextResponse.json({
    status: db ? "healthy" : "degraded",
    database: db,
    timestamp: new Date().toISOString(),
  });
}
