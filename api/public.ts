// api/public.ts
import type { Request, Response } from 'express';
import { pgPool as pool } from './db.ts';

export const getCountries = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, iso2, regions, last_verified_at, lgbtq_rights_index, abortion_access_status 
             FROM countries 
             WHERE status = 'published'`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getCountries:', error);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};

export const getCountryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM countries WHERE id = $1 AND status = 'published'`,
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
