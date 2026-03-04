import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('id, status')
    .in('status', ['published', 'verified'])
    .limit(5);

  if (countriesError) {
    throw countriesError;
  }

  if (!countries || countries.length === 0) {
    console.warn('No published/verified countries found. Skipping RLS checks.');
    return;
  }

  const countryId = countries[0].id;

  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, country_id')
    .eq('country_id', countryId);

  if (citiesError) {
    throw citiesError;
  }

  cities?.forEach((row) => assert(row.country_id === countryId, 'City RLS returned wrong country_id'));

  const { data: languages, error: languagesError } = await supabase
    .from('country_languages')
    .select('id, country_id')
    .eq('country_id', countryId);

  if (languagesError) {
    throw languagesError;
  }

  languages?.forEach((row) => assert(row.country_id === countryId, 'Language RLS returned wrong country_id'));

  const { data: timezones, error: timezonesError } = await supabase
    .from('country_timezones')
    .select('id, country_id')
    .eq('country_id', countryId);

  if (timezonesError) {
    throw timezonesError;
  }

  timezones?.forEach((row) => assert(row.country_id === countryId, 'Timezone RLS returned wrong country_id'));

  const { data: climateTags, error: climateTagsError } = await supabase
    .from('country_climate_tags')
    .select('id, country_id')
    .eq('country_id', countryId);

  if (climateTagsError) {
    throw climateTagsError;
  }

  climateTags?.forEach((row) => assert(row.country_id === countryId, 'Climate tag RLS returned wrong country_id'));

  const { data: visaPaths, error: visaPathsError } = await supabase
    .from('visa_paths')
    .select('id, status, country_id')
    .eq('country_id', countryId)
    .eq('status', 'published')
    .limit(5);

  if (visaPathsError) {
    throw visaPathsError;
  }

  if (!visaPaths || visaPaths.length === 0) {
    console.warn('No published visa paths found for this country. Skipping visa path child checks.');
    return;
  }

  const visaPathId = visaPaths[0].id;

  const { data: requirements, error: requirementsError } = await supabase
    .from('requirements')
    .select('id, visapath_id')
    .eq('visapath_id', visaPathId);

  if (requirementsError) {
    throw requirementsError;
  }

  requirements?.forEach((row) => assert(row.visapath_id === visaPathId, 'Requirement RLS returned wrong visapath_id'));

  const { data: steps, error: stepsError } = await supabase
    .from('steps')
    .select('id, visapath_id')
    .eq('visapath_id', visaPathId);

  if (stepsError) {
    throw stepsError;
  }

  steps?.forEach((row) => assert(row.visapath_id === visaPathId, 'Step RLS returned wrong visapath_id'));

  console.log('RLS public read checks passed.');
};

run().catch((error) => {
  console.error('RLS public read checks failed:', error);
  process.exit(1);
});
