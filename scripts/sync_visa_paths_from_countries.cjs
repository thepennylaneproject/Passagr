// Sync visa_paths from countries.json into Supabase (Postgres)
// Usage: DATABASE_URL=... node scripts/sync_visa_paths_from_countries.cjs

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

function normalizeCountryName(country) {
  return country?.name || country?.country?.name || null;
}

function normalizeLastVerified(country) {
  return country?.country?.last_verified_at || country?.last_verified_at || country?.data_last_updated || null;
}

function mapPathwayToVisaPath(country, pathway) {
  const name = pathway?.name || null;
  const type = pathway?.pathway_type || pathway?.type || null;
  const description = pathway?.notes || pathway?.description || pathway?.requirement || null;

  const eligibility = [];
  if (pathway?.job_offer_required === true) eligibility.push('Job offer required');
  if (pathway?.job_offer_required === false) eligibility.push('No job offer required');
  if (pathway?.income_requirement?.notes) eligibility.push(pathway.income_requirement.notes);
  if (typeof pathway?.min_income_usd === 'number') {
    eligibility.push(`Minimum income: ${pathway.min_income_usd} USD`);
  }

  let minIncomeAmount = null;
  let minIncomeCurrency = null;

  if (typeof pathway?.min_income_usd === 'number') {
    minIncomeAmount = pathway.min_income_usd;
    minIncomeCurrency = 'USD';
  } else if (pathway?.income_requirement && pathway.income_requirement.amount != null) {
    minIncomeAmount = pathway.income_requirement.amount;
    minIncomeCurrency = pathway.income_requirement.currency || null;
  }

  let processingMinDays = pathway?.processing_days_min ?? null;
  let processingMaxDays = pathway?.processing_days_max ?? null;
  if (pathway?.processing_time_months) {
    const minMonths = pathway.processing_time_months.min;
    const maxMonths = pathway.processing_time_months.max;
    if (minMonths != null && processingMinDays == null) processingMinDays = Math.round(minMonths * 30);
    if (maxMonths != null && processingMaxDays == null) processingMaxDays = Math.round(maxMonths * 30);
  }

  let workRights = null;
  if (pathway?.remote_work_allowed === true) workRights = 'Remote work allowed';
  if (pathway?.remote_work_allowed === false) {
    workRights = pathway?.job_offer_required ? 'Employment only' : 'Employment or other';
  }

  let dependentsRules = null;
  const family = country?.language_family_citizenship;
  if (family?.eligible_family_members?.length) {
    dependentsRules = `Eligible family members: ${family.eligible_family_members.join(', ')}`;
    if (family?.family_reunification_wait_months != null) {
      dependentsRules += `; wait time: ${family.family_reunification_wait_months} month(s)`;
    }
  }

  let toPrCitizenship = null;
  const yearsToPr = pathway?.years_to_pr ?? country?.language_family_citizenship?.years_to_pr ?? null;
  const yearsToCit = pathway?.years_to_citizenship ?? country?.language_family_citizenship?.years_to_citizenship ?? null;
  if (yearsToPr != null || yearsToCit != null) {
    const parts = [];
    if (yearsToPr != null) parts.push(`PR after ~${yearsToPr} year(s)`);
    if (yearsToCit != null) {
      if (typeof yearsToCit === 'number') parts.push(`Citizenship after ~${yearsToCit} year(s)`);
      else if (yearsToCit?.min != null && yearsToCit?.max != null) parts.push(`Citizenship after ~${yearsToCit.min}-${yearsToCit.max} year(s)`);
    }
    toPrCitizenship = parts.join('; ');
  }

  return {
    countryName: normalizeCountryName(country),
    name,
    type,
    description,
    eligibility,
    work_rights: workRights,
    dependents_rules: dependentsRules,
    min_income_amount: minIncomeAmount,
    min_income_currency: minIncomeCurrency,
    min_savings_amount: null,
    min_savings_currency: null,
    fees: [],
    processing_min_days: processingMinDays,
    processing_max_days: processingMaxDays,
    renewal_rules: null,
    to_pr_citizenship_timeline: toPrCitizenship,
    in_country_conversion_path: null,
    last_verified_at: normalizeLastVerified(country),
    status: 'published'
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const countries = loadCountries();
  const visaPaths = [];

  for (const country of countries) {
    const pathways = Array.isArray(country?.pathways) ? country.pathways : [];
    for (const pathway of pathways) {
      const mapped = mapPathwayToVisaPath(country, pathway);
      if (!mapped.countryName || !mapped.name || !mapped.type) continue;
      visaPaths.push(mapped);
    }
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  const missingCountries = new Set();
  let upserted = 0;

  try {
    await pool.query('BEGIN');

    for (const vp of visaPaths) {
      const countryRes = await pool.query('SELECT id FROM countries WHERE name = $1', [vp.countryName]);
      if (countryRes.rows.length === 0) {
        missingCountries.add(vp.countryName);
        continue;
      }

      const countryId = countryRes.rows[0].id;

      await pool.query(
        `INSERT INTO visa_paths(
          country_id, name, type, description, eligibility, work_rights,
          dependents_rules, min_income_amount, min_income_currency,
          min_savings_amount, min_savings_currency, fees,
          processing_min_days, processing_max_days, renewal_rules,
          to_pr_citizenship_timeline, in_country_conversion_path,
          last_verified_at, status
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6,
          $7, $8, $9,
          $10, $11, $12::jsonb,
          $13, $14, $15,
          $16, $17,
          $18, $19
        )
        ON CONFLICT (country_id, name) DO UPDATE SET
          type = COALESCE(visa_paths.type, EXCLUDED.type),
          description = COALESCE(visa_paths.description, EXCLUDED.description),
          eligibility = CASE
            WHEN visa_paths.eligibility = '[]'::jsonb AND EXCLUDED.eligibility <> '[]'::jsonb THEN EXCLUDED.eligibility
            ELSE visa_paths.eligibility
          END,
          work_rights = COALESCE(visa_paths.work_rights, EXCLUDED.work_rights),
          dependents_rules = COALESCE(visa_paths.dependents_rules, EXCLUDED.dependents_rules),
          min_income_amount = COALESCE(visa_paths.min_income_amount, EXCLUDED.min_income_amount),
          min_income_currency = COALESCE(visa_paths.min_income_currency, EXCLUDED.min_income_currency),
          min_savings_amount = COALESCE(visa_paths.min_savings_amount, EXCLUDED.min_savings_amount),
          min_savings_currency = COALESCE(visa_paths.min_savings_currency, EXCLUDED.min_savings_currency),
          fees = CASE
            WHEN visa_paths.fees = '[]'::jsonb AND EXCLUDED.fees <> '[]'::jsonb THEN EXCLUDED.fees
            ELSE visa_paths.fees
          END,
          processing_min_days = COALESCE(visa_paths.processing_min_days, EXCLUDED.processing_min_days),
          processing_max_days = COALESCE(visa_paths.processing_max_days, EXCLUDED.processing_max_days),
          renewal_rules = COALESCE(visa_paths.renewal_rules, EXCLUDED.renewal_rules),
          to_pr_citizenship_timeline = COALESCE(visa_paths.to_pr_citizenship_timeline, EXCLUDED.to_pr_citizenship_timeline),
          in_country_conversion_path = COALESCE(visa_paths.in_country_conversion_path, EXCLUDED.in_country_conversion_path),
          last_verified_at = COALESCE(visa_paths.last_verified_at, EXCLUDED.last_verified_at),
          status = 'published'
        `,
        [
          countryId,
          vp.name,
          vp.type,
          vp.description,
          JSON.stringify(vp.eligibility),
          vp.work_rights,
          vp.dependents_rules,
          vp.min_income_amount,
          vp.min_income_currency,
          vp.min_savings_amount,
          vp.min_savings_currency,
          JSON.stringify(vp.fees),
          vp.processing_min_days,
          vp.processing_max_days,
          vp.renewal_rules,
          vp.to_pr_citizenship_timeline,
          vp.in_country_conversion_path,
          vp.last_verified_at,
          vp.status
        ]
      );

      upserted += 1;
    }

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }

  console.log(`Upserted ${upserted} visa paths.`);
  if (missingCountries.size > 0) {
    console.log('Missing countries in DB (no visa paths inserted for these):');
    for (const name of missingCountries) console.log(`- ${name}`);
  }
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
