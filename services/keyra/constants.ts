import type { KeyraObject } from "./types";

export const KEYRA_ROOT = "keyra.ie";

export const KEYRA_SOVEREIGN_REGISTRY: KeyraObject = {
  id: "keyra-countries-namibia-sovereign-registry",
  parent_object_id: "keyra-countries-namibia",
  object_type: "country_registry",
  object_name: "Sovereign Namibia",
  country_code: "NA",
  domain: "sovereignnamibia.com",
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  status: "active",
  verification_status: "verified",
  canonical_path: "keyra.ie/countries/namibia/sovereign-registry",
  created_at: "2025-04-01T00:00:00.000Z",
  updated_at: new Date().toISOString(),
  created_by: "keyra-core",
  metadata_json: {
    hierarchy: [
      "KeyraCore",
      "Countries",
      "Namibia",
      "Sovereign Registry",
      "Citizens",
      "Businesses",
      "Government",
      "Banks",
      "Healthcare",
      "Infrastructure",
      "Search",
      "Consent",
      "Audit",
      "Analytics",
      "Developer API",
    ],
    application_url: process.env.NEXT_PUBLIC_APP_URL ?? "https://sovereignnamibia.com",
  },
};

export const KEYRA_QR_TTL_MS = 5 * 60 * 1000;

export const KEYRA_MOBILE_VERIFY_PATH = "/m/verify";
