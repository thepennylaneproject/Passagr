// workers/publisher.ts
import { supabase } from './supabase_client.ts';
import { v4 as uuidv4 } from 'uuid';
import { handler as searchSyncHandler } from '../search/sync_worker.ts';

interface PublisherTask {
    entity: any;
    differOutput: any;
}

const pickDefined = (value: Record<string, any>) =>
    Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

const normalizeEntityForPublish = (entity: any, change_type: string) => {
    const now = new Date().toISOString();
    const targetStatus = change_type === 'remove' ? 'archived' : 'published';

    if (entity.entity_type === 'country') {
        return pickDefined({
            id: entity.entity_id || entity.id,
            name: entity.name,
            iso2: entity.iso2,
            regions: entity.regions,
            languages: entity.languages,
            currency: entity.currency,
            timezones: entity.timezones,
            climate_tags: entity.climate_tags,
            healthcare_overview: entity.healthcare_overview,
            rights_snapshot: entity.rights_snapshot,
            tax_snapshot: entity.tax_snapshot,
            lgbtq_rights_index: entity.lgbtq_rights_index,
            abortion_access_status: entity.abortion_access_status,
            hate_crime_law_snapshot: entity.hate_crime_law_snapshot,
            last_verified_at: entity.last_verified_at || now,
            last_published_at: now,
            status: targetStatus
        });
    }

    if (entity.entity_type === 'visa_path') {
        const minIncome = entity.min_income || {};
        const minSavings = entity.min_savings || {};

        return pickDefined({
            id: entity.entity_id || entity.id,
            country_id: entity.country_id,
            name: entity.name,
            type: entity.type,
            description: entity.description,
            eligibility: entity.eligibility,
            work_rights: entity.work_rights,
            dependents_rules: entity.dependents_rules,
            min_income_amount: entity.min_income_amount ?? minIncome.amount,
            min_income_currency: entity.min_income_currency ?? minIncome.currency,
            min_savings_amount: entity.min_savings_amount ?? minSavings.amount,
            min_savings_currency: entity.min_savings_currency ?? minSavings.currency,
            fees: entity.fees,
            processing_min_days: entity.processing_min_days,
            processing_max_days: entity.processing_max_days,
            renewal_rules: entity.renewal_rules,
            to_pr_citizenship_timeline: entity.to_pr_citizenship_timeline,
            in_country_conversion_path: entity.in_country_conversion_path,
            last_verified_at: entity.last_verified_at || now,
            status: targetStatus
        });
    }

    if (entity.entity_type === 'requirement') {
        return pickDefined({
            id: entity.entity_id || entity.id,
            visapath_id: entity.visapath_id,
            label: entity.label,
            details: entity.details,
            doc_list: entity.doc_list,
            notarization_needed: entity.notarization_needed,
            apostille_needed: entity.apostille_needed,
            prep_mode: entity.prep_mode,
            last_verified_at: entity.last_verified_at || now
        });
    }

    if (entity.entity_type === 'step') {
        return pickDefined({
            id: entity.entity_id || entity.id,
            visapath_id: entity.visapath_id,
            order_int: entity.order_int,
            title: entity.title,
            instructions: entity.instructions,
            expected_duration_days: entity.expected_duration_days,
            links: entity.links
        });
    }

    if (entity.entity_type === 'cost_item') {
        return pickDefined({
            id: entity.entity_id || entity.id,
            scope: entity.scope,
            country_id: entity.country_id,
            visapath_id: entity.visapath_id,
            label: entity.label,
            amount: entity.amount,
            currency: entity.currency,
            frequency: entity.frequency,
            source_id: entity.source_id,
            last_verified_at: entity.last_verified_at || now
        });
    }

    if (entity.entity_type === 'source') {
        return pickDefined({
            id: entity.entity_id || entity.id,
            url: entity.url,
            title: entity.title,
            publisher: entity.publisher,
            content_type: entity.content_type,
            excerpt: entity.excerpt,
            fetched_at: entity.fetched_at || now,
            last_checked_at: entity.last_checked_at || now,
            reliability_score: entity.reliability_score
        });
    }

    if (entity.entity_type === 'city') {
        return pickDefined({
            id: entity.entity_id || entity.id,
            country_id: entity.country_id,
            name: entity.name,
            tiers: entity.tiers,
            cost_of_living_index: entity.cost_of_living_index,
            rent_index: entity.rent_index,
            notes: entity.notes
        });
    }

    return null;
};
// P-5.1: Simple hash for advisory lock key
const hashEntityKey = (entityType: string, entityId: string): number => {
    const str = `${entityType}:${entityId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
};

export const handler = async (task: PublisherTask) => {
    const { entity, differOutput } = task;
    const { entity_type, entity_id } = entity;
    const { change_type, diff_summary, diff_fields, source_ids } = differOutput;

    const tableMap: Record<string, string> = {
        country: 'countries',
        visa_path: 'visa_paths',
        requirement: 'requirements',
        step: 'steps',
        cost_item: 'cost_items',
        source: 'sources',
        city: 'cities'
    };

    const tableName = tableMap[entity_type];
    if (!tableName) {
        console.error(`[publisher] Invalid entity_type: ${entity_type}`);
        return;
    }

    const upsertPayload: any = normalizeEntityForPublish(entity, change_type);
    if (!upsertPayload) {
        console.error(`[publisher] No publish mapping for entity_type: ${entity_type}`);
        return;
    }

    // P-5.1: Acquire advisory lock to prevent concurrent publish of same entity
    const lockKey = hashEntityKey(entity_type, entity_id || upsertPayload.id);
    const { data: lockAcquired, error: lockError } = await supabase
        .rpc('pg_try_advisory_lock', { key: lockKey });

    if (lockError || !lockAcquired) {
        console.warn(`[publisher] Skipping concurrent publish for ${entity_type}:${entity_id} (lock not acquired)`);
        return;
    }

    try {
        // P-2.1: Upsert entity
        const dbClient = supabase.from(tableName);
        const { data: updatedEntity, error: upsertError } = await dbClient
            .upsert(upsertPayload, { onConflict: 'id' })
            .select()
            .single();

        if (upsertError) {
            console.error("[publisher] Failed to publish entity:", upsertError);
            return;
        }

        // P-2.1: Append changelog (in same request scope, guarded by advisory lock)
        const { error: changelogError } = await supabase
            .from('changelogs')
            .insert({
                entity_type,
                entity_id: updatedEntity.id,
                change_type,
                diff_summary,
                diff_fields,
                created_by: 'automated-publisher',
                source_ids
            });

        if (changelogError) {
            console.error("[publisher] Failed to write changelog:", changelogError);
            // Entity already written — log but don't block
        }

        // 3. Update search index (R1: wired)
        const searchableTypes = new Set(['country', 'visa_path']);
        if (searchableTypes.has(entity_type)) {
            const collectionName = entity_type === 'country' ? 'countries' : 'visa_paths';
            try {
                await searchSyncHandler({ entityType: collectionName as 'countries' | 'visa_paths', entityId: updatedEntity.id });
            } catch (err) {
                console.error(`[publisher] Search sync failed (non-fatal) for ${entity_type}:${updatedEntity.id}:`, err);
            }
        }

        console.log(`[publisher] Successfully published ${entity_type}:${updatedEntity.id}`);
    } finally {
        // P-5.1: Always release advisory lock
        await supabase.rpc('pg_advisory_unlock', { key: lockKey }).catch((err: any) => {
            console.error(`[publisher] Failed to release advisory lock for ${entity_type}:${entity_id}:`, err);
        });
    }
};

