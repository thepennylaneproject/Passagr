// workers/editorial_router.ts
import { createPgPool } from './db.ts';
import { handler as publisherHandler } from './publisher.ts';
import { handler as alertHandler } from './alert_writer.ts';
import { withRetry } from './retry.ts';

const pool = createPgPool();

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
    'processing_min_days',
    'processing_max_days',
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

    // P-1.2: Removals always require editorial review
    if (change_type === 'remove') {
        try {
            await pool.query(
                `INSERT INTO editorial_reviews
                 (entity_type, entity_id, status, notes, proposed_data, diff_summary, diff_fields)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    entity_type,
                    entity_id,
                    'pending',
                    'Entity removal requires editorial review.',
                    JSON.stringify(proposedEntity),
                    differOutput.diff_summary,
                    JSON.stringify(differOutput.diff_fields)
                ]
            );
            console.log(`[editorial_router] Removal review created for ${entity_type}:${entity_id}`);
        } catch (error) {
            console.error("[editorial_router] Failed to create removal review:", error);
        }
        return { requires_review: true, action: 'pending_review', impact };
    }

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

        console.log(`[editorial_router] Requires review. Reason: ${reason}.`);

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
            console.log(`[editorial_router] Editorial review created for ${entity_type} ${entity_id}`);
        } catch (error) {
            console.error("[editorial_router] Failed to create editorial review:", error);
        }
    } else if (impact === 'medium') {
        // P-4.1: Medium impact for a previously approved entity — auto-publish with alert
        console.log(`[editorial_router] Medium impact. Auto-publishing ${entity_type}:${entity_id} with alert.`);
        await withRetry(
            () => publisherHandler({ entity: proposedEntity, differOutput }),
            { label: `publisher:${entity_type}:${entity_id}` }
        );
        await alertHandler({ entity: proposedEntity, differOutput, impact });
    } else {
        // P-4.1: Low impact changes — auto-publish silently
        console.log(`[editorial_router] Low impact. Auto-publishing ${entity_type}:${entity_id}.`);
        await withRetry(
            () => publisherHandler({ entity: proposedEntity, differOutput }),
            { label: `publisher:${entity_type}:${entity_id}` }
        );
    }

    return {
        requires_review: requiresHumanReview,
        action: requiresHumanReview ? 'pending_review' : 'auto_publish',
        impact
    };
};

