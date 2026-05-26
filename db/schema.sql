-- Sovereign Namibia — Digital Identity Platform Schema
-- PostgreSQL with encryption at rest for sensitive fields (app-layer AES-256-GCM)
-- Uses gen_random_uuid() (PostgreSQL 13+) — no superuser extensions required

-- ─── Roles & Permissions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id INT REFERENCES sn_roles(id),
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_encrypted BYTEA,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users & Citizen Profiles ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_state VARCHAR(32) NOT NULL DEFAULT 'Pre-Created',
  email_hash VARCHAR(64),
  mobile_hash VARCHAR(64),
  password_hash TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  device_fingerprint TEXT,
  ip_last_login INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_citizen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sn_users(id) ON DELETE CASCADE,
  legal_name_encrypted BYTEA NOT NULL,
  date_of_birth_encrypted BYTEA,
  national_id_encrypted BYTEA,
  region VARCHAR(128),
  language_preference VARCHAR(8) DEFAULT 'en',
  profile_photo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_citizen_directory_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sn_users(id) ON DELETE SET NULL,
  legal_name_encrypted BYTEA NOT NULL,
  legal_name_search_hash VARCHAR(64) NOT NULL,
  date_of_birth_encrypted BYTEA,
  national_id_encrypted BYTEA,
  national_id_last4 VARCHAR(4),
  mobile_encrypted BYTEA,
  email_encrypted BYTEA,
  region VARCHAR(128),
  account_state VARCHAR(32) NOT NULL DEFAULT 'Unclaimed',
  source VARCHAR(64) DEFAULT 'government_registry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_directory_name_hash ON sn_citizen_directory_records(legal_name_search_hash);
CREATE INDEX IF NOT EXISTS idx_sn_directory_region ON sn_citizen_directory_records(region);
CREATE INDEX IF NOT EXISTS idx_sn_directory_state ON sn_citizen_directory_records(account_state);

-- ─── Identity Claims ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_identity_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_record_id UUID NOT NULL REFERENCES sn_citizen_directory_records(id),
  user_id UUID REFERENCES sn_users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'Claim Started',
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  otp_code_hash VARCHAR(128),
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INT NOT NULL DEFAULT 0,
  ip_address INET,
  device_fingerprint TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── KYC ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_kyc_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sn_users(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES sn_identity_claims(id),
  status VARCHAR(48) NOT NULL DEFAULT 'Not Started',
  personal_info JSONB DEFAULT '{}'::jsonb,
  address_info JSONB DEFAULT '{}'::jsonb,
  reviewer_id UUID REFERENCES sn_admin_users(id),
  review_notes TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_application_id UUID NOT NULL REFERENCES sn_kyc_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(64) NOT NULL,
  side VARCHAR(16) DEFAULT 'front',
  storage_key TEXT NOT NULL,
  file_hash VARCHAR(128) NOT NULL,
  mime_type VARCHAR(128),
  file_size_bytes INT,
  quality_score DECIMAL(5, 2),
  encrypted BOOLEAN NOT NULL DEFAULT TRUE,
  admin_review_flag BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Telecom Verification ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_telecom_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sn_users(id) ON DELETE CASCADE,
  kyc_application_id UUID REFERENCES sn_kyc_applications(id),
  mobile_number_encrypted BYTEA NOT NULL,
  carrier VARCHAR(128),
  sim_type VARCHAR(16) DEFAULT 'SIM',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  verification_token_hash VARCHAR(128),
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Contact Details ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_mobile_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sn_users(id) ON DELETE CASCADE,
  number_encrypted BYTEA NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_email_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sn_users(id) ON DELETE CASCADE,
  email_encrypted BYTEA NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sn_users(id) ON DELETE CASCADE,
  line1_encrypted BYTEA,
  line2_encrypted BYTEA,
  city VARCHAR(128),
  region VARCHAR(128),
  postal_code VARCHAR(32),
  country VARCHAR(2) DEFAULT 'NA',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sessions ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sn_users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES sn_admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_sessions_token ON sn_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sn_sessions_expires ON sn_sessions(expires_at);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type VARCHAR(16) NOT NULL,
  actor_id UUID,
  action VARCHAR(128) NOT NULL,
  resource_type VARCHAR(64),
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  immutable_hash VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_audit_created ON sn_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sn_audit_action ON sn_audit_logs(action);

-- ─── CMS ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(512) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_type VARCHAR(64) NOT NULL DEFAULT 'page',
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  language VARCHAR(8) NOT NULL DEFAULT 'en',
  author_id UUID REFERENCES sn_admin_users(id),
  editor_id UUID REFERENCES sn_admin_users(id),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_alert BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  publish_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug, language, version)
);

