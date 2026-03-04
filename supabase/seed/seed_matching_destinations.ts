import { Pool } from "pg";
import crypto from "crypto";

type SeedCountry = {
  name: string;
  iso2: string;
  region: string;
  lgbtq_rights_index: number; // 0-5
  abortion_access: string; // store in staging payload for now
  verified_at: string; // ISO date
};

const SEED: SeedCountry[] = [
  { name: "Argentina", iso2: "AR", region: "americas", lgbtq_rights_index: 5, abortion_access: "legal_protected", verified_at: "2026-01-30" },
  { name: "Thailand", iso2: "TH", region: "asia", lgbtq_rights_index: 4, abortion_access: "legal_with_restrictions", verified_at: "2026-01-30" },
  { name: "Mexico", iso2: "MX", region: "americas", lgbtq_rights_index: 4, abortion_access: "decriminalized_mixed", verified_at: "2026-01-30" },
  { name: "Uruguay", iso2: "UY", region: "americas", lgbtq_rights_index: 5, abortion_access: "legal_on_request", verified_at: "2026-01-30" },
  { name: "Canada", iso2: "CA", region: "americas", lgbtq_rights_index: 5, abortion_access: "legal_on_request", verified_at: "2026-01-30" },
  { name: "Japan", iso2: "JP", region: "asia", lgbtq_rights_index: 3, abortion_access: "legal_with_restrictions", verified_at: "2026-01-30" },
  { name: "Portugal", iso2: "PT", region: "europe", lgbtq_rights_index: 5, abortion_access: "Protected by Law (up to 12 weeks)", verified_at: "2026-01-31" },
  { name: "Germany", iso2: "DE", region: "europe", lgbtq_rights_index: 5, abortion_access: "legal_on_request_with_limits", verified_at: "2026-01-30" },
  { name: "Netherlands", iso2: "NL", region: "europe", lgbtq_rights_index: 5, abortion_access: "legal_protected", verified_at: "2026-01-30" },
  { name: "Spain", iso2: "ES", region: "europe", lgbtq_rights_index: 5, abortion_access: "legal_protected", verified_at: "2026-01-30" },
  { name: "Ireland", iso2: "IE", region: "europe", lgbtq_rights_index: 5, abortion_access: "legal_on_request_with_limits", verified_at: "2026-01-30" },
  { name: "Australia", iso2: "AU", region: "oceania", lgbtq_rights_index: 5, abortion_access: "legal_on_request_with_state_variation", verified_at: "2026-01-30" },
  { name: "New Zealand", iso2: "NZ", region: "oceania", lgbtq_rights_index: 5, abortion_access: "legal_on_request_with_limits", verified_at: "2026-01-30" },
  { name: "United Kingdom", iso2: "GB", region: "europe", lgbtq_rights_index: 4, abortion_access: "legal_on_request_with_limits", verified_at: "2026-01-30" },
  { name: "France", iso2: "FR", region: "europe", lgbtq_rights_index: 5, abortion_access: "constitutional_right_on_request", verified_at: "2026-01-30" },
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function makeImportBatchId() {
  // deterministic-ish per run: uuid-like without extra deps
  return crypto.randomUUID();
}

async function seed() {
  const client = await pool.connect();
  const importBatchId = makeImportBatchId();

  try {
    console.log("Seeding countries + staging_country_research…");
    console.log(`import_batch_id: ${importBatchId}`);

    await client.query("BEGIN");

    // 1) Upsert minimal rows into public.countries
    // Schema reality: countries has no iso2 or abortion fields, so we store those in staging payload for now.
    for (const c of SEED) {
      await client.query(
        `
        INSERT INTO public.countries
          (name, regions, languages, timezones, climate_tags, status, lgbtq_rights_index)
        VALUES
          ($1, ARRAY[$2]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'verified', $3)
        ON CONFLICT (name)
        DO UPDATE SET
          regions = EXCLUDED.regions,
          status = EXCLUDED.status,
          lgbtq_rights_index = EXCLUDED.lgbtq_rights_index
        `,
        [c.name, c.region, c.lgbtq_rights_index]
      );
    }

    // 2) Insert richer snapshot rows into staging_country_research
    // (No upsert constraint guaranteed here, so we treat it as append-only by import_batch_id.)
    for (const c of SEED) {
      const payload = {
        country_name: c.name,
        iso2: c.iso2,
        region: c.region,
        lgbtq_rights_index: c.lgbtq_rights_index,
        abortion_access: c.abortion_access,
        verification: {
          status: "verified",
          verified_at: c.verified_at,
          source: "ui_seed_matching_destinations",
        },
      };

      await client.query(
        `
        INSERT INTO public.staging_country_research
          (import_batch_id, source_label, country_name, iso2, payload)
        VALUES
          ($1, $2, $3, $4, $5::jsonb)
        `,
        [importBatchId, "ui_seed_matching_destinations", c.name, c.iso2, JSON.stringify(payload)]
      );
    }

    await client.query("COMMIT");

    console.log(`Done. Seeded ${SEED.length} countries.`);
    console.log("Next: refresh the page and confirm the list is now DB-backed.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
