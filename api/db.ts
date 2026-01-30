import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is missing in .env.local. Cannot connect to database.");
    process.exit(1);
}

export const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