CREATE TABLE IF NOT EXISTS sn_cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES sn_cms_pages(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL,
  changed_by UUID REFERENCES sn_admin_users(id),
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_cms_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT,
  logo_url TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_cms_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(512) NOT NULL,
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  category VARCHAR(128),
  source_id UUID REFERENCES sn_cms_sources(id),
  iframe_url TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  language VARCHAR(8) NOT NULL DEFAULT 'en',
  author_id UUID REFERENCES sn_admin_users(id),
  editor_id UUID REFERENCES sn_admin_users(id),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_alert BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title VARCHAR(255),
  seo_description TEXT,
  publish_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fix forward reference: recreate articles without source FK first, add later
-- Articles table created above references cms_sources before it exists — reorder in migration script

CREATE TABLE IF NOT EXISTS sn_news_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  feed_url TEXT,
  source_id UUID REFERENCES sn_cms_sources(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES sn_cms_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES sn_users(id),
  content TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(64) NOT NULL,
  resource_id UUID NOT NULL,
  moderator_id UUID REFERENCES sn_admin_users(id),
  action VARCHAR(64) NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── System Alerts ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(512) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES sn_admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Rate Limiting ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sn_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_sn_rate_limits_lookup ON sn_rate_limits(identifier, action, window_start);

-- ─── Account Access & Pending Verification (v2) ─────────────────────────────

ALTER TABLE sn_users ADD COLUMN IF NOT EXISTS account_type VARCHAR(64);

CREATE TABLE IF NOT EXISTS sn_auth_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_hash VARCHAR(64) NOT NULL,
  otp_code_hash VARCHAR(128),
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES sn_users(id) ON DELETE SET NULL,
  ip_address INET,
  device_fingerprint TEXT,
  purpose VARCHAR(32) NOT NULL DEFAULT 'account_access',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_auth_otp_mobile ON sn_auth_otp_challenges(mobile_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS sn_pending_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sn_users(id) ON DELETE SET NULL,
  account_type VARCHAR(64) NOT NULL,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  review_status VARCHAR(32) NOT NULL DEFAULT 'Unreviewed',
  submitted_data_encrypted BYTEA NOT NULL,
  mobile_hash VARCHAR(64),
  ip_address INET,
  device_fingerprint TEXT,
  search_criteria JSONB DEFAULT '{}'::jsonb,
  flag_reason VARCHAR(128),
  reviewer_id UUID REFERENCES sn_admin_users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_pending_verification_status ON sn_pending_verifications(verification_status, review_status);

CREATE TABLE IF NOT EXISTS sn_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(64) NOT NULL,
  mobile_hash VARCHAR(64),
  ip_address INET,
  country_code VARCHAR(2),
  device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_security_events_type ON sn_security_events(event_type, created_at DESC);

-- ─── KEYRA Trust Architecture ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS keyra_objects (
  id VARCHAR(128) PRIMARY KEY,
  parent_object_id VARCHAR(128),
  object_type VARCHAR(64) NOT NULL,
  object_name VARCHAR(255) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  domain VARCHAR(255),
  environment VARCHAR(32) NOT NULL DEFAULT 'production',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  canonical_path VARCHAR(512) NOT NULL,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_by VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyra_device_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(128) NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  device_type VARCHAR(16) NOT NULL,
  operating_system VARCHAR(64),
  browser VARCHAR(128),
  screen_width INT,
  screen_height INT,
  touch_capable BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address INET,
  country_detected VARCHAR(2),
  city_detected VARCHAR(128),
  vpn_proxy_risk VARCHAR(16) DEFAULT 'unknown',
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyra_device_session ON keyra_device_records(session_id);

CREATE TABLE IF NOT EXISTS keyra_visitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(128) NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  ip_address INET,
  country VARCHAR(2),
  region VARCHAR(128),
  city VARCHAR(128),
  device_type VARCHAR(16),
  operating_system VARCHAR(64),
  browser VARCHAR(128),
  referrer TEXT,
  landing_page TEXT,
  current_page TEXT,
  utm_source VARCHAR(128),
  utm_medium VARCHAR(128),
  utm_campaign VARCHAR(128),
  time_on_page INT DEFAULT 0,
  scroll_depth INT DEFAULT 0,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  keyra_object_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(visitor_id, session_id)
);

CREATE TABLE IF NOT EXISTS keyra_event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(64) NOT NULL,
  visitor_id VARCHAR(128) NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  user_id UUID,
  device_id UUID,
  keyra_object_id VARCHAR(128) NOT NULL,
  country_code VARCHAR(2) NOT NULL DEFAULT 'NA',
  ip_address INET,
  page_url TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyra_events_name ON keyra_event_analytics(event_name, created_at DESC);

CREATE TABLE IF NOT EXISTS keyra_qr_pairing_sessions (
  id UUID PRIMARY KEY,
  keyra_object_id VARCHAR(128) NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  desktop_pairing_token VARCHAR(128) NOT NULL UNIQUE,
  nonce VARCHAR(128) NOT NULL,
  callback_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  desktop_device_id UUID,
  user_id UUID REFERENCES sn_users(id),
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  scanned_at TIMESTAMPTZ,
  paired_at TIMESTAMPTZ,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyra_qr_token ON keyra_qr_pairing_sessions(desktop_pairing_token);

CREATE TABLE IF NOT EXISTS keyra_otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(128) NOT NULL,
  mobile_hash VARCHAR(64) NOT NULL,
  otp_code_hash VARCHAR(128),
  expires_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  keyra_object_id VARCHAR(128) NOT NULL,
  device_id UUID,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyra_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sn_users(id),
  visitor_id VARCHAR(128),
  session_id VARCHAR(128) NOT NULL,
  consent_type VARCHAR(64) NOT NULL,
  accepted BOOLEAN NOT NULL,
  keyra_object_id VARCHAR(128) NOT NULL,
  ip_address INET,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyra_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(128) NOT NULL,
  keyra_object_id VARCHAR(128) NOT NULL,
  actor_id UUID,
  session_id VARCHAR(128),
  metadata_json JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sn_users ADD COLUMN IF NOT EXISTS keyra_object_id VARCHAR(128);
ALTER TABLE sn_users ADD COLUMN IF NOT EXISTS primary_device_id UUID;
ALTER TABLE sn_users ADD COLUMN IF NOT EXISTS desktop_device_id UUID;

-- ─── National Registry Architecture ───────────────────────────────────────────

ALTER TABLE sn_admin_users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS sn_national_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id VARCHAR(32) NOT NULL UNIQUE,
  entity_type VARCHAR(32) NOT NULL,
  name VARCHAR(512) NOT NULL,
  acronym VARCHAR(64),
  description TEXT,
  category VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  national_classification VARCHAR(64) DEFAULT 'sovereign',
  province VARCHAR(128),
  address TEXT,
  gps_lat DECIMAL(10, 7),
  gps_lng DECIMAL(10, 7),
  website VARCHAR(512),
  primary_email VARCHAR(255),
  primary_phone VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  relationships JSONB DEFAULT '[]'::jsonb,
  search_text TEXT,
  created_by UUID REFERENCES sn_admin_users(id),
  last_modified_by UUID REFERENCES sn_admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_registry_entity ON sn_national_registry(entity_type, status);
CREATE INDEX IF NOT EXISTS idx_sn_registry_search ON sn_national_registry USING gin(to_tsvector('english', coalesce(search_text, name)));

CREATE TABLE IF NOT EXISTS sn_registry_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(512),
  format VARCHAR(16) NOT NULL,
  entity_type VARCHAR(32),
  records_total INT DEFAULT 0,
  records_imported INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  imported_by UUID REFERENCES sn_admin_users(id),
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sn_registry_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_record_id UUID NOT NULL REFERENCES sn_national_registry(id) ON DELETE CASCADE,
  filename VARCHAR(512) NOT NULL,
  mime_type VARCHAR(128),
  storage_key TEXT NOT NULL,
  uploaded_by UUID REFERENCES sn_admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_registry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_record_id UUID NOT NULL REFERENCES sn_national_registry(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES sn_admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Search indexes (pg_trgm extension applied optionally in migrate.mjs)
CREATE INDEX IF NOT EXISTS idx_sn_registry_name_lower ON sn_national_registry(lower(name));

CREATE TABLE IF NOT EXISTS sn_registry_audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_record_id UUID NOT NULL REFERENCES sn_national_registry(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL,
  actor_id UUID REFERENCES sn_admin_users(id),
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  geo_country VARCHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_registry_audit_record ON sn_registry_audit_history(registry_record_id, created_at DESC);

ALTER TABLE sn_registry_imports ADD COLUMN IF NOT EXISTS field_mapping JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sn_registry_imports ADD COLUMN IF NOT EXISTS rollback_snapshot JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sn_registry_imports ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sn_admin_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES sn_admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default RBAC permissions on roles
UPDATE sn_roles SET permissions = '["registry.read","registry.write","registry.delete","search.global","import.data","audit.read","access.manage","api.manage","settings.manage","citizen.read","citizen.read_sensitive"]'::jsonb WHERE name = 'Super Admin';
UPDATE sn_roles SET permissions = '["registry.read","registry.write","search.global","import.data","audit.read","api.manage","citizen.read"]'::jsonb WHERE name = 'Registry Admin';
UPDATE sn_roles SET permissions = '["registry.read","registry.write","search.global","import.data","citizen.read"]'::jsonb WHERE name = 'Data Entry Operator';
UPDATE sn_roles SET permissions = '["registry.read","search.global","audit.read","citizen.read"]'::jsonb WHERE name = 'Read Only Analyst';
