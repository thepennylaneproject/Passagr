import type { Handler } from '@netlify/functions';
import fs from 'fs';
import path from 'path';

const GEOJSON_PATH = path.resolve('public', 'countries.geojson');

export const handler: Handler = async () => {
    try {
        const geojson = await fs.promises.readFile(GEOJSON_PATH, 'utf-8');
        return {
            statusCode: 200,
            body: geojson,
            headers: {
                'Content-Type': 'application/geo+json; charset=utf-8',
                'Cache-Control': 'public, max-age=300',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'no-referrer',
                'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox"
            }
        };
    } catch (error) {
        console.error('public-countries function failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to load country geojson' })
        };
    }
};
