import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { KeyraDevice } from "@/services/keyra/keyraDevice";
import { KeyraAnalytics } from "@/services/keyra/keyraAnalytics";
import { ensureKeyraObjectSeeded } from "@/lib/keyra-persistence";
import { getClientInfo } from "@/lib/rate-limit";
import { isNamibiaIpAccess } from "@/lib/geo";

const schema = z.object({
  device_type: z.enum(["mobile", "tablet", "desktop", "unknown"]),
  operating_system: z.string(),
  browser: z.string(),
  screen_width: z.number(),
  screen_height: z.number(),
  touch_capable: z.boolean(),
  visitor_id: z.string(),
  session_id: z.string(),
  landing_page: z.string().optional(),
  referrer: z.string().optional(),
});

export async function POST(request: NextRequest) {
  await ensureKeyraObjectSeeded();
  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);
  const geo = isNamibiaIpAccess(request);

  try {
    const body = schema.parse(await request.json());
    const { device, device_id, context } = await KeyraDevice.registerDevice(
      {
        ...body,
        ip_address: ip ?? undefined,
        country_detected: geo.country ?? undefined,
      },
      {
        session_id: body.session_id,
        ip_address: ip ?? undefined,
        device_id: deviceFingerprint ?? undefined,
        metadata: { visitor_id: body.visitor_id, userAgent },
      }
    );

    await KeyraAnalytics.captureVisitor({
      visitor_id: body.visitor_id,
      session_id: body.session_id,
      ip_address: ip ?? undefined,
      country: geo.country ?? undefined,
      device_type: body.device_type,
      operating_system: body.operating_system,
      browser: body.browser,
      referrer: body.referrer,
      landing_page: body.landing_page,
      current_page: body.landing_page,
      created_at: new Date().toISOString(),
    });

    if (geo.allowed) {
      await KeyraAnalytics.captureEvent("namibia_ip_verified", {
        ...context,
        metadata: { visitor_id: body.visitor_id },
      });
    }

    return NextResponse.json({ device: { ...device, device_id }, geo_allowed: geo.allowed });
  } catch {
    return NextResponse.json({ error: "Invalid device context." }, { status: 400 });
  }
}
