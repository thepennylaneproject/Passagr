// workers/alert_writer.ts
interface AlertTask {
    entity: any;
    differOutput: any;
    impact: string;
}

export const handler = async (task: AlertTask) => {
    const { entity, differOutput, impact } = task;

    if (impact !== 'high' && impact !== 'medium') {
        console.log("No high or medium impact changes to alert on.");
        return;
    }

    const { diff_fields, diff_summary } = differOutput;
    const entityType = entity.entity_type;
    const entityName = entity.name || entity.iso2;

    const notificationText = `A change has been published for ${entityName} ${entityType}: ${diff_summary}`;
    const emailSummaryText = `A new update for the ${entityName} ${entityType} has been published. The changes affect key fields like ${diff_fields.slice(0, 3).map(d => d.field).join(', ')} and have been automatically approved.`;

    const alertOutput = {
        notification: notificationText.slice(0, 200),
        email_summary: emailSummaryText.slice(0, 200) // Ensure it fits the 1-2 sentence rule
    };

    console.log("Alerts generated:", alertOutput);
    // In a real system, this would trigger email, Slack, or other notification services.
    // e.g., `sendEmail({ to: 'editors@passagr.com', subject: alertOutput.notification, body: alertOutput.email_summary });`
};