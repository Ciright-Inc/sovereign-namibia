import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { KeyraAnalytics } from "@/services/keyra/keyraAnalytics";
import type { KeyraEventName } from "@/services/keyra/types";
import { getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  event: z.string(),
  page_url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const { ip } = getClientInfo(request);
  const sessionId = request.headers.get("x-keyra-session-id") ?? undefined;
  const visitorId = request.headers.get("x-keyra-visitor-id") ?? undefined;

  try {
    const body = schema.parse(await request.json());
    await KeyraAnalytics.captureEvent(body.event as KeyraEventName, {
      session_id: sessionId,
      ip_address: ip ?? undefined,
      page_url: body.page_url,
      metadata: { visitor_id: visitorId, ...body.metadata },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }
}
