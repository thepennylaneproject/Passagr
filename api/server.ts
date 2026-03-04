// api/server.ts - Main Express Server Setup (CORS Implemented)

import express from 'express';
import cors from 'cors';
// NOTE: Must install helmet for HTTP Security Headers (as recommended)
// npm install helmet @types/helmet
import helmet from 'helmet';
import { pgPool } from './db.ts';

import { getCountries, getCountryById, getCountrySources, getVisaPaths, getVisaPathById, getChangelog } from './public.ts';
import {
    verifyAdminAuth,
    getPendingReviews,
    getReviewDetails,
    approveReview,
    rejectReview
} from './admin.ts';
import {
    verifyCronAuth,
    handleFreshnessScan,
    handleLinkCheck,
    handleIndexRefresh
} from './jobs.ts';

// --- CRITICAL ENV CHECK ---
if (!process.env.CORS_ORIGIN) {
    console.error("CRITICAL ERROR: CORS_ORIGIN is not set. API will be unreachable or insecure. Check .env.local or Netlify environment variables.");
    process.exit(1);
}
if (!process.env.ADMIN_API_KEY) {
    console.error("CRITICAL ERROR: ADMIN_API_KEY is not set. Admin endpoints are unsafe without it.");
    process.exit(1);
}
if (!process.env.CRON_SECRET) {
    console.error("CRITICAL ERROR: CRON_SECRET is not set. Job endpoints are unsafe without it.");
    process.exit(1);
}
// --------------------------

const app = express();
const PORT = process.env.PORT || 4311;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

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

// Basic request timeout guard
app.use((req, res, next) => {
    let timedOut = false;
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        timedOut = true;
        if (!res.headersSent) {
            res.status(503).json({ error: 'Request timeout' });
        }
    });
    res.setTimeout(REQUEST_TIMEOUT_MS, () => {
        timedOut = true;
        if (!res.headersSent) {
            res.status(503).json({ error: 'Response timeout' });
        }
    });
    if (!timedOut) next();
});

// Lightweight in-memory rate limit for admin endpoints
const ADMIN_RATE_LIMIT = Number(process.env.ADMIN_RATE_LIMIT || 60);
const ADMIN_RATE_WINDOW_MS = Number(process.env.ADMIN_RATE_WINDOW_MS || 60000);
const adminRateBucket = new Map<string, { count: number; resetAt: number }>();
app.use('/admin', (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    if (adminRateBucket.size > 10000) {
        for (const [ip, bucket] of adminRateBucket.entries()) {
            if (now > bucket.resetAt) adminRateBucket.delete(ip);
        }
    }
    const bucket = adminRateBucket.get(key);
    if (!bucket || now > bucket.resetAt) {
        adminRateBucket.set(key, { count: 1, resetAt: now + ADMIN_RATE_WINDOW_MS });
        return next();
    }
    bucket.count += 1;
    if (bucket.count > ADMIN_RATE_LIMIT) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    return next();
});

// A-5: Lightweight in-memory rate limit for public endpoints
const PUBLIC_RATE_LIMIT = Number(process.env.PUBLIC_RATE_LIMIT || 120);
const PUBLIC_RATE_WINDOW_MS = Number(process.env.PUBLIC_RATE_WINDOW_MS || 60000);
const publicRateBucket = new Map<string, { count: number; resetAt: number }>();
app.use('/public', (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    if (publicRateBucket.size > 10000) {
        for (const [ip, bucket] of publicRateBucket.entries()) {
            if (now > bucket.resetAt) publicRateBucket.delete(ip);
        }
    }
    const bucket = publicRateBucket.get(key);
    if (!bucket || now > bucket.resetAt) {
        publicRateBucket.set(key, { count: 1, resetAt: now + PUBLIC_RATE_WINDOW_MS });
        return next();
    }
    bucket.count += 1;
    if (bucket.count > PUBLIC_RATE_LIMIT) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    return next();
});

// ----------------------------------------------------
// Public API endpoints used by the frontend
// ----------------------------------------------------
app.get('/public/countries', getCountries);
app.get('/public/countries/:id', getCountryById);
app.get('/public/countries/:id/sources', getCountrySources);
app.get('/public/visa-paths', getVisaPaths);
app.get('/public/visa-paths/:id', getVisaPathById);
app.get('/public/changelog', getChangelog);

// ----------------------------------------------------
// Admin review endpoints
// ----------------------------------------------------
app.get('/admin/reviews/pending', verifyAdminAuth, getPendingReviews);
app.get('/admin/reviews/:id', verifyAdminAuth, getReviewDetails);
app.post('/admin/reviews/:id/approve', verifyAdminAuth, approveReview);
app.post('/admin/reviews/:id/reject', verifyAdminAuth, rejectReview);

// ----------------------------------------------------
// Cron job endpoints
// ----------------------------------------------------
app.post('/jobs/freshness-scan', verifyCronAuth, handleFreshnessScan);
app.post('/jobs/link-check', verifyCronAuth, handleLinkCheck);
app.post('/jobs/index-refresh', verifyCronAuth, handleIndexRefresh);

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
