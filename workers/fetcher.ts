// workers/fetcher.ts
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FetcherTask {
    url: string;
    entityId: string;
    entityType: string;
}

export const handler = async (task: FetcherTask) => {
    console.log(`Starting fetch for URL: ${task.url}`);
    let response;
    try {
        response = await fetch(task.url);
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            // In a real system, we'd handle this more gracefully, perhaps with retries.
            return;
        }

        const contentType = response.headers.get('content-type');
        let content;
        let title = null;
        let publisher = null;
        let excerpt = null;

        if (contentType && contentType.includes('text/html')) {
            const html = await response.text();
            const dom = new JSDOM(html, { url: task.url });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();
            
            if (article) {
                title = article.title;
                excerpt = article.excerpt;
            }
            content = html;
        } else if (contentType && contentType.includes('application/pdf')) {
            // Placeholder for PDF processing.
            // Requires a tool like `pdf-parse` or similar, which would be a separate microservice.
            console.log("PDF detected. Placeholder for PDF processing.");
            content = await response.blob();
            title = 'PDF Document';
            excerpt = 'This is a PDF document. Content extraction requires a specialized tool.';
        } else {
            console.warn(`Unsupported content type: ${contentType}`);
            return;
        }

        // Save raw content to object store (e.g., S3 or Supabase Storage)
        const objectPath = `sources/${uuidv4()}.${contentType.split('/')[1]}`;
        const { error: storageError } = await supabase.storage.from('source-snapshots').upload(objectPath, content);
        if (storageError) {
            console.error('Storage upload failed:', storageError);
            return;
        }

        // Upsert sources table
        const { data, error } = await supabase
            .from('sources')
            .upsert({
                url: task.url,
                title,
                publisher: new URL(task.url).hostname,
                content_type: contentType,
                excerpt,
                fetched_at: new Date().toISOString(),
                last_checked_at: new Date().toISOString(),
            }, { onConflict: 'url', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error('Database upsert failed:', error);
            return;
        }

        console.log(`Successfully fetched and stored source for URL: ${task.url}`);

        // Enqueue task for the Extractor agent
        const newSourceId = data[0].id;
        // This would use a message queue like RabbitMQ or a serverless queue.
        // For this example, we'll just log the next step.
        console.log(`Enqueuing Extractor task with source ID: ${newSourceId}`);
        // `await extractAgent.enqueue({ sourceId: newSourceId, entityId: task.entityId, entityType: task.entityType });`

    } catch (err) {
        console.error(`Failed to fetch URL ${task.url}:`, err);
    }
};