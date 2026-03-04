import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is missing in .env.local. Cannot connect to database.");
    process.exit(1);
}

const requireTls = () => {
    const mode = (process.env.PG_SSL_MODE || '').toLowerCase();
    if (mode === 'disable') return false;
    if (mode === 'require') return true;
    return process.env.NODE_ENV === 'production';
};

const ssl = requireTls()
    ? {
        rejectUnauthorized: Boolean(process.env.PG_SSL_CA),
        ca: process.env.PG_SSL_CA || undefined,
    }
    : undefined;

export const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 10000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 15000),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    max: Number(process.env.PG_MAX_CONNECTIONS || 10),
    ssl,
});
