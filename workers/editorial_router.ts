// workers/editorial_router.ts
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

interface EditorialRouterTask {
    proposedEntity: any;
    differOutput: any;
    validationResult: any;
}

// CRITICAL SAFETY FIELDS - Changes to these fields ALWAYS require human review
const CRITICAL_SAFETY_FIELDS = [
    // Country critical fields
    'lgbtq_rights_index',
    'abortion_access_status',
    'hate_crime_law_snapshot',

    // Visa path critical fields
    'fees',
    'processing_time_range',
    'eligibility',
    'in_country_conversion_path',

    // Requirement critical fields
    'prep_mode'
];

// Helper to check if the diff involves a Critical Field
const isCriticalFieldChange = (diffFields: any[]): boolean => {
    return diffFields.some(diff => {
        // Check if the field path contains any of the critical fields
        return CRITICAL_SAFETY_FIELDS.some(criticalField =>
            diff.field.includes(criticalField)
        );
    });
};

export const handler = async (task: EditorialRouterTask) => {
    const { proposedEntity, differOutput, validationResult } = task;
    const { change_type, diff_fields } = differOutput;
    const { impact } = validationResult;
    const entity_id = proposedEntity.entity_id || null;
    const entity_type = proposedEntity.entity_type;

    const requiresHumanReview = (
        change_type === 'add' || // First publication requires review
        impact === 'high' ||     // Validation errors (missing critical data, invalid format)
        isCriticalFieldChange(diff_fields) // Specific critical data points changed
    );

    if (requiresHumanReview) {
        // First publication, high impact error, or change to a CRITICAL FIELD requires human approval
        const reason = change_type === 'add'
            ? 'New entity'
            : impact === 'high'
                ? 'High impact validation error'
                : 'Critical safety field change';

        console.log(`Requires review. Reason: ${reason}.`);

        try {
            await pool.query(
                `INSERT INTO editorial_reviews
                 (entity_type, entity_id, status, notes, proposed_data, diff_summary, diff_fields)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    entity_type,
                    entity_id,
                    'pending',
                    `Requires review. Reason: ${reason}.`,
                    JSON.stringify(proposedEntity),
                    differOutput.diff_summary,
                    JSON.stringify(differOutput.diff_fields)
                ]
            );
            console.log(`Editorial review created for ${entity_type} ${entity_id}`);
        } catch (error) {
            console.error("Failed to create editorial review:", error);
        }
    } else if (impact === 'medium') {
        // Medium impact for a previously approved entity, auto-publish with notice
        console.log(`Medium impact. Auto-publishing entity ${entity_type}: ${entity_id} and creating an alert.`);
        // TODO: Enqueue Publisher and Alert Writer
    } else { // impact === 'low'
        // Low impact changes, auto-publish
        console.log(`Low impact. Auto-publishing entity ${entity_type}: ${entity_id}.`);
        // TODO: Enqueue Publisher
    }

    return {
        requires_review: requiresHumanReview,
        action: requiresHumanReview ? 'pending_review' : 'auto_publish',
        impact
    };
};