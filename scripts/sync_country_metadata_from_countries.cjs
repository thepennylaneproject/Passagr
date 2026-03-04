// Sync country languages, timezones, and climate_tags from countries.json into Supabase (Postgres)
// Usage: DATABASE_URL=... node scripts/sync_country_metadata_from_countries.cjs

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const COUNTRY_FILE = path.join(__dirname, '..', 'countries.json');

function loadCountries() {
  const raw = fs.readFileSync(COUNTRY_FILE, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('countries.json must be a JSON array');
  }
  return data;
}

function getName(country) {
  return country?.name || country?.country?.name || null;
}

function asArray(value) {
  if (value == null) return null;
  return [String(value)];
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const countries = loadCountries();
  const climateByName = new Map();
  for (const country of countries) {
    const name = getName(country);
    if (!name) continue;
    const climateTag = country?.quality_of_life?.climate || null;
    if (climateTag) climateByName.set(name, climateTag);
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  const missingCountries = new Set();
  let updated = 0;

  try {
    await pool.query('BEGIN');

    const languageRows = await pool.query(
      `select country_id, array_agg(distinct language order by language) as langs
       from country_languages
       group by country_id`
    );
    const timezoneRows = await pool.query(
      `select country_id, array_agg(distinct timezone order by timezone) as tzs
       from country_timezones
       group by country_id`
    );

    const languagesById = new Map(languageRows.rows.map((r) => [r.country_id, r.langs]));
    const timezonesById = new Map(timezoneRows.rows.map((r) => [r.country_id, r.tzs]));

    const qolRows = await pool.query(
      `select country_id, climate
       from country_quality_of_life`
    );
    const climateById = new Map(
      qolRows.rows
        .filter((r) => r.climate && String(r.climate).trim().length > 0)
        .map((r) => [r.country_id, r.climate])
    );

    const countriesRes = await pool.query(
      'SELECT id, name, languages, timezones, climate_tags FROM countries'
    );

    for (const row of countriesRes.rows) {
      const updates = {};

      const langs = languagesById.get(row.id) || null;
      const tzs = timezonesById.get(row.id) || null;
      const climateTag =
        climateById.get(row.id) ||
        climateByName.get(row.name) ||
        null;

      if ((row.languages == null || row.languages.length === 0) && langs?.length) {
        updates.languages = langs;
      }
      if ((row.timezones == null || row.timezones.length === 0) && tzs?.length) {
        updates.timezones = tzs;
      }
      if ((row.climate_tags == null || row.climate_tags.length === 0) && climateTag) {
        updates.climate_tags = asArray(climateTag);
      }

      const keys = Object.keys(updates);
      if (keys.length === 0) continue;

      const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
      const values = keys.map((key) => updates[key]);

      await pool.query(
        `UPDATE countries SET ${setClauses.join(', ')} WHERE id = $1`,
        [row.id, ...values]
      );

      updated += 1;
    }

    for (const row of countriesRes.rows) {
      const climateTag =
        climateById.get(row.id) ||
        climateByName.get(row.name) ||
        null;
      if (!climateTag) continue;
      await pool.query(
        `INSERT INTO country_climate_tags (country_id, tag)
         VALUES ($1, $2)
         ON CONFLICT (country_id, tag) DO NOTHING`,
        [row.id, climateTag]
      );
    }

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }

  console.log(`Updated ${updated} countries.`);
  if (missingCountries.size > 0) {
    console.log('Missing countries in DB (no metadata updated for these):');
    for (const name of missingCountries) console.log(`- ${name}`);
  }
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
