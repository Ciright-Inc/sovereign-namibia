import { NextResponse } from "next/server";
import { isDatabaseReady } from "@/lib/db";

export async function GET() {
  const db = await isDatabaseReady();
  return NextResponse.json({
    name: "Sovereign Namibia API",
    version: "0.1.0",
    status: "operational",
    database: db ? "connected" : "demo_mode",
    endpoints: [
      "POST /api/directory/search",
      "POST /api/claim/start",
      "POST /api/claim/verify-otp",
      "GET /api/kyc/:id",
      "POST /api/kyc/:id/step",
      "GET /api/cms/pages/:slug",
      "GET /api/cms/articles",
      "POST /api/admin/auth/login",
      "GET /api/health",
    ],
  });
}
