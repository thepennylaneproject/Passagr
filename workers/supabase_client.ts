import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required for server workers.');
}

if (!serviceRoleKey) {
  const message =
    'SUPABASE_SERVICE_ROLE_KEY is missing. Server workers need the service role key to write with RLS enabled.';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.warn(`${message} Falling back to SUPABASE_ANON_KEY in non-production.`);
}

const supabaseKey = serviceRoleKey || anonKey;
if (!supabaseKey) {
  throw new Error('No Supabase key available for server workers.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
