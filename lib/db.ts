import pg from "pg";

const globalForPg = globalThis as unknown as { snPgPool?: pg.Pool };

export function getPoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const needsSsl =
    process.env.PGSSLMODE === "require" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    /sslmode=require/i.test(connectionString) ||
    /\.railway\.app|\.rlwy\.net/i.test(connectionString);
  return {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}

export function getPool(): pg.Pool {
  if (!globalForPg.snPgPool) {
    globalForPg.snPgPool = new pg.Pool(getPoolConfig());
  }
  return globalForPg.snPgPool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}

export async function isDatabaseReady(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
