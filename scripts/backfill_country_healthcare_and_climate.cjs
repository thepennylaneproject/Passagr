// Backfill healthcare metrics and climate tags in Supabase (Postgres)
// Usage: DATABASE_URL=... node scripts/backfill_country_healthcare_and_climate.cjs

const { Pool } = require('pg');

const healthcareData = [
  {
    country: 'Japan',
    gp_visit_cost_usd: '20–40',
    private_insurance_cost_usd_monthly: '120–250',
    cost_of_living_index: 55,
    rent_1br_city_center_usd: '900–1,200',
    monthly_budget_single_usd: '1,600–2,200'
  },
  {
    country: 'Canada',
    gp_visit_cost_usd: '0–110',
    private_insurance_cost_usd_monthly: '150–300',
    cost_of_living_index: 67,
    rent_1br_city_center_usd: '1,200–1,500',
    monthly_budget_single_usd: '2,500–3,000'
  },
  {
    country: 'Australia',
    gp_visit_cost_usd: '30–50',
    private_insurance_cost_usd_monthly: '180–350',
    cost_of_living_index: 68,
    rent_1br_city_center_usd: '1,400–1,700',
    monthly_budget_single_usd: '2,500–3,200'
  },
  {
    country: 'United Kingdom',
    gp_visit_cost_usd: '0–300',
    private_insurance_cost_usd_monthly: '200–400',
    cost_of_living_index: 67,
    rent_1br_city_center_usd: '1,300–1,700',
    monthly_budget_single_usd: '2,200–2,800'
  },
  {
    country: 'Mexico',
    gp_visit_cost_usd: '30–60',
    private_insurance_cost_usd_monthly: '80–200',
    cost_of_living_index: 42,
    rent_1br_city_center_usd: '650–900',
    monthly_budget_single_usd: '700–1,200'
  },
  {
    country: 'Germany',
    gp_visit_cost_usd: '0–50',
    private_insurance_cost_usd_monthly: '200–400',
    cost_of_living_index: 63,
    rent_1br_city_center_usd: '900–1,300',
    monthly_budget_single_usd: '1,800–2,400'
  },
  {
    country: 'Argentina',
    gp_visit_cost_usd: '20–50',
    private_insurance_cost_usd_monthly: '70–150',
    cost_of_living_index: 38,
    rent_1br_city_center_usd: '400–700',
    monthly_budget_single_usd: '1,000–1,500'
  },
  {
    country: 'Thailand',
    gp_visit_cost_usd: '20–60',
    private_insurance_cost_usd_monthly: '80–180',
    cost_of_living_index: 35,
    rent_1br_city_center_usd: '450–800',
    monthly_budget_single_usd: '900–1,400'
  },
  {
    country: 'Portugal',
    gp_visit_cost_usd: '6–25',
    private_insurance_cost_usd_monthly: '40–140',
    cost_of_living_index: 50,
    rent_1br_city_center_usd: '900–1,400',
    monthly_budget_single_usd: '1,400–2,000'
  },
  {
    country: 'Spain',
    gp_visit_cost_usd: '0–100',
    private_insurance_cost_usd_monthly: '60–200',
    cost_of_living_index: 54,
    rent_1br_city_center_usd: '900–1,300',
    monthly_budget_single_usd: '1,500–2,100'
  },
  {
    country: 'Ireland',
    gp_visit_cost_usd: '0–70',
    private_insurance_cost_usd_monthly: '160–350',
    cost_of_living_index: 72,
    rent_1br_city_center_usd: '1,400–2,000',
    monthly_budget_single_usd: '2,400–3,200'
  },
  {
    country: 'France',
    gp_visit_cost_usd: '30–80',
    private_insurance_cost_usd_monthly: '40–120',
    cost_of_living_index: 65,
    rent_1br_city_center_usd: '850–1,200',
    monthly_budget_single_usd: '1,800–2,400'
  },
  {
    country: 'Netherlands',
    gp_visit_cost_usd: '0–100',
    private_insurance_cost_usd_monthly: '120–220',
    cost_of_living_index: 70,
    rent_1br_city_center_usd: '1,500–1,900',
    monthly_budget_single_usd: '2,300–3,000'
  },
  {
    country: 'New Zealand',
    gp_visit_cost_usd: '20–60',
    private_insurance_cost_usd_monthly: '120–250',
    cost_of_living_index: 65,
    rent_1br_city_center_usd: '1,200–1,600',
    monthly_budget_single_usd: '2,200–2,800'
  },
  {
    country: 'Uruguay',
    gp_visit_cost_usd: '40–80',
    private_insurance_cost_usd_monthly: '90–180',
    cost_of_living_index: 55,
    rent_1br_city_center_usd: '700–1,000',
    monthly_budget_single_usd: '1,400–2,000'
  }
];

