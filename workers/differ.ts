// workers/differ.ts
import { Pool } from 'pg';
import deepdiff from 'deep-diff';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

interface DifferTask {
    proposedEntity: any;
    validationResult: any;
}

// Helper to map entity types to table names
function getTableName(entityType: string): string {
    const tableMap: { [key: string]: string } = {
        'country': 'countries',
        'visa_path': 'visa_paths',
        'requirement': 'requirements',
        'step': 'steps',
        'cost_item': 'cost_items',
        'source': 'sources',
        'city': 'cities'
    };
    return tableMap[entityType] || entityType + 's';
}

export const handler = async (task: DifferTask) => {
    const { proposedEntity, validationResult } = task;
    const { entity_id, entity_type } = proposedEntity;

    let currentEntity = null;
    if (entity_id) {
        try {
            const tableName = getTableName(entity_type);
            const result = await pool.query(
                `SELECT * FROM ${tableName} WHERE id = $1`,
                [entity_id]
            );

            if (result.rows.length > 0) {
                currentEntity = result.rows[0];
            }
        } catch (error) {
            console.error(`Failed to fetch current entity ${entity_id}:`, error);
            // Treat as a new addition if we can't find it
        }
    }

    let change_type: 'add' | 'update' | 'remove';
    let diff_fields: any[] = [];
    let diff_summary: string = "";

    if (!currentEntity) {
        change_type = 'add';
        diff_summary = `New ${entity_type} added.`;
    } else {
        change_type = 'update';
        const diffs = deepdiff.diff(currentEntity, proposedEntity);
        if (diffs) {
            diff_fields = diffs.map(d => {
                const field = d.path ? d.path.join('.') : 'unknown';
                let from: any = undefined;
                let to: any = undefined;

                // Handle different diff types
                if (d.kind === 'E') { // Edit
                    from = (d as any).lhs;
                    to = (d as any).rhs;
                } else if (d.kind === 'N') { // New
                    to = (d as any).rhs;
                } else if (d.kind === 'D') { // Deleted
                    from = (d as any).lhs;
                } else if (d.kind === 'A') { // Array
                    from = 'array_change';
                    to = 'array_change';
                }

                return { field, from, to };
            });
            diff_summary = `Changes detected for ${entity_type}: ${diff_fields.length} fields modified.`;
        } else {
            // No changes, no need to proceed
            console.log("No changes detected. Stopping workflow.");
            return null;
        }
    }

    const differOutput = {
        change_type,
        diff_summary,
        diff_fields,
        source_ids: [proposedEntity.source_id]
    };

    console.log("Diff complete. Enqueuing for Editorial Router.");
    return differOutput;
};