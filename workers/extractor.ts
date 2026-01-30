// workers/extractor.ts
import { OpenAI } from 'openai';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ExtractorTask {
    sourceId: string;
    entityId?: string; // Optional, for updates
    entityType: 'country' | 'visa_path';
}

// workers/extractor.ts - Updated Extractor, Country JSON Schema

// ... (Rest of the Extractor.ts file remains the same until the schemas block)

const schemas = {
    country: {
        "name": "",
        "iso2": "",
        "regions": [],
        "languages": [],
        "currency": "",
        "timezones": [],
        "climate_tags": [],
        "healthcare_overview": "",
        "rights_snapshot": "",
        "tax_snapshot": "",
        // --- NEW SAFETY FIELDS ---
        "lgbtq_rights_index": 0, // 0-5 scale, based on external NGO data
        "abortion_access_status": "",
        "hate_crime_law_snapshot": "",
        // -------------------------
        "last_verified_at": "ISO8601",
        "notes": [],
        "section_confidence": {
            "healthcare_overview": 0.0,
            "rights_snapshot": 0.0,
            "tax_snapshot": 0.0,
            "lgbtq_rights_index": 0.0, // NEW
            "abortion_access_status": 0.0 // NEW
        },
        "sources": [{ "field": "healthcare_overview", "url": "", "title": "", "publisher": "", "excerpt": "" }]
    },
    visa_path: {
        "country_id": "<countries.id>",
        "name": "",
        "type": "work|study|family|retirement|entrepreneur|investor|digital_nomad|special",
        "description": "",
        "eligibility": [],
        "work_rights": "",
        "dependents_rules": "",
        "min_income": { "amount": null, "currency": "" },
        "min_savings": { "amount": null, "currency": "" },
        "fees": [{ "label": "", "amount": null, "currency": "" }],
        "processing_time_range": { "min_days": null, "max_days": null },
        "renewal_rules": "",
        "to_pr_citizenship_timeline": "",
        // --- NEW SAFETY FIELDS ---
        "in_country_conversion_path": "",
        // -------------------------
        "sources": [{ "url": "", "title": "", "publisher": "", "excerpt": "" }],
        "last_verified_at": "ISO8601",
        "notes": []
    },
    // ... (Add schemas for requirements, steps, etc., including 'prep_mode' for requirements)
};

// ... (Rest of the Extractor.ts file)

export const handler = async (task: ExtractorTask) => {
    const { data: source, error } = await supabase.from('sources').select('url, content_type, excerpt').eq('id', task.sourceId).single();
    if (error || !source) {
        console.error(`Source not found for ID: ${task.sourceId}`, error);
        return;
    }

    // This is a simplified LLM call. The real implementation would be a more complex prompt with function calling.
    const prompt = `
        You are an expert data extraction agent. Your task is to extract information from the provided text and format it into a JSON object.
        Only extract what is explicitly present in the text. Do not hallucinate or invent any facts.
        If a field's value is not found, set it to null or an empty array.
        For each field, include a 'sources' entry that links the extracted data back to the original text.
        Your output must be a single JSON object matching the schema provided.

        Schema for ${task.entityType}: ${JSON.stringify(schemas[task.entityType], null, 2)}
        Text content: ${source.excerpt}
        Source URL: ${source.url}
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that extracts structured data from text. Respond with only JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0, // Keep it deterministic
        });

        const extractedJson = JSON.parse(completion.choices[0].message.content);

        // Add metadata for validation
        extractedJson.last_verified_at = new Date().toISOString();
        extractedJson.source_id = task.sourceId;
        extractedJson.entity_type = task.entityType;
        if (task.entityId) {
            extractedJson.entity_id = task.entityId;
        }

        // Enqueue for Validator
        console.log("Extraction complete. Enqueuing for Validator.");
        // `await validatorAgent.enqueue({ entityJson: extractedJson });`

    } catch (e) {
        console.error("Extraction failed:", e);
    }
};