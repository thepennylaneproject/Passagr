// workers/publisher.ts
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PublisherTask {
    entity: any;
    differOutput: any;
}

export const handler = async (task: PublisherTask) => {
    const { entity, differOutput } = task;
    const { entity_type, entity_id } = entity;
    const { change_type, diff_summary, diff_fields, source_ids } = differOutput;

    const dbClient = supabase.from(entity_type + 's');
    
    // 1. Write final row
    const upsertPayload = { ...entity, last_verified_at: new Date().toISOString(), status: 'published' };
    delete upsertPayload.entity_type;
    delete upsertPayload.source_id;

    const { data: updatedEntity, error: upsertError } = await dbClient
        .upsert(upsertPayload, { onConflict: 'id' })
        .select()
        .single();

    if (upsertError) {
        console.error("Failed to publish entity:", upsertError);
        return;
    }

    // 2. Append changelog
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
        console.error("Failed to write changelog:", changelogError);
    }

    // 3. Update search index (simulated)
    console.log(`Triggering search index update for ${entity_type}:${updatedEntity.id}`);
    // `await searchSyncWorker.enqueue({ entityType: entity_type, entityId: updatedEntity.id });`

    // 4. Signal frontend cache revalidation (simulated)
    console.log(`Signaling CDN cache purge for ${entity_type}:${updatedEntity.id}`);
    // `await cdnPurgeService.purgePath(`/public/${entity_type}s/${updatedEntity.id}`);`

    console.log(`Successfully published and updated entity ${updatedEntity.id}`);
};