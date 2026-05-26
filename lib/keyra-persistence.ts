import { isDatabaseReady, query } from "@/lib/db";
import type { DeviceContext, KeyraEventName, VisitorAnalytics } from "@/services/keyra/types";
import { KEYRA_SOVEREIGN_REGISTRY } from "@/services/keyra/constants";

const globalDemo = globalThis as unknown as {
  keyraDemo?: {
    devices: Map<string, DeviceContext>;
    events: Array<Record<string, unknown>>;
    visitors: Map<string, VisitorAnalytics>;
    qrSessions: Map<string, Record<string, unknown>>;
    otpSessions: Map<string, Record<string, unknown>>;
  };
};

function demo() {
  if (!globalDemo.keyraDemo) {
    globalDemo.keyraDemo = {
      devices: new Map(),
      events: [],
      visitors: new Map(),
      qrSessions: new Map(),
      otpSessions: new Map(),
    };
  }
  return globalDemo.keyraDemo;
}

export async function ensureKeyraObjectSeeded() {
  if (!(await isDatabaseReady())) return;

  await query(
    `INSERT INTO keyra_objects
      (id, parent_object_id, object_type, object_name, country_code, domain, environment, status, verification_status, canonical_path, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET updated_at = NOW(), metadata_json = EXCLUDED.metadata_json`,
    [
      KEYRA_SOVEREIGN_REGISTRY.id,
      KEYRA_SOVEREIGN_REGISTRY.parent_object_id,
      KEYRA_SOVEREIGN_REGISTRY.object_type,
      KEYRA_SOVEREIGN_REGISTRY.object_name,
      KEYRA_SOVEREIGN_REGISTRY.country_code,
      KEYRA_SOVEREIGN_REGISTRY.domain,
      KEYRA_SOVEREIGN_REGISTRY.environment,
      KEYRA_SOVEREIGN_REGISTRY.status,
      KEYRA_SOVEREIGN_REGISTRY.verification_status,
      KEYRA_SOVEREIGN_REGISTRY.canonical_path,
      JSON.stringify(KEYRA_SOVEREIGN_REGISTRY.metadata_json),
    ]
  );
}

