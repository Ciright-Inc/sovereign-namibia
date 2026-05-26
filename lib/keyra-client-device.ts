import type { KeyraDeviceType } from "@/services/keyra/types";

export function classifyClientDevice(): {
  device_type: KeyraDeviceType;
  operating_system: string;
  browser: string;
  screen_width: number;
  screen_height: number;
  touch_capable: boolean;
} {
  if (typeof window === "undefined") {
    return {
      device_type: "unknown",
      operating_system: "unknown",
      browser: "unknown",
      screen_width: 0,
      screen_height: 0,
      touch_capable: false,
    };
  }

  const ua = navigator.userAgent;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  let operating_system = "unknown";
  if (/Windows/i.test(ua)) operating_system = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) operating_system = "macOS";
  else if (/Android/i.test(ua)) operating_system = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) operating_system = "iOS";
  else if (/Linux/i.test(ua)) operating_system = "Linux";

  let browser = "unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  let device_type: KeyraDeviceType = "unknown";
  const isMobileUa = /Mobi|Android.*Mobile|iPhone|iPod/i.test(ua);
  const isTabletUa = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);

  if (isMobileUa && width < 768) device_type = "mobile";
  else if (isTabletUa || (touch && width >= 768 && width < 1024)) device_type = "tablet";
  else if (width >= 1024 || (!touch && !isMobileUa)) device_type = "desktop";
  else if (touch) device_type = "tablet";
  else device_type = "mobile";

  return {
    device_type,
    operating_system,
    browser,
    screen_width: width,
    screen_height: height,
    touch_capable: touch,
  };
}

export function getOrCreateVisitorId(): string {
  const key = "keyra_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `vis-${crypto.randomUUID()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function getOrCreateSessionId(): string {
  const key = "keyra_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `ses-${crypto.randomUUID()}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function getDeviceFingerprint(): string {
  const key = "sn_device_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = `fp-${crypto.randomUUID()}`;
    localStorage.setItem(key, fp);
  }
  return fp;
}
