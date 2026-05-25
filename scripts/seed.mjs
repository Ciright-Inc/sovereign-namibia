#!/usr/bin/env node
import pg from "pg";
import crypto from "crypto";

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
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
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
      await client.query(
        `INSERT INTO sn_admin_users (email, password_hash, full_name, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        ["admin@sovereignnamibia.com", hashPassword("admin12345"), "System Administrator", roleId]
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
          hero: "Your trusted national digital identity.",
          subtitle:
            "Find your citizen identity record. Claim and secure your account. Access government services with confidence.",
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
