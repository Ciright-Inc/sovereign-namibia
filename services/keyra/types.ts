/** KEYRA Trust Architecture — shared types for Sovereign Namibia */

export type KeyraDeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type KeyraContext = {
  request_id: string;
  session_id: string;
  user_id?: string;
  device_id?: string;
  country_code: string;
  ip_address?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type DeviceContext = {
  device_type: KeyraDeviceType;
  operating_system: string;
  browser: string;
  screen_width: number;
  screen_height: number;
  touch_capable: boolean;
  ip_address?: string;
  country_detected?: string;
  city_detected?: string;
  vpn_proxy_risk: "low" | "medium" | "high" | "unknown";
  session_id: string;
  visitor_id: string;
  device_id?: string;
  created_at: string;
};

export type KeyraObject = {
  id: string;
  parent_object_id: string;
  object_type: string;
  object_name: string;
  country_code: string;
  domain: string;
  environment: string;
  status: string;
  verification_status: string;
  canonical_path: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata_json: Record<string, unknown>;
};

export type QrPairingPayload = {
  keyra_object_id: string;
  sovereign_country_code: "NA";
  session_id: string;
  desktop_pairing_token: string;
  callback_url: string;
  expiration_timestamp: number;
  nonce: string;
};

export type KeyraEventName =
  | "page_view"
  | "session_started"
  | "device_detected"
  | "namibia_ip_verified"
  | "non_namibia_ip_blocked"
  | "create_account_clicked"
  | "admin_clicked"
  | "mobile_number_entered"
  | "invalid_mobile_number"
  | "otp_requested"
  | "otp_sent"
  | "otp_failed"
  | "otp_verified"
  | "qr_generated"
  | "qr_refreshed"
  | "qr_scanned"
  | "desktop_mobile_pairing_started"
  | "desktop_mobile_pairing_completed"
  | "desktop_mobile_pairing_expired"
  | "account_type_selected"
  | "account_form_started"
  | "account_form_completed"
  | "registry_search_started"
  | "registry_search_completed"
  | "registry_match_found"
  | "registry_match_not_found"
  | "pending_verification_created"
  | "consent_accepted"
  | "consent_rejected"
  | "login_success"
  | "login_failed"
  | "admin_login_success"
  | "admin_login_failed";

export type VisitorAnalytics = {
  visitor_id: string;
  session_id: string;
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
  device_type: KeyraDeviceType;
  operating_system?: string;
  browser?: string;
  referrer?: string;
  landing_page?: string;
  current_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  time_on_page?: number;
  scroll_depth?: number;
  click_events?: number;
  form_start_events?: number;
  form_abandon_events?: number;
  qr_generated?: boolean;
  qr_scanned?: boolean;
  otp_requested?: boolean;
  otp_verified?: boolean;
  search_attempted?: boolean;
  account_created?: boolean;
  account_type_selected?: string;
  registry_match_found?: boolean;
  registry_match_not_found?: boolean;
  verification_status?: string;
  risk_score?: number;
  keyra_object_id?: string;
  created_at: string;
};

export type UserAccount = {
  user_id: string;
  keyra_object_id: string;
  account_type: string;
  mobile_number: string;
  mobile_verified: boolean;
  primary_device_id: string;
  desktop_device_id?: string;
  country_code: "NA";
  status: string;
  created_at: string;
};