const climateTagsByCountry = {
  Netherlands: ['oceanic', 'temperate_maritime'],
  Spain: ['mediterranean', 'continental_interior', 'semi_arid_southeast'],
  Argentina: ['temperate', 'subtropical_north', 'cool_patagonian_south'],
  Mexico: ['varied', 'subtropical', 'tropical_coastal', 'cool_highland'],
  Italy: ['mediterranean', 'continental_north', 'alpine'],
  Portugal: ['mediterranean', 'atlantic_moderated'],
  Canada: ['continental_cold_winters', 'oceanic_west_coast', 'subarctic_north'],
  Japan: ['temperate_four_seasons', 'subtropical_south', 'heavy_rainy_season'],
  'New Zealand': ['temperate_maritime', 'alpine_south_island'],
  France: ['temperate', 'mediterranean_south', 'continental_northeast', 'alpine']
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const missingCountries = new Set();

  try {
    await pool.query('BEGIN');

    for (const item of healthcareData) {
      const countryRes = await pool.query('SELECT id FROM countries WHERE name = $1', [item.country]);
      if (countryRes.rows.length === 0) {
        missingCountries.add(item.country);
        continue;
      }
      const countryId = countryRes.rows[0].id;

      await pool.query(
        `INSERT INTO country_healthcare_metrics (
          country_id, gp_visit_cost, private_insurance_cost, cost_of_living_index,
          rent_1br_city_center, monthly_budget_single
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (country_id) DO UPDATE SET
          gp_visit_cost = CASE
            WHEN country_healthcare_metrics.gp_visit_cost IS NULL OR country_healthcare_metrics.gp_visit_cost = ''
            THEN EXCLUDED.gp_visit_cost
            ELSE country_healthcare_metrics.gp_visit_cost
          END,
          private_insurance_cost = CASE
            WHEN country_healthcare_metrics.private_insurance_cost IS NULL OR country_healthcare_metrics.private_insurance_cost = ''
            THEN EXCLUDED.private_insurance_cost
            ELSE country_healthcare_metrics.private_insurance_cost
          END,
          cost_of_living_index = CASE
            WHEN country_healthcare_metrics.cost_of_living_index IS NULL OR country_healthcare_metrics.cost_of_living_index = ''
            THEN EXCLUDED.cost_of_living_index
            ELSE country_healthcare_metrics.cost_of_living_index
          END,
          rent_1br_city_center = CASE
            WHEN country_healthcare_metrics.rent_1br_city_center IS NULL OR country_healthcare_metrics.rent_1br_city_center = ''
            THEN EXCLUDED.rent_1br_city_center
            ELSE country_healthcare_metrics.rent_1br_city_center
          END,
          monthly_budget_single = CASE
            WHEN country_healthcare_metrics.monthly_budget_single IS NULL OR country_healthcare_metrics.monthly_budget_single = ''
            THEN EXCLUDED.monthly_budget_single
            ELSE country_healthcare_metrics.monthly_budget_single
          END`,
        [
          countryId,
          item.gp_visit_cost_usd,
          item.private_insurance_cost_usd_monthly,
          String(item.cost_of_living_index),
          item.rent_1br_city_center_usd,
          item.monthly_budget_single_usd
        ]
      );
    }

    for (const [countryName, tags] of Object.entries(climateTagsByCountry)) {
      const countryRes = await pool.query(
        'SELECT id, climate_tags FROM countries WHERE name = $1',
        [countryName]
      );
      if (countryRes.rows.length === 0) {
        missingCountries.add(countryName);
        continue;
      }

      const { id: countryId, climate_tags: existingTags } = countryRes.rows[0];
      const shouldReplace = countryName === 'Portugal';
      const isEmpty = !existingTags || existingTags.length === 0;

      if (shouldReplace || isEmpty) {
        await pool.query(
          'UPDATE countries SET climate_tags = $2 WHERE id = $1',
          [countryId, tags]
        );
      } else {
        const merged = Array.from(new Set([...(existingTags || []), ...tags]));
        await pool.query(
          'UPDATE countries SET climate_tags = $2 WHERE id = $1',
          [countryId, merged]
        );
      }

      if (shouldReplace) {
        await pool.query('DELETE FROM country_climate_tags WHERE country_id = $1', [countryId]);
      }

      for (const tag of tags) {
        await pool.query(
          `INSERT INTO country_climate_tags (country_id, tag)
           VALUES ($1, $2)
           ON CONFLICT (country_id, tag) DO NOTHING`,
          [countryId, tag]
        );
      }
    }

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }

  if (missingCountries.size > 0) {
    console.log('Missing countries in DB (no updates applied for these):');
    for (const name of missingCountries) console.log(`- ${name}`);
  }

  console.log('Backfill complete.');
}

main().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
