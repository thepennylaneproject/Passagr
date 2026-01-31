import { supabase } from './supabase';

const TIMEOUT_MS = 10000;

const withTimeout = (promise) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Request timed out after 10 seconds'));
        }, TIMEOUT_MS);

        promise
            .then((res) => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
};

/**
 * Fetch all published countries.
 * Replaces: GET /public/countries
 */
export const fetchCountries = async () => {
    const { data, error } = await withTimeout(
        supabase
            .from('countries')
            .select(`
            id, 
            name, 
            iso2, 
            regions, 
            last_verified_at, 
            lgbtq_rights_index, 
            abortion_access_status
        `)
            .eq('status', 'published')
    );

    if (error) {
        console.error('Error fetching countries:', error);
        throw error;
    }
    return data;
};

/**
 * Fetch a single country by ID.
 * Replaces: GET /public/countries/:id
 */
export const fetchCountryById = async (id) => {
    const { data, error } = await withTimeout(
        supabase
            .from('countries')
            .select('*')
            .eq('id', id)
            .eq('status', 'published')
            .single()
    );

    if (error) {
        console.error(`Error fetching country ${id}:`, error);
        throw error;
    }
    return data;
};

/**
 * Fetch visa paths for a country.
 * Replaces: GET /public/visa-paths?country_id=...
 */
export const fetchVisaPaths = async (countryId) => {
    if (!countryId) throw new Error('country_id is required');

    const { data, error } = await withTimeout(
        supabase
            .from('visa_paths')
            .select(`
            id, 
            name, 
            type, 
            description, 
            last_verified_at
        `)
            .eq('country_id', countryId)
            .eq('status', 'published')
    );

    if (error) {
        console.error('Error fetching visa paths:', error);
        throw error;
    }
    return data;
};

/**
 * Fetch details of a specific visa path, including requirements and steps.
 * Replaces: GET /public/visa-paths/:id
 * Note: uses parallel queries instead of multiple joins for simplicity and speed.
 */
export const fetchVisaPathDetail = async (id) => {
    if (!id) throw new Error('Visa path id is required');

    // Parallelize the queries
    const [pathRes, reqRes, stepsRes] = await withTimeout(Promise.all([
        supabase.from('visa_paths').select('*').eq('id', id).eq('status', 'published').single(),
        supabase.from('requirements').select('*').eq('visapath_id', id),
        supabase.from('steps').select('*').eq('visapath_id', id).order('order_int')
    ]));

    if (pathRes.error) throw pathRes.error;
    if (reqRes.error) throw reqRes.error;
    if (stepsRes.error) throw stepsRes.error;

    return {
        ...pathRes.data,
        requirements: reqRes.data,
        steps: stepsRes.data
    };
};
