// api/public.ts
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { pgPool as pool } from './db.ts';

const GEOJSON_PATH = path.resolve(process.cwd(), 'data', 'ne_admin_0_countries.geojson');
let baseGeoJson: any = null;
let countriesCache: { payload: any; expiresAt: number } | null = null;
let sourcesCache: Map<string, { payload: any; expiresAt: number }> = new Map();
const COUNTRIES_CACHE_MS = Number(process.env.COUNTRIES_CACHE_MS || 30000);
const SOURCES_CACHE_MS = Number(process.env.SOURCES_CACHE_MS || 120000);

try {
    const raw = fs.readFileSync(GEOJSON_PATH, 'utf8');
    baseGeoJson = JSON.parse(raw);
} catch (error) {
    console.error('Failed to load GeoJSON base map:', error);
}

export const getCountries = async (req: Request, res: Response) => {
    try {
        if (!baseGeoJson) {
            return res.status(500).json({ error: 'GeoJSON base map unavailable' });
        }

        if (countriesCache && Date.now() < countriesCache.expiresAt) {
            return res.json(countriesCache.payload);
        }

        const countriesResult = await pool.query(
            `SELECT
                c.id,
                c.iso2,
                c.name,
                c.lgbtq_rights_index,
                c.abortion_access_tier,
                c.abortion_access_status,
                c.last_verified_at,
                ps.pathway_types,
                ps.pathways,
                ps.pathway_count,
                hm.system_type as healthcare_system,
                hm.public_access_notes as healthcare_access,
                ql.eiu_liveability as safety_label
             FROM public.country_profile_compact c
             left join public.country_pathway_summary ps on ps.country_id = c.id
             left join public.country_healthcare_metrics hm on hm.country_id = c.id
             left join public.country_quality_of_life ql on ql.country_id = c.id
             WHERE c.status IN ('published', 'verified')`
        );

        const countries = countriesResult.rows || [];

        const pathwayByIso2 = new Map(
            countries
                .filter((row) => row.iso2)
                .map((row) => [
                    row.iso2.toUpperCase(),
                    {
                        pathway_types: row.pathway_types ?? [],
                        pathways: row.pathways ?? [],
                        pathway_count: row.pathway_count ?? 0,
                        lgbtq_rights_index: row.lgbtq_rights_index ?? null,
                        abortion_access_tier: row.abortion_access_tier ?? null,
                        abortion_access_status: row.abortion_access_status ?? null,
                        healthcare_system: row.healthcare_system ?? null,
                        healthcare_access: row.healthcare_access ?? null,
                        safety_label: row.safety_label ?? null,
                        last_verified_at: row.last_verified_at ?? null
                    }
                ])
        );

        const enriched = {
            ...baseGeoJson,
            features: (baseGeoJson.features || []).map((feature: any) => {
                const props = feature.properties || {};
                const iso2 = (props.iso2 || props.ISO_A2 || props.ISO_A2_EH || '').toString().toUpperCase();
                const pathway = pathwayByIso2.get(iso2) || { pathway_types: [], pathways: [], pathway_count: 0 };

                return {
                    ...feature,
                    properties: {
                        ...props,
                        iso2: iso2 || null,
                        pathway_types: pathway.pathway_types,
                        pathways: pathway.pathways,
                        pathway_count: pathway.pathway_count,
                        lgbtq_rights_index: pathway.lgbtq_rights_index,
                        abortion_access_tier: pathway.abortion_access_tier,
                        abortion_access_status: pathway.abortion_access_status,
                        healthcare_system: pathway.healthcare_system,
                        healthcare_access: pathway.healthcare_access,
                        safety_label: pathway.safety_label,
                        last_verified_at: pathway.last_verified_at
                    }
                };
            })
        };

        countriesCache = { payload: enriched, expiresAt: Date.now() + COUNTRIES_CACHE_MS };
        res.json(enriched);
    } catch (error) {
        console.error('Error in getCountries:', error);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};

export const getCountryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM country_profile_compact WHERE id = $1 AND status IN ('published', 'verified')`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch country' });
    }
};

const normalizeSourceTitle = (sourceItem: any) => {
    if (sourceItem?.title && !/^source for\s+/i.test(sourceItem.title)) return sourceItem.title;
    if (sourceItem?.notes) return sourceItem.notes;
    const url = sourceItem?.url;
    if (url) {
        try {
            const parsed = new URL(url);
            return parsed.hostname.replace(/^www\./, '');
        } catch {
            return url;
        }
    }
    if (sourceItem?.source_type) return `${sourceItem.source_type} source`;
    return 'Source';
};

const loadCountrySourcesByIso2 = async (iso2: string) => {
    const stagingResult = await pool.query(
        `select payload
         from public.staging_country_research
         where coalesce(
            nullif(payload->'country'->>'iso2', ''),
            nullif(payload->>'iso2', ''),
            nullif(iso2, '')
         ) = $1
         order by imported_at desc
         limit 1`,
        [iso2]
    );

    const payload = stagingResult.rows?.[0]?.payload;
    const rawSources = payload?.sources;
    if (!Array.isArray(rawSources)) return [];

    return rawSources.map((sourceItem: any) => {
        const notes = sourceItem?.notes || '';
        const fileRefs = [];
        if (typeof notes === 'string') {
            const matches = notes.matchAll(/\[(file|source|doc|web):([^\]]+)\]/gi);
            for (const match of matches) {
                fileRefs.push(`${match[1].toLowerCase()}:${match[2]}`);
            }
        }
        return {
            url: sourceItem?.url || null,
            title: normalizeSourceTitle(sourceItem),
            publisher: sourceItem?.source_type || null,
            retrieved_at: sourceItem?.retrieved_at || null,
            reliability: sourceItem?.reliability || null,
            file_refs: Array.from(new Set(fileRefs))
        };
    });
};

export const getCountrySources = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const countryResult = await pool.query(
            `SELECT iso2 FROM country_profile_compact WHERE id = $1 AND status IN ('published', 'verified')`,
            [id]
        );
        if (countryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }

        const iso2 = countryResult.rows[0]?.iso2;
        if (!iso2) {
            return res.json({ sources: [] });
        }

        const cacheKey = iso2.toUpperCase();
        const cached = sourcesCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return res.json(cached.payload);
        }

        const sources = await loadCountrySourcesByIso2(cacheKey);
        const payload = { sources };
        sourcesCache.set(cacheKey, { payload, expiresAt: Date.now() + SOURCES_CACHE_MS });
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sources' });
    }
};

export const getVisaPaths = async (req: Request, res: Response) => {
    const { country_id } = req.query;
    if (!country_id) {
        return res.status(400).json({ error: 'country_id is required' });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, type, description, last_verified_at 
             FROM visa_paths 
             WHERE country_id = $1 AND status = 'published'`,
            [country_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch visa paths' });
    }
};