export async function persistDeviceContext(device: DeviceContext) {
  if (!(await isDatabaseReady())) {
    demo().devices.set(device.device_id ?? device.visitor_id, device);
    return device.device_id ?? device.visitor_id;
  }

  const result = await query<{ id: string }>(
    `INSERT INTO keyra_device_records
      (visitor_id, session_id, device_type, operating_system, browser, screen_width, screen_height, touch_capable, ip_address, country_detected, city_detected, vpn_proxy_risk, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [
      device.visitor_id,
      device.session_id,
      device.device_type,
      device.operating_system,
      device.browser,
      device.screen_width,
      device.screen_height,
      device.touch_capable,
      device.ip_address ?? null,
      device.country_detected ?? null,
      device.city_detected ?? null,
      device.vpn_proxy_risk,
      JSON.stringify({}),
    ]
  );
  return result.rows[0]?.id;
}

export async function persistAnalyticsEvent(input: {
  event_name: KeyraEventName;
  visitor_id: string;
  session_id: string;
  user_id?: string;
  device_id?: string;
  keyra_object_id: string;
  country_code: string;
  ip_address?: string;
  page_url?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!(await isDatabaseReady())) {
    demo().events.push({ ...input, created_at: new Date().toISOString() });
    return;
  }

  await query(
    `INSERT INTO keyra_event_analytics
      (event_name, visitor_id, session_id, user_id, device_id, keyra_object_id, country_code, ip_address, page_url, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      input.event_name,
      input.visitor_id,
      input.session_id,
      input.user_id ?? null,
      input.device_id ?? null,
      input.keyra_object_id,
      input.country_code,
      input.ip_address ?? null,
      input.page_url ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

export async function upsertVisitorAnalytics(visitor: VisitorAnalytics) {
  if (!(await isDatabaseReady())) {
    demo().visitors.set(visitor.visitor_id, visitor);
    return;
  }

  await query(
    `INSERT INTO keyra_visitor_analytics
      (visitor_id, session_id, ip_address, country, region, city, device_type, operating_system, browser, referrer, landing_page, current_page, utm_source, utm_medium, utm_campaign, time_on_page, scroll_depth, metadata_json, keyra_object_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     ON CONFLICT (visitor_id, session_id) DO UPDATE SET
       current_page = EXCLUDED.current_page,
       time_on_page = EXCLUDED.time_on_page,
       scroll_depth = GREATEST(keyra_visitor_analytics.scroll_depth, EXCLUDED.scroll_depth),
       metadata_json = keyra_visitor_analytics.metadata_json || EXCLUDED.metadata_json,
       updated_at = NOW()`,
    [
      visitor.visitor_id,
      visitor.session_id,
      visitor.ip_address ?? null,
      visitor.country ?? null,
      visitor.region ?? null,
      visitor.city ?? null,
      visitor.device_type,
      visitor.operating_system ?? null,
      visitor.browser ?? null,
      visitor.referrer ?? null,
      visitor.landing_page ?? null,
      visitor.current_page ?? null,
      visitor.utm_source ?? null,
      visitor.utm_medium ?? null,
      visitor.utm_campaign ?? null,
      visitor.time_on_page ?? 0,
      visitor.scroll_depth ?? 0,
      JSON.stringify(visitor),
      visitor.keyra_object_id ?? KEYRA_SOVEREIGN_REGISTRY.id,
    ]
  );
}

export async function createQrPairingSession(row: Record<string, unknown>) {
  if (!(await isDatabaseReady())) {
    demo().qrSessions.set(String(row.desktop_pairing_token), row);
    return row;
  }

  await query(
    `INSERT INTO keyra_qr_pairing_sessions
      (id, keyra_object_id, session_id, desktop_pairing_token, nonce, callback_url, expires_at, status, desktop_device_id, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,to_timestamp($7 / 1000.0),$8,$9,$10)`,
    [
      row.id,
      row.keyra_object_id,
      row.session_id,
      row.desktop_pairing_token,
      row.nonce,
      row.callback_url,
      row.expiration_timestamp,
      row.status ?? "pending",
      row.desktop_device_id ?? null,
      JSON.stringify(row.metadata ?? {}),
    ]
  );
  return row;
}

export async function getQrPairingSession(token: string) {
  if (!(await isDatabaseReady())) {
    const row = demo().qrSessions.get(token);
    if (!row) return null;
    return {
      id: String(row.id),
      status: String(row.status ?? "pending"),
      expires_at: new Date(Number(row.expiration_timestamp ?? Date.now() + 300000)),
      session_id: String(row.session_id),
      user_id: row.user_id ? String(row.user_id) : null,
      mobile_verified: Boolean(row.mobile_verified),
      nonce: String(row.nonce),
    };
  }

  const result = await query<{
    id: string;
    status: string;
    expires_at: Date;
    session_id: string;
    user_id: string | null;
    mobile_verified: boolean;
    nonce: string;
  }>(
    `SELECT id, status, expires_at, session_id, user_id, mobile_verified, nonce
     FROM keyra_qr_pairing_sessions WHERE desktop_pairing_token = $1`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function updateQrPairingSession(
  token: string,
  patch: Record<string, unknown>
) {
  if (!(await isDatabaseReady())) {
    const row = demo().qrSessions.get(token);
    if (row) Object.assign(row, patch);
    return row ?? null;
  }

  await query(
    `UPDATE keyra_qr_pairing_sessions
     SET status = COALESCE($2, status),
         user_id = COALESCE($3, user_id),
         mobile_verified = COALESCE($4, mobile_verified),
         scanned_at = COALESCE($5, scanned_at),
         paired_at = COALESCE($6, paired_at),
         updated_at = NOW()
     WHERE desktop_pairing_token = $1`,
    [
      token,
      patch.status ?? null,
      patch.user_id ?? null,
      patch.mobile_verified ?? null,
      patch.scanned_at ?? null,
      patch.paired_at ?? null,
    ]
  );
  return getQrPairingSession(token);
}

export async function getAnalyticsSummary() {
  if (!(await isDatabaseReady())) {
    const events = demo().events;
    const visitors = [...demo().visitors.values()];
    return {
      totalVisitors: visitors.length,
      namibiaVisitors: visitors.filter((v) => v.country === "NA").length,
      blockedNonNamibia: events.filter((e) => e.event_name === "non_namibia_ip_blocked").length,
      mobileUsers: visitors.filter((v) => v.device_type === "mobile").length,
      desktopUsers: visitors.filter((v) => v.device_type === "desktop").length,
      qrGenerated: events.filter((e) => e.event_name === "qr_generated").length,
      qrScanned: events.filter((e) => e.event_name === "qr_scanned").length,
      otpRequested: events.filter((e) => e.event_name === "otp_requested").length,
      otpVerified: events.filter((e) => e.event_name === "otp_verified").length,
      searchAttempts: events.filter((e) => e.event_name === "registry_search_started").length,
      matchFound: events.filter((e) => e.event_name === "registry_match_found").length,
      matchNotFound: events.filter((e) => e.event_name === "registry_match_not_found").length,
      failedOtp: events.filter((e) => e.event_name === "otp_failed").length,
      failedAdminLogin: events.filter((e) => e.event_name === "admin_login_failed").length,
      pendingVerifications: 0,
    };
  }

  const [visitors, events, pending] = await Promise.all([
    query<{ total: string; na: string; mobile: string; desktop: string }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE country = 'NA')::text AS na,
         COUNT(*) FILTER (WHERE device_type = 'mobile')::text AS mobile,
         COUNT(*) FILTER (WHERE device_type = 'desktop')::text AS desktop
       FROM keyra_visitor_analytics`
    ),
    query<{ event_name: string; count: string }>(
      `SELECT event_name, COUNT(*)::text AS count FROM keyra_event_analytics GROUP BY event_name`
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM sn_pending_verifications WHERE review_status = 'Unreviewed'`
    ),
  ]);

  const eventMap = Object.fromEntries(events.rows.map((r) => [r.event_name, Number(r.count)]));

  return {
    totalVisitors: Number(visitors.rows[0]?.total ?? 0),
    namibiaVisitors: Number(visitors.rows[0]?.na ?? 0),
    blockedNonNamibia: eventMap.non_namibia_ip_blocked ?? 0,
    mobileUsers: Number(visitors.rows[0]?.mobile ?? 0),
    desktopUsers: Number(visitors.rows[0]?.desktop ?? 0),
    qrGenerated: eventMap.qr_generated ?? 0,
    qrScanned: eventMap.qr_scanned ?? 0,
    otpRequested: eventMap.otp_requested ?? 0,
    otpVerified: eventMap.otp_verified ?? 0,
    searchAttempts: eventMap.registry_search_started ?? 0,
    matchFound: eventMap.registry_match_found ?? 0,
    matchNotFound: eventMap.registry_match_not_found ?? 0,
    failedOtp: eventMap.otp_failed ?? 0,
    failedAdminLogin: eventMap.admin_login_failed ?? 0,
    pendingVerifications: Number(pending.rows[0]?.count ?? 0),
  };
}
