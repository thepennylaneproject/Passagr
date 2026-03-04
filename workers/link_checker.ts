// workers/link_checker.ts
import axios from 'axios';
import { createPgPool } from './db.ts';

const pool = createPgPool();

interface LinkCheckResult {
    source_id: string;
    url: string;
    status: 'ok' | 'error' | 'not_found';
    http_status?: number;
    error_message?: string;
    old_reliability_score: number;
    new_reliability_score: number;
}

const LINK_CHECK_CONCURRENCY = Number(process.env.LINK_CHECK_CONCURRENCY || 5);

const updateSource = async (sourceId: string, score: number) => {
    await pool.query(
        `UPDATE sources 
         SET reliability_score = $1, last_checked_at = $2 
         WHERE id = $3`,
        [score, new Date().toISOString(), sourceId]
    );
};

const checkOneLink = async (source: any): Promise<LinkCheckResult> => {
    const result: LinkCheckResult = {
        source_id: source.id,
        url: source.url,
        status: 'ok',
        old_reliability_score: source.reliability_score,
        new_reliability_score: source.reliability_score
    };

    try {
        let response = await axios.head(source.url, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        });

        if (response.status >= 400 && response.status !== 404) {
            response = await axios.get(source.url, {
                timeout: 10000,
                maxRedirects: 5,
                headers: { Range: 'bytes=0-0' },
                validateStatus: (status) => status < 500
            });
        }

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
        try {
            const response = await axios.get(source.url, {
                timeout: 10000,
                maxRedirects: 5,
                headers: { Range: 'bytes=0-0' },
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
        } catch (getError: any) {
            result.status = 'error';
            result.error_message = getError?.message || error.message;
            result.new_reliability_score = Math.max(0, source.reliability_score - 1);
        }
    }

    await updateSource(source.id, result.new_reliability_score);
    return result;
};

const runWithConcurrency = async <T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) => {
    const results: R[] = [];
    let index = 0;

    const runners = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
        while (index < items.length) {
            const current = items[index];
            index += 1;
            const result = await worker(current);
            results.push(result);
        }
    });

    await Promise.all(runners);
    return results;
};

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

        const checked = await runWithConcurrency(
            sourcesResult.rows,
            LINK_CHECK_CONCURRENCY,
            checkOneLink
        );
        results.push(...checked);

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
