// workers/alert_writer.ts
import { supabase } from './supabase_client.ts';

interface AlertTask {
    entity: any;
    differOutput: any;
    impact: string;
}

export const handler = async (task: AlertTask) => {
    const { entity, differOutput, impact } = task;

    if (impact !== 'high' && impact !== 'medium') {
        return;
    }

    const { diff_fields, diff_summary } = differOutput;
    const entityType = entity.entity_type;
    const entityName = entity.name || entity.iso2;

    const notificationText = `A change has been published for ${entityName} ${entityType}: ${diff_summary}`;
    const emailSummaryText = `A new update for the ${entityName} ${entityType} has been published. The changes affect key fields like ${diff_fields.slice(0, 3).map((d: any) => d.field).join(', ')} and have been automatically approved.`;

    // P-7.1: Persist alert to DB instead of just logging
    const { error } = await supabase
        .from('pipeline_alerts')
        .insert({
            entity_type: entityType,
            entity_id: entity.entity_id || entity.id || null,
            alert_type: impact,
            notification: truncateWithEllipsis(notificationText, 2000),
            email_summary: truncateWithEllipsis(emailSummaryText, 4000),
        });

    if (error) {
        console.error('[alert_writer] Failed to persist alert:', error);
    } else {
        console.log(`[alert_writer] Alert created for ${entityType}:${entityName}`);
    }
};

function truncateWithEllipsis(value: string, maxChars: number): string {
    if (value.length <= maxChars) {
        return value;
    }
    if (maxChars <= 3) {
        return value.slice(0, maxChars);
    }
    return `${value.slice(0, maxChars - 3)}...`;
}
