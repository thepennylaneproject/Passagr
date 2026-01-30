// workers/freshness_scanner.ts
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

interface StaleEntity {
    entity_type: 'country' | 'visa_path';
    entity_id: string;
    name: string;
    last_verified_at: string;
    ttl_days: number;
    criticality: string;
    days_stale: number;
}

export async function scanForStaleEntities(): Promise<StaleEntity[]> {
    const staleEntities: StaleEntity[] = [];

    try {
        // Get all freshness policies
        const policiesResult = await pool.query('SELECT * FROM freshness_policies');
        const policies = policiesResult.rows;

        console.log(`Found ${policies.length} freshness policies`);

        // Scan countries
        const countriesResult = await pool.query(
            `SELECT id, name, last_verified_at 
       FROM countries 
       WHERE status = 'published'`
        );

        for (const country of countriesResult.rows) {
            if (!country.last_verified_at) continue;

            const lastVerified = new Date(country.last_verified_at);
            const now = new Date();
            const daysOld = Math.floor((now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24));

            // Check against most critical policy
            const criticalPolicy = policies.find(p => p.key === 'abortion_access_status');
            if (criticalPolicy && daysOld > criticalPolicy.ttl_days) {
                staleEntities.push({
                    entity_type: 'country',
                    entity_id: country.id,
                    name: country.name,
                    last_verified_at: country.last_verified_at,
                    ttl_days: criticalPolicy.ttl_days,
                    criticality: criticalPolicy.criticality,
                    days_stale: daysOld - criticalPolicy.ttl_days
                });
            }
        }

        // Scan visa paths
        const visaPathsResult = await pool.query(
            `SELECT id, name, last_verified_at 
       FROM visa_paths 
       WHERE status = 'published'`
        );

        for (const visaPath of visaPathsResult.rows) {
            if (!visaPath.last_verified_at) continue;

            const lastVerified = new Date(visaPath.last_verified_at);
            const now = new Date();
            const daysOld = Math.floor((now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24));

            // Check against fees policy
            const feesPolicy = policies.find(p => p.key === 'fees');
            if (feesPolicy && daysOld > feesPolicy.ttl_days) {
                staleEntities.push({
                    entity_type: 'visa_path',
                    entity_id: visaPath.id,
                    name: visaPath.name,
                    last_verified_at: visaPath.last_verified_at,
                    ttl_days: feesPolicy.ttl_days,
                    criticality: feesPolicy.criticality,
                    days_stale: daysOld - feesPolicy.ttl_days
                });
            }
        }

        // Sort by criticality and days stale
        staleEntities.sort((a, b) => {
            const criticalityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const aCrit = criticalityOrder[a.criticality as keyof typeof criticalityOrder] || 999;
            const bCrit = criticalityOrder[b.criticality as keyof typeof criticalityOrder] || 999;

            if (aCrit !== bCrit) return aCrit - bCrit;
            return b.days_stale - a.days_stale;
        });

        console.log(`Found ${staleEntities.length} stale entities`);
        return staleEntities;

    } catch (error) {
        console.error('Error in freshness scanner:', error);
        return staleEntities;
    }
}

export async function enqueueFetcherTasks(staleEntities: StaleEntity[]): Promise<number> {
    // In a production system, this would enqueue tasks to a job queue
    // For now, we'll just log what would be enqueued
    console.log(`Would enqueue ${staleEntities.length} fetcher tasks:`);
    staleEntities.forEach((entity, index) => {
        console.log(`  ${index + 1}. [${entity.criticality}] ${entity.entity_type}: ${entity.name} (${entity.days_stale} days overdue)`);
    });

    return staleEntities.length;
}
