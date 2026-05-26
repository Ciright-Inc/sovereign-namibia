#!/usr/bin/env node
import pg from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_SEED = JSON.parse(readFileSync(join(__dirname, "../data/registry-seed.json"), "utf8"));

const DEMO_RECORDS = [
  {
    id: "11111111-1111-4111-8111-111111111001",
    legalName: "Johannes Chirongo",
    mobile: "+264811234441",
    email: "johannes.chirongo@email.na",
    region: "Khomas",
    accountState: "Unclaimed",
    dob: "1985-03-15",
    nationalId: "85031500123",
  },
  {
    id: "11111111-1111-4111-8111-111111111002",
    legalName: "Maria Nghidinwa",
    mobile: "+264812345678",
    email: "maria.n@email.na",
    region: "Erongo",
    accountState: "Unclaimed",
    dob: "1990-07-22",
    nationalId: "90072200456",
  },
];

function hashValue(value) {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    return crypto.createHash("sha256").update("dev-sovereign-namibia-key").digest();
  }
  return Buffer.from(key, "hex");
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function getAdminEmail() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sovereignnamibia.com";
  try {
    const host = new URL(appUrl).hostname.replace(/^www\./, "");
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return "admin@sovereignnamibia.com";
    }
    return `admin@${host}`;
  } catch {
    return "admin@sovereignnamibia.com";
  }
}

function getPgConfig(connectionString) {
  const needsSsl =
    process.env.PGSSLMODE === "require" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    /sslmode=require/i.test(connectionString) ||
    /\.railway\.app|\.rlwy\.net/i.test(connectionString);
  return {
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}

async function waitAndConnect(connectionString) {
  const maxRetries = Number(process.env.DB_MIGRATE_MAX_RETRIES ?? 30);
  const delayMs = Number(process.env.DB_MIGRATE_RETRY_MS ?? 2000);
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = new pg.Client(getPgConfig(connectionString));
    try {
      await client.connect();
      await client.query("SELECT 1");
      return client;
    } catch (err) {
      try {
        await client.end();
      } catch {
        /* ignore */
      }
      if (attempt === maxRetries) throw err;
      console.log(`[seed] Database not ready (${attempt}/${maxRetries}), retrying…`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Unable to connect to database");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = await waitAndConnect(connectionString);

  try {
    const roles = [
      "Super Admin",
      "Registry Admin",
      "Data Entry Operator",
      "Read Only Analyst",
      "KYC Reviewer",
      "CMS Editor",
      "News Moderator",
      "Telecom Admin",
      "Security Officer",
      "Support Agent",
      "Government Observer",
    ];

    for (const role of roles) {
      await client.query(
        `INSERT INTO sn_roles (name, permissions) VALUES ($1, '[]'::jsonb) ON CONFLICT (name) DO NOTHING`,
        [role]
      );
    }

    const adminRole = await client.query(`SELECT id FROM sn_roles WHERE name = 'Super Admin'`);
    const roleId = adminRole.rows[0]?.id;

    if (roleId) {
      const adminEmail = getAdminEmail();
      const updateAdmin = process.env.SEED_UPDATE_ADMIN === "true";
      await client.query(
        updateAdmin
          ? `INSERT INTO sn_admin_users (email, password_hash, full_name, role_id, must_reset_password)
             VALUES ($1, $2, $3, $4, TRUE)
             ON CONFLICT (email) DO UPDATE SET
               password_hash = EXCLUDED.password_hash,
               must_reset_password = TRUE`
          : `INSERT INTO sn_admin_users (email, password_hash, full_name, role_id, must_reset_password)
             VALUES ($1, $2, $3, $4, TRUE)
             ON CONFLICT (email) DO NOTHING`,
        [adminEmail, hashPassword("Namibia2026!"), "System Administrator", roleId]
      );
      console.log(`Admin seeded: ${adminEmail}${updateAdmin ? " (password refreshed)" : ""}`);
    }

    for (const record of REGISTRY_SEED) {
      const searchText = [record.name, record.acronym, record.description, record.category, record.province, JSON.stringify(record.metadata ?? {})]
        .filter(Boolean)
        .join(" ");
      await client.query(
        `INSERT INTO sn_national_registry
          (registry_id, entity_type, name, acronym, description, category, status, verification_status,
           province, address, gps_lat, gps_lng, website, primary_email, primary_phone, metadata, tags, search_text)
         VALUES ($1,$2,$3,$4,$5,$6,'active','verified',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (registry_id) DO NOTHING`,
        [
          record.registry_id,
          record.entity_type,
          record.name,
          record.acronym ?? null,
          record.description ?? null,
          record.category ?? null,
          record.province ?? null,
          record.address ?? null,
          record.gps_lat ?? null,
          record.gps_lng ?? null,
          record.website ?? null,
          record.primary_email ?? null,
          record.primary_phone ?? null,
          JSON.stringify(record.metadata ?? {}),
          record.tags ?? [],
          searchText,
        ]
      );
    }

    for (const record of DEMO_RECORDS) {
      await client.query(
        `INSERT INTO sn_citizen_directory_records
          (id, legal_name_encrypted, legal_name_search_hash, date_of_birth_encrypted,
           national_id_encrypted, national_id_last4, mobile_encrypted, email_encrypted,
           region, account_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING`,
        [
          record.id,
          encrypt(record.legalName),
          hashValue(record.legalName),
          encrypt(record.dob),
          encrypt(record.nationalId),
          record.nationalId.slice(-4),
          encrypt(record.mobile),
          record.email ? encrypt(record.email) : null,
          record.region,
          record.accountState,
        ]
      );
    }

    await client.query(
      `INSERT INTO sn_cms_pages (slug, title, content, page_type, status, language, featured, seo_title, seo_description, publish_date)
       SELECT $1::varchar, $2::varchar, $3::jsonb, $4::varchar, 'published', 'en', true, $5::varchar, $6::text, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM sn_cms_pages WHERE slug = $1 AND language = 'en' AND status = 'published')`,
      [
        "home",
        "Sovereign Digital Identity for Namibia",
        JSON.stringify({
          hero: "Namibia's Trusted Digital Registry Infrastructure",
          subtitle:
            "Secure identity, institutional records, verified infrastructure, and sovereign digital trust for the AI era.",
          notices: [
            {
              title: "National Digital Identity Programme",
              body: "Citizens may now search for and claim pre-created identity records.",
            },
          ],
        }),
        "homepage",
        "Sovereign Namibia — National Digital Identity",
        "Official sovereign digital identity platform for Namibian citizens.",
      ]
    );

    const articles = [
      {
        slug: "digital-identity-launch",
        title: "Namibia Launches Sovereign Digital Identity Platform",
        excerpt: "Citizens can now find and claim their national digital identity records.",
        category: "National Notices",
      },
      {
        slug: "telecom-partnership",
        title: "Telecom Partners Support SIM Verification",
        excerpt: "Mobile network operators join the national identity verification programme.",
        category: "Telecom",
      },
    ];

    for (const article of articles) {
      await client.query(
        `INSERT INTO sn_cms_articles (slug, title, excerpt, content, category, status, language, featured, publish_date)
         SELECT $1::varchar, $2::varchar, $3::text, $4::jsonb, $5::varchar, 'published', 'en', $6::boolean, NOW()
         WHERE NOT EXISTS (SELECT 1 FROM sn_cms_articles WHERE slug = $1)`,
        [
          article.slug,
          article.title,
          article.excerpt,
          JSON.stringify({ body: article.excerpt }),
          article.category,
          article.slug === "digital-identity-launch",
        ]
      );
    }

    console.log("Seed complete.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
