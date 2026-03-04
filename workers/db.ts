import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

const requireTls = () => {
    const mode = (process.env.PG_SSL_MODE || '').toLowerCase();
    if (mode === 'disable') return false;
    if (mode === 'require') return true;
    return process.env.NODE_ENV === 'production';
};

export const createPgPool = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required.');
    }

    const config: PoolConfig = {
        connectionString: process.env.DATABASE_URL,
        statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 10000),
        query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 15000),
        idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
        max: Number(process.env.PG_MAX_CONNECTIONS || 10),
    };

    if (requireTls()) {
        config.ssl = {
            rejectUnauthorized: Boolean(process.env.PG_SSL_CA),
            ca: process.env.PG_SSL_CA || undefined,
        };
    }

    return new Pool(config);
};
