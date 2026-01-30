// workers/validator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validatorOutputSchema = {
    type: "object",
    properties: {
        valid: { type: "boolean" },
        errors: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
        impact: { type: "string", enum: ["low", "medium", "high"] }
    },
    required: ["valid", "errors", "warnings", "impact"]
};

const countrySchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 1 },
        iso2: { type: "string", minLength: 2, maxLength: 2 },
        regions: { type: "array", items: { type: "string" } },
        languages: { type: "array", items: { type: "string" } },
        currency: { type: "string", minLength: 3, maxLength: 3 },
        timezones: { type: "array", items: { type: "string" } },
        climate_tags: { type: "array", items: { type: "string" } },
        healthcare_overview: { type: ["string", "null"] },
        rights_snapshot: { type: ["string", "null"] },
        tax_snapshot: { type: ["string", "null"] },
        // CRITICAL SAFETY FIELDS
        lgbtq_rights_index: { type: "integer", minimum: 0, maximum: 5 },
        abortion_access_status: { type: "string", minLength: 1 },
        hate_crime_law_snapshot: { type: ["string", "null"] },
        last_verified_at: { type: "string", format: "date-time" }
    },
    required: ["name", "iso2", "lgbtq_rights_index", "abortion_access_status", "last_verified_at"],
    additionalProperties: true
};

const visaPathSchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 1 },
        country_id: { type: "string" },
        type: { type: "string", enum: ["work", "study", "family", "retirement", "entrepreneur", "investor", "digital_nomad", "special"] },
        fees: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    label: { type: "string" },
                    amount: { type: ["number", "null"] },
                    currency: { type: "string", minLength: 3, maxLength: 3 }
                },
                required: ["label", "amount", "currency"]
            }
        },
        processing_time_range: {
            type: "object",
            properties: {
                min_days: { type: ["number", "null"] },
                max_days: { type: ["number", "null"] }
            }
        },
        last_verified_at: { type: "string", format: "date-time" }
    },
    required: ["name", "country_id", "type", "last_verified_at"],
    additionalProperties: true
};

ajv.addSchema(countrySchema, "country");
ajv.addSchema(visaPathSchema, "visa_path");

export const handler = async (extractedEntity: any) => {
    const { entity_type, entity_id } = extractedEntity;
    const errors: string[] = [];
    const warnings: string[] = [];
    let impact: 'low' | 'medium' | 'high' = 'low';

    // 1. Schema validation
    const validate = ajv.getSchema(entity_type);
    if (validate) {
        const valid = validate(extractedEntity);
        if (!valid && validate.errors) {
            validate.errors.forEach(err => {
                if (err.keyword === 'required') {
                    errors.push(`Missing required field: ${err.instancePath}${err.params.missingProperty}`);
                } else {
                    errors.push(`Validation error: ${err.message} at ${err.instancePath || 'root'}`);
                }
            });
            impact = 'high';
        }
    } else {
        errors.push(`No schema found for entity type: ${entity_type}`);
        impact = 'high';
    }

    // 2. Business logic checks
    if (entity_type === 'visa_path') {
        const { processing_time_range } = extractedEntity;
        if (processing_time_range && processing_time_range.min_days !== null && processing_time_range.max_days !== null) {
            if (processing_time_range.min_days > processing_time_range.max_days) {
                errors.push("`min_days` cannot be greater than `max_days`.");
                impact = 'high';
            }
        }
    }

    // 3. CRITICAL SAFETY CHECKS (Safety Pivot)
    if (entity_type === 'country') {
        // CRITICAL: lgbtq_rights_index must be present
        if (extractedEntity.lgbtq_rights_index === null || extractedEntity.lgbtq_rights_index === undefined) {
            errors.push("CRITICAL: `lgbtq_rights_index` is required for country entities.");
            impact = 'high';
        } else if (typeof extractedEntity.lgbtq_rights_index !== 'number' ||
            extractedEntity.lgbtq_rights_index < 0 ||
            extractedEntity.lgbtq_rights_index > 5) {
            errors.push("CRITICAL: `lgbtq_rights_index` must be an integer between 0 and 5.");
            impact = 'high';
        }

        // CRITICAL: abortion_access_status must be present
        if (!extractedEntity.abortion_access_status || extractedEntity.abortion_access_status.trim() === '') {
            errors.push("CRITICAL: `abortion_access_status` is required for country entities.");
            impact = 'high';
        }

        // WARNING: hate_crime_law_snapshot recommended but not critical
        if (!extractedEntity.hate_crime_law_snapshot) {
            warnings.push("WARNING: `hate_crime_law_snapshot` is missing. This field provides important safety context.");
            if (impact === 'low') impact = 'medium';
        }
    }

    // 4. Check for null values as warnings
    const checkNullFields = (obj: any, path = '') => {
        for (const key in obj) {
            if (obj[key] === null || obj[key].length === 0) {
                warnings.push(`Field '${path}${key}' is null or empty.`);
            } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                checkNullFields(obj[key], `${path}${key}.`);
            }
        }
    };
    checkNullFields(extractedEntity);


    // 5. Determine impact based on findings
    if (errors.length > 0) {
        impact = 'high';
    } else if (warnings.length > 0) {
        impact = 'medium';
    }

    const validationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        impact
    };

    console.log("Validation complete. Enqueuing for Differ.");
    // `await differAgent.enqueue({ proposedEntity: extractedEntity, validationResult });`
    return validationResult;
};