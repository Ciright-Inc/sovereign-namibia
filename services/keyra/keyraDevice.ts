import type { DeviceContext, KeyraContext, KeyraDeviceType } from "./types";
import { createKeyraContext } from "./keyraClient";
import { persistDeviceContext } from "@/lib/keyra-persistence";
import { KeyraAnalytics } from "./keyraAnalytics";

export type ClientDeviceInput = {
  device_type: KeyraDeviceType;
  operating_system: string;
  browser: string;
  screen_width: number;
  screen_height: number;
  touch_capable: boolean;
  visitor_id: string;
  session_id: string;
};

export const KeyraDevice = {
  classifyDevice(input: ClientDeviceInput): DeviceContext {
    return {
      device_type: input.device_type,
      operating_system: input.operating_system,
      browser: input.browser,
      screen_width: input.screen_width,
      screen_height: input.screen_height,
      touch_capable: input.touch_capable,
      vpn_proxy_risk: "unknown",
      session_id: input.session_id,
      visitor_id: input.visitor_id,
      created_at: new Date().toISOString(),
    };
  },

  async registerDevice(
    input: ClientDeviceInput & { ip_address?: string; country_detected?: string; city_detected?: string },
    ctx?: Partial<KeyraContext>
  ) {
    const context = createKeyraContext(ctx);
    const device = this.classifyDevice(input);
    device.ip_address = input.ip_address;
    device.country_detected = input.country_detected;
    device.city_detected = input.city_detected;

    const deviceId = await persistDeviceContext(device);
    device.device_id = deviceId;

    await KeyraAnalytics.captureEvent("device_detected", {
      ...context,
      device_id: deviceId,
      metadata: { device_type: device.device_type },
    });

    return { device, device_id: deviceId, context };
  },

  isPrimaryIdentityDevice(deviceType: KeyraDeviceType): boolean {
    return deviceType === "mobile" || deviceType === "tablet";
  },

  requiresQrHandoff(deviceType: KeyraDeviceType): boolean {
    return deviceType === "desktop";
  },
};
