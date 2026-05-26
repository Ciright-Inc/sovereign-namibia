import { randomUUID } from "crypto";
import type { KeyraContext } from "./types";
import { KEYRA_SOVEREIGN_REGISTRY } from "./constants";

export function createKeyraContext(partial?: Partial<KeyraContext>): KeyraContext {
  return {
    request_id: partial?.request_id ?? randomUUID(),
    session_id: partial?.session_id ?? randomUUID(),
    user_id: partial?.user_id,
    device_id: partial?.device_id,
    country_code: partial?.country_code ?? "NA",
    ip_address: partial?.ip_address,
    timestamp: partial?.timestamp ?? new Date().toISOString(),
    metadata: partial?.metadata,
  };
}

export function getKeyraObjectId(): string {
  return KEYRA_SOVEREIGN_REGISTRY.id;
}

export function getKeyraObjectPath(): string {
  return KEYRA_SOVEREIGN_REGISTRY.canonical_path;
}

/** SDK client config — swap mockMode for live KEYRA SDK when available */
export const keyraClientConfig = {
  mockMode: process.env.KEYRA_SDK_LIVE !== "true",
  objectId: KEYRA_SOVEREIGN_REGISTRY.id,
  objectPath: KEYRA_SOVEREIGN_REGISTRY.canonical_path,
  rootDomain: "keyra.ie",
  countryCode: "NA" as const,
};
