// workers/link_checker.ts
import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

interface LinkCheckResult {
    source_id: string;
    url: string;
    status: 'ok' | 'error' | 'not_found';
    http_status?: number;
    error_message?: string;
    old_reliability_score: number;
    new_reliability_score: number;
}

export async function checkAllLinks(): Promise<LinkCheckResult[]> {
    const results: LinkCheckResult[] = [];

    try {
        // Get all sources
        const sourcesResult = await pool.query(
            `SELECT id, url, reliability_score, last_checked_at 
       FROM sources 
       ORDER BY last_checked_at ASC NULLS FIRST 
       LIMIT 100`
        );

        console.log(`Checking ${sourcesResult.rows.length} source URLs...`);

        for (const source of sourcesResult.rows) {
            const result: LinkCheckResult = {
                source_id: source.id,
                url: source.url,
                status: 'ok',
                old_reliability_score: source.reliability_score,
                new_reliability_score: source.reliability_score
            };

            try {
                // Check URL with timeout
                const response = await axios.head(source.url, {
                    timeout: 10000,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 500
                });

                result.http_status = response.status;

                if (response.status === 404) {
                    result.status = 'not_found';
                    result.new_reliability_score = Math.max(0, source.reliability_score - 2);
                } else if (response.status >= 400) {
                    result.status = 'error';
                    result.new_reliability_score = Math.max(0, source.reliability_score - 1);
                } else {
                    result.status = 'ok';
                    result.new_reliability_score = Math.min(10, source.reliability_score + 1);
                }

            } catch (error: any) {
                result.status = 'error';
                result.error_message = error.message;
                result.new_reliability_score = Math.max(0, source.reliability_score - 1);
            }

            // Update source in database
            await pool.query(
                `UPDATE sources 
         SET reliability_score = $1, last_checked_at = $2 
         WHERE id = $3`,
                [result.new_reliability_score, new Date().toISOString(), source.id]
            );

            results.push(result);
        }

        // Log summary
        const okCount = results.filter(r => r.status === 'ok').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        const notFoundCount = results.filter(r => r.status === 'not_found').length;

        console.log(`Link check complete: ${okCount} OK, ${errorCount} errors, ${notFoundCount} not found`);

        return results;

    } catch (error) {
        console.error('Error in link checker:', error);
        return results;
    }
}
