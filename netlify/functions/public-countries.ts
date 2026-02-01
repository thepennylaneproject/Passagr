import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Netlify functions.');
}

const supabase = supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export const handler: Handler = async () => {
    if (!supabase) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Supabase configuration missing' })
        };
    }

    const { data, error } = await supabase
        .from('countries')
        .select(
            'id, name, iso2, regions, last_verified_at, lgbtq_rights_index, abortion_access_status'
        )
        .eq('status', 'published');

    if (error) {
        console.error('Netlify function public-countries error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch countries' })
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
};
