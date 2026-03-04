// workers/fetcher.ts
import { supabase } from './supabase_client.ts';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { v4 as uuidv4 } from 'uuid';
import { promises as dns } from 'dns';
import net from 'net';
import { handler as extractorHandler } from './extractor.ts';
import { withRetry } from './retry.ts';

interface FetcherTask {
    url: string;
    entityId: string;
    entityType: string;
}

const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 15000);
const MAX_FETCH_BYTES = Number(process.env.MAX_FETCH_BYTES || 10 * 1024 * 1024);
const ALLOW_INSECURE_HTTP = process.env.ALLOW_INSECURE_HTTP === 'true';

const isPrivateIp = (ip: string) => {
    if (net.isIP(ip) === 4) {
        const [a, b] = ip.split('.').map(Number);
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        return false;
    }
    if (net.isIP(ip) === 6) {
        return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80');
    }
    return false;
};

const validateUrlTarget = async (url: URL) => {
    if (!ALLOW_INSECURE_HTTP && url.protocol !== 'https:') {
        throw new Error(`Blocked non-HTTPS URL: ${url.toString()}`);
    }

    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.local')) {
        throw new Error(`Blocked local hostname: ${hostname}`);
    }

    if (net.isIP(hostname)) {
        if (isPrivateIp(hostname)) {
            throw new Error(`Blocked private IP: ${hostname}`);
        }
        return;
    }

    const lookups = await dns.lookup(hostname, { all: true });
    for (const record of lookups) {
        if (isPrivateIp(record.address)) {
            throw new Error(`Blocked private IP for host ${hostname}`);
        }
    }
};

const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

const readWithLimit = async (response: Response, maxBytes: number) => {
    const reader = response.body?.getReader();
    if (!reader) return new Uint8Array();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.length;
        if (total > maxBytes) {
            throw new Error(`Response exceeds max size (${maxBytes} bytes)`);
        }
        chunks.push(value);
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }
    return buffer;
};

export const handler = async (task: FetcherTask) => {
    console.log(`Starting fetch for URL: ${task.url}`);
    let response;
    try {
        const parsedUrl = new URL(task.url);
        await validateUrlTarget(parsedUrl);
        response = await fetchWithTimeout(task.url);
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
            const htmlBytes = await readWithLimit(response, MAX_FETCH_BYTES);
            const html = new TextDecoder('utf-8').decode(htmlBytes);
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
            const pdfBytes = await readWithLimit(response, MAX_FETCH_BYTES);
            content = new Blob([pdfBytes], { type: 'application/pdf' });
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

        // P-1.1: Dispatch to Extractor
        const newSourceId = data[0].id;
        try {
            await withRetry(
                () => extractorHandler({
                    sourceId: newSourceId,
                    entityId: task.entityId,
                    entityType: task.entityType as 'country' | 'visa_path'
                }),
                { label: `extractor:${newSourceId}` }
            );
        } catch (err) {
            console.error(`[fetcher] Extractor dispatch failed for source ${newSourceId}:`, err);
        }

    } catch (err) {
        console.error(`Failed to fetch URL ${task.url}:`, err);
    }
};