export const getVisaPathById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const visaPathResult = await pool.query(
            `SELECT * FROM visa_paths WHERE id = $1 AND status = 'published'`,
            [id]
        );

        if (visaPathResult.rows.length === 0) {
            return res.status(404).json({ error: 'Visa path not found' });
        }

        const requirementsResult = await pool.query(
            `SELECT * FROM requirements WHERE visapath_id = $1`,
            [id]
        );

        const stepsResult = await pool.query(
            `SELECT * FROM steps WHERE visapath_id = $1 ORDER BY order_int`,
            [id]
        );

        const visaPath = visaPathResult.rows[0];
        visaPath.requirements = requirementsResult.rows;
        visaPath.steps = stepsResult.rows;

        res.json(visaPath);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch visa path' });
    }
};

export const getChangelog = async (req: Request, res: Response) => {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) {
        return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    // A-4: Validate entity_type against known enum
    const VALID_ENTITY_TYPES = new Set(['country', 'visa_path', 'requirement', 'step']);
    if (!VALID_ENTITY_TYPES.has(entity_type as string)) {
        return res.status(400).json({ error: 'Invalid entity_type' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM changelogs 
             WHERE entity_type = $1 AND entity_id = $2 
             ORDER BY created_at DESC`,
            [entity_type, entity_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch changelog' });
    }
};
