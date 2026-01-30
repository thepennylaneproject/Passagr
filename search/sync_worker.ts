// search/sync_worker.ts
import { SupabaseClient, createClient } from '@supabase/supabase-js';
// Using Typesense client as a concrete example
import { Client as TypesenseClient } from 'typesense'; 
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ⚠️ IMPORTANT: Configure your Typesense/Algolia connection details
const typesenseClient = new TypesenseClient({
    nodes: [{ 
        host: process.env.TYPESENSE_HOST || 'localhost', 
        port: parseInt(process.env.TYPESENSE_PORT || '8108'), 
        protocol: process.env.TYPESENSE_PROTOCOL || 'http' 
    }],
    apiKey: process.env.TYPESENSE_API_KEY || 'xyz'
});

interface SyncTask {
    entityType: 'countries' | 'visa_paths';
    entityId: string;
}

/**
 * Transforms the database row into a flat, indexable document for the search engine.
 */
const transformDocument = async (data: any, entityType: 'countries' | 'visa_paths'): Promise<any> => {
    const document = {
        // Required for search index primary key
        id: data.id, 
        // Convert ISO date string to a numeric timestamp for proper sorting
        last_verified_at: new Date(data.last_verified_at).getTime(), 
        // Index all general string/text fields
        name: data.name,
        // Add dynamic tags for faceting
        tags: [],
    };

    if (entityType === 'countries') {
        return {
            ...document,
            iso2: data.iso2,
            regions: data.regions,
            languages: data.languages,
            currency: data.currency,
            climate_tags: data.climate_tags,
            // Concatenate large text fields for searchable content
            content: `${data.healthcare_overview || ''} ${data.rights_snapshot || ''} ${data.tax_snapshot || ''}`
        };
    }

    if (entityType === 'visa_paths') {
        // Fetch and embed Country Name for better search results and faceting
        const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('name')
            .eq('id', data.country_id)
            .single();

        const countryName = countryData?.name || 'Unknown';
        
        // Flatten nested JSONB arrays for indexing (e.g., eligibility list)
        const eligibilityText = Array.isArray(data.eligibility) ? data.eligibility.join('; ') : '';
        const feesSummary = Array.isArray(data.fees) ? data.fees.map((f: any) => `${f.amount} ${f.currency}`).join(', ') : '';

        return {
            ...document,
            country_id: data.country_id,
            country_name: countryName,
            type: data.type,
            description: data.description,
            work_rights: data.work_rights,
            dependents_rules: data.dependents_rules,
            renewal_rules: data.renewal_rules,
            to_pr_citizenship_timeline: data.to_pr_citizenship_timeline,
            // Financials for numeric filtering
            min_income_amount: data.min_income_amount,
            min_income_currency: data.min_income_currency,
            
            // Searchable text content
            content: `${data.description} ${eligibilityText} ${data.work_rights} ${data.dependents_rules} ${feesSummary}`,
            
            // Faceting fields
            eligibility_terms: data.eligibility,
            tags: [data.type, countryName].filter(Boolean),
        };
    }
    return null;
};


export const handler = async (task: SyncTask) => {
    const { entityType, entityId } = task;
    const collectionName = entityType; // e.g., 'countries' or 'visa_paths'

    console.log(`Starting search index sync for ${entityType} entity ${entityId}`);

    // 1. Fetch the published entity data
    const { data: entityData, error } = await supabase
        .from(entityType)
        .select('*')
        .eq('id', entityId)
        .eq('status', 'published') // Only index published data
        .single();

    if (error || !entityData) {
        console.warn(`Entity ${entityId} not found or not published. Attempting deletion from index.`);
        // If data is missing or not published, ensure it's removed from the index.
        try {
            await typesenseClient.collections(collectionName).documents(entityId).delete();
            console.log(`Successfully deleted entity ${entityId} from ${collectionName} index.`);
        } catch (e) {
            // Ignore if the document was already missing
            // console.error(`Failed to delete entity ${entityId}:`, e);
        }
        return;
    }

    // 2. Transform the data into the search document format
    const document = await transformDocument(entityData, entityType);
    
    if (!document) {
        console.error(`Transformation failed for entity ${entityId}. Skipping index update.`);
        return;
    }

    // 3. Upsert the document into the search index
    try {
        // Typesense documents().upsert() method is idempotent
        await typesenseClient.collections(collectionName).documents().upsert(document);
        console.log(`✅ Successfully indexed entity ${entityId} in ${collectionName} collection.`);
    } catch (e) {
        console.error(`❌ Failed to index entity ${entityId} into Typesense:`, e);
    }
};