#!/usr/bin/env node
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");

function getPoolConfig(connectionString) {
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
    const client = new pg.Client(getPoolConfig(connectionString));
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
      console.log(`[migrate] Database not ready (${attempt}/${maxRetries}), retrying…`);
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

  const sql = fs.readFileSync(schemaPath, "utf8");
  const client = await waitAndConnect(connectionString);

  try {
    await client.query(sql);
    console.log("[migrate] Migration complete.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
