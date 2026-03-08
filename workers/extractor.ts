// workers/extractor.ts
import { OpenAI } from 'openai';
import { supabase } from './supabase_client.ts';
import { v4 as uuidv4 } from 'uuid';
import { handler as validatorHandler } from './validator.ts';
import { handler as differHandler } from './differ.ts';
import { handler as editorialRouterHandler } from './editorial_router.ts';
import { withRetry } from './retry.ts';

const openai = new OpenAI();

interface ExtractorTask {
    sourceId: string;
    entityId?: string; // Optional, for updates
    entityType: 'country' | 'visa_path';
}

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
        "lgbtq_rights_index": 0, // 0-5 scale, based on external NGO data
        "abortion_access_status": "",
        "hate_crime_law_snapshot": "",
        "last_verified_at": "ISO8601"
    },
    visa_path: {
        "country_id": "<countries.id>",
        "name": "",
        "type": "work|study|family|retirement|entrepreneur|investor|digital_nomad|special",
        "description": "",
        "eligibility": [],
        "work_rights": "",
        "dependents_rules": "",
        "min_income_amount": null,
        "min_income_currency": "",
        "min_savings_amount": null,
        "min_savings_currency": "",
        "fees": [{ "label": "", "amount": null, "currency": "" }],
        "processing_min_days": null,
        "processing_max_days": null,
        "renewal_rules": "",
        "to_pr_citizenship_timeline": "",
        "in_country_conversion_path": "",
        "last_verified_at": "ISO8601"
    },
};

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

        // P-1.1: Chain to Validator → Differ → Editorial Router
        const validationResult = await withRetry(
            () => validatorHandler(extractedJson),
            { label: `validator:${task.sourceId}` }
        );

        const differOutput = await withRetry(
            () => differHandler({ proposedEntity: extractedJson, validationResult }),
            { label: `differ:${task.sourceId}` }
        );

        if (differOutput) {
            await withRetry(
                () => editorialRouterHandler({
                    proposedEntity: extractedJson,
                    differOutput,
                    validationResult
                }),
                { label: `editorial_router:${task.sourceId}` }
            );
        }

    } catch (e) {
        console.error("Extraction failed:", e);
    }
};
