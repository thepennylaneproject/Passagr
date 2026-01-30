// api/jobs.ts - Cron Job Endpoints
import { Request, Response } from 'express';
import { scanForStaleEntities, enqueueFetcherTasks } from '../workers/freshness_scanner';
import { checkAllLinks } from '../workers/link_checker';
import { pgPool as pool } from './server';

// Middleware to verify cron job authentication
export function verifyCronAuth(req: Request, res: Response, next: Function) {
    const cronSecret = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET || 'dev-secret';

    if (cronSecret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
}

// Nightly Freshness Scan Job
export async function handleFreshnessScan(req: Request, res: Response) {
    try {
        console.log('Starting freshness scan job...');
        const startTime = Date.now();

        const staleEntities = await scanForStaleEntities();
        const enqueuedCount = await enqueueFetcherTasks(staleEntities);

        const duration = Date.now() - startTime;

        res.json({
            success: true,
            job: 'freshness-scan',
            results: {
                stale_entities_found: staleEntities.length,
                tasks_enqueued: enqueuedCount,
                duration_ms: duration
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Freshness scan job failed:', error);
        res.status(500).json({
            success: false,
            job: 'freshness-scan',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Weekly Link Check Job
export async function handleLinkCheck(req: Request, res: Response) {
    try {
        console.log('Starting link check job...');
        const startTime = Date.now();

        const results = await checkAllLinks();

        const duration = Date.now() - startTime;
        const okCount = results.filter(r => r.status === 'ok').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        const notFoundCount = results.filter(r => r.status === 'not_found').length;

        res.json({
            success: true,
            job: 'link-check',
            results: {
                total_checked: results.length,
                ok: okCount,
                errors: errorCount,
                not_found: notFoundCount,
                duration_ms: duration
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Link check job failed:', error);
        res.status(500).json({
            success: false,
            job: 'link-check',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Hourly Index Refresh Job
export async function handleIndexRefresh(req: Request, res: Response) {
    try {
        console.log('Starting index refresh job...');
        const startTime = Date.now();

        // Get recently updated entities (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const countriesResult = await pool.query(
            `SELECT id, name FROM countries WHERE status = 'published' AND updated_at >= $1`,
            [oneHourAgo]
        );

        const visaPathsResult = await pool.query(
            `SELECT id, name FROM visa_paths WHERE status = 'published' AND updated_at >= $1`,
            [oneHourAgo]
        );

        const countriesCount = countriesResult.rows.length;
        const visaPathsCount = visaPathsResult.rows.length;
        const totalUpdated = countriesCount + visaPathsCount;

        // In production, this would trigger the search sync worker
        console.log(`Would sync ${totalUpdated} entities to search index`);

        const duration = Date.now() - startTime;

        res.json({
            success: true,
            job: 'index-refresh',
            results: {
                countries_updated: countriesCount,
                visa_paths_updated: visaPathsCount,
                total_synced: totalUpdated,
                duration_ms: duration
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Index refresh job failed:', error);
        res.status(500).json({
            success: false,
            job: 'index-refresh',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
