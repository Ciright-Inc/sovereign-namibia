"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  classifyClientDevice,
  getDeviceFingerprint,
  getOrCreateSessionId,
  getOrCreateVisitorId,
} from "@/lib/keyra-client-device";
import type { DeviceContext, KeyraDeviceType } from "@/services/keyra/types";
import { KEYRA_SOVEREIGN_REGISTRY } from "@/services/keyra/constants";

export function useKeyraSession() {
  const [deviceContext, setDeviceContext] = useState<DeviceContext | null>(null);
  const [ready, setReady] = useState(false);

  const visitorId = useMemo(() => (typeof window !== "undefined" ? getOrCreateVisitorId() : ""), []);
  const sessionId = useMemo(() => (typeof window !== "undefined" ? getOrCreateSessionId() : ""), []);

  const apiHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-device-fingerprint": typeof window !== "undefined" ? getDeviceFingerprint() : "",
      "x-keyra-visitor-id": visitorId,
      "x-keyra-session-id": sessionId,
    }),
    [visitorId, sessionId]
  );

  const registerDevice = useCallback(async () => {
    const classified = classifyClientDevice();
    const res = await fetch("/api/keyra/device", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        ...classified,
        visitor_id: visitorId,
        session_id: sessionId,
        landing_page: typeof window !== "undefined" ? window.location.pathname : "/find-account",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    });
    const data = await res.json();
    if (data.device) setDeviceContext(data.device);
    setReady(true);
    return data.device as DeviceContext;
  }, [apiHeaders, visitorId, sessionId]);

  useEffect(() => {
    registerDevice();
  }, [registerDevice]);

  const track = useCallback(
    async (event: string, metadata?: Record<string, unknown>) => {
      await fetch("/api/keyra/analytics", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          event,
          page_url: typeof window !== "undefined" ? window.location.href : undefined,
          metadata: { visitor_id: visitorId, ...metadata },
        }),
      });
    },
    [apiHeaders, visitorId]
  );

  const deviceType: KeyraDeviceType = deviceContext?.device_type ?? "unknown";
  const requiresQr = deviceType === "desktop";
  const isMobilePrimary = deviceType === "mobile" || deviceType === "tablet";

  return {
    ready,
    deviceContext,
    deviceType,
    requiresQr,
    isMobilePrimary,
    visitorId,
    sessionId,
    apiHeaders,
    track,
    keyraObject: KEYRA_SOVEREIGN_REGISTRY,
    registerDevice,
  };
}
