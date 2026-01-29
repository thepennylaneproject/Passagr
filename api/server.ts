// api/server.ts - Main Express Server Setup (CORS Implemented)

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import cors from 'cors';
// NOTE: Must install helmet for HTTP Security Headers (as recommended)
// npm install helmet @types/helmet
import helmet from 'helmet';

import { getCountries, getCountryById, getVisaPaths, getVisaPathById, getChangelog } from './public';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// --- CRITICAL ENV CHECK ---
if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is missing in .env.local. Cannot connect to database.");
    process.exit(1);
}
if (!process.env.CORS_ORIGIN) {
    console.error("CRITICAL ERROR: CORS_ORIGIN is not set. API will be unreachable or insecure. Check .env.local or Railway variables.");
    process.exit(1);
}
// --------------------------

export const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
const PORT = process.env.PORT || 3000;

// --- 4. HTTP Security Headers (Helmet) ---
app.use(helmet());

// --- 5. CRITICAL CORS IMPLEMENTATION FIX ---
// Enforces the specific domain set in CORS_ORIGIN, removing the insecure '*' default.
const corsOptions: cors.CorsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "HEAD", "POST"], // Only allow methods needed for public and simple requests
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
// ------------------------------------------

// Existing Middleware
app.use(express.json());

// ----------------------------------------------------
// ... (API Endpoint definitions remain the same) ...
// ----------------------------------------------------

// Start the server and test database connection
pgPool.connect()
    .then(client => {
        client.release();
        console.log(`✅ Postgres Connection: OK`);
        console.log(`CORS Policy Enforced for: ${process.env.CORS_ORIGIN}`); // Console confirmation

        app.listen(PORT, () => {
            console.log(`✅ Passagr server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("CRITICAL ERROR: Failed to connect to Postgres Pool.", err.message);
        process.exit(1);
    });