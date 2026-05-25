import { NextRequest } from "next/server";
import { query } from "@/lib/db";

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "60", 10);

export async function checkRateLimit(
  request: NextRequest,
  action: string,
  maxRequests = MAX_REQUESTS
): Promise<{ allowed: boolean; remaining: number }> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const identifier = `${ip}:${action}`;

  try {
    const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);

    const result = await query<{ count: string }>(
      `INSERT INTO sn_rate_limits (identifier, action, window_start, count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (identifier, action, window_start)
       DO UPDATE SET count = sn_rate_limits.count + 1
       RETURNING count`,
      [identifier, action, windowStart.toISOString()]
    );

    const count = parseInt(result.rows[0]?.count ?? "1", 10);
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    };
  } catch {
    return { allowed: true, remaining: maxRequests };
  }
}

export function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const deviceFingerprint = request.headers.get("x-device-fingerprint") ?? null;
  return { ip, userAgent, deviceFingerprint };
}
