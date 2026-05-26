#!/usr/bin/env node
import pg from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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

const REGISTRY_SEED = [
  {
    registry_id: "REG-NA-GOV-001",
    entity_type: "government",
    name: "Ministry of Finance and Public Enterprises",
    acronym: "MOFPE",
    description: "Central ministry responsible for fiscal policy and public enterprise oversight.",
    category: "Ministry",
    province: "Khomas",
    website: "https://www.mof.gov.na",
    primary_email: "info@mof.gov.na",
    primary_phone: "+26461209511",
  },
  {
    registry_id: "REG-NA-BNK-001",
    entity_type: "banking",
    name: "Bank Windhoek",
    acronym: "BWH",
    description: "Leading commercial bank in Namibia.",
    category: "Commercial Bank",
    province: "Khomas",
    website: "https://www.bankwindhoek.com.na",
    primary_email: "info@bankwindhoek.com.na",
    primary_phone: "+26461299501",
  },
  {
    registry_id: "REG-NA-HLT-001",
    entity_type: "healthcare",
    name: "Windhoek Central Hospital",
    acronym: "WCH",
    description: "National referral hospital serving Khomas region.",
    category: "Hospital",
    province: "Khomas",
    primary_email: "wch@mhss.gov.na",
    primary_phone: "+264612033000",
  },
  {
    registry_id: "REG-NA-INF-001",
    entity_type: "infrastructure",
    name: "NamPower",
    acronym: "NAMPOWER",
    description: "National power utility of Namibia.",
    category: "Energy Infrastructure",
    province: "Khomas",
    website: "https://www.nampower.com.na",
    primary_email: "info@nampower.com.na",
    primary_phone: "+264612041111",
  },
  {
    registry_id: "REG-NA-BIZ-001",
    entity_type: "business",
    name: "Namibia Breweries Limited",
    acronym: "NBL",
    description: "Leading beverage manufacturer in Namibia.",
    category: "Manufacturing",
    province: "Khomas",
    website: "https://www.nbl.com.na",
    primary_email: "info@nbl.com.na",
    primary_phone: "+26461200500",
  },
];

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

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = new pg.Client(getPgConfig(connectionString));
  await client.connect();

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
      await client.query(
        `INSERT INTO sn_admin_users (email, password_hash, full_name, role_id, must_reset_password)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           must_reset_password = TRUE`,
        [adminEmail, hashPassword("Namibia2026!"), "System Administrator", roleId]
      );
      console.log(`Admin seeded: ${adminEmail} (must reset password on first login)`);
    }

    for (const record of REGISTRY_SEED) {
      const searchText = [record.name, record.acronym, record.description, record.category, record.province]
        .filter(Boolean)
        .join(" ");
      await client.query(
        `INSERT INTO sn_national_registry
          (registry_id, entity_type, name, acronym, description, category, status, verification_status,
           province, website, primary_email, primary_phone, metadata, search_text)
         VALUES ($1,$2,$3,$4,$5,$6,'active','verified',$7,$8,$9,$10,'{}'::jsonb,$11)
         ON CONFLICT (registry_id) DO NOTHING`,
        [
          record.registry_id,
          record.entity_type,
          record.name,
          record.acronym,
          record.description,
          record.category,
          record.province,
          record.website ?? null,
          record.primary_email ?? null,
          record.primary_phone ?? null,
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
