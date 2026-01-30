// seed_data.ts - Seed initial country and visa path data
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function seedData() {
    console.log('=== Seeding Database ===\n');

    try {
        // Check for existing data
        const existingCountries = await pool.query('SELECT name FROM countries');
        const existingNames = existingCountries.rows.map(r => r.name);
        console.log(`Found ${existingNames.length} existing countries: ${existingNames.join(', ') || 'none'}\n`);
        // Seed Canada
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
            [
                'Canada',
                'CA',
                ['North America'],
                ['English', 'French'],
                'CAD',
                ['America/Toronto', 'America/Vancouver'],
                ['Temperate', 'Continental', 'Subarctic'],
                'Universal healthcare system covering all residents. High quality care with no direct costs at point of service.',
                'Strong constitutional protections. Charter of Rights and Freedoms protects equality rights.',
                'Progressive taxation system. Federal + provincial taxes. Tax treaties with many countries.',
                5, // Excellent LGBTQ+ rights
                'Legal and accessible nationwide since 1988. Covered by public healthcare.',
                'Comprehensive hate crime laws. Criminal Code provisions for hate-motivated offenses.',
                new Date().toISOString(),
                'published'
            ]
        );
        const canadaId = canadaResult.rows[0].id;
        console.log(`✓ Canada created with ID: ${ canadaId } `);
    }

        // Seed Canada visa paths
        console.log('Seeding Canada visa paths...');

        // Express Entry
        const expressEntryResult = await pool.query(
            `INSERT INTO visa_paths(
            country_id, name, type, description, eligibility, work_rights,
            dependents_rules, min_income_amount, min_income_currency,
            fees, processing_min_days, processing_max_days,
            renewal_rules, to_pr_citizenship_timeline, in_country_conversion_path,
            last_verified_at, status
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
            [
                canadaId,
                'Express Entry (Federal Skilled Worker)',
                'work',
                'Points-based immigration system for skilled workers. Fastest pathway to permanent residence.',
                JSON.stringify(['Skilled work experience', 'Language proficiency (CLB 7+)', 'Education credential assessment']),
                'Full work rights immediately upon PR approval',
                'Spouse and dependent children can be included in application',
                null, null, // No minimum income for FSW
                JSON.stringify([
                    { label: 'Application fee (principal)', amount: 850, currency: 'CAD' },
                    { label: 'Right of PR fee', amount: 515, currency: 'CAD' }
                ]),
                180, 365,
                'PR status must be maintained (2 years in Canada per 5-year period)',
                'Eligible for citizenship after 3 years of PR status',
                'Can apply for PR from within Canada on work permit',
                new Date().toISOString(),
                'published'
            ]
        );
        console.log(`✓ Express Entry created`);

        // Mexico
        console.log('\nSeeding Mexico...');
        const mexicoResult = await pool.query(
            `INSERT INTO countries(
            name, iso2, regions, languages, currency, timezones, climate_tags,
            healthcare_overview, rights_snapshot, tax_snapshot,
            lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
            last_verified_at, status
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
            [
                'Mexico',
                'MX',
                ['North America', 'Latin America'],
                ['Spanish'],
                'MXN',
                ['America/Mexico_City', 'America/Cancun'],
                ['Tropical', 'Arid', 'Temperate'],
                'Mixed public-private system. IMSS provides public coverage. Private insurance recommended for expats.',
                'Constitutional protections exist but enforcement varies by state. Mexico City has strongest protections.',
                'Territorial tax system for residents. Foreign income may be taxable after becoming tax resident.',
                4, // Good LGBTQ+ rights, especially in major cities
                'Legal nationwide as of September 2023. Access varies by state.',
                'Federal hate crime laws exist. LGBT+ protections stronger in major cities.',
                new Date().toISOString(),
                'published'
            ]
        );
        const mexicoId = mexicoResult.rows[0].id;
        console.log(`✓ Mexico created with ID: ${ mexicoId } `);

        // Seed Mexico visa paths
        console.log('Seeding Mexico visa paths...');

        // Temporary Resident Visa
        await pool.query(
            `INSERT INTO visa_paths(
            country_id, name, type, description, eligibility, work_rights,
            dependents_rules, min_income_amount, min_income_currency,
            fees, processing_min_days, processing_max_days,
            renewal_rules, to_pr_citizenship_timeline, in_country_conversion_path,
            last_verified_at, status
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
                mexicoId,
                'Temporary Resident Visa (Rentista)',
                'retirement',
                'For retirees or those with passive income. Renewable annually for up to 4 years.',
                JSON.stringify(['Proof of monthly income ~$2,700 USD or savings ~$45,000 USD', 'Clean criminal record']),
                'No work rights (income must be from outside Mexico)',
                'Spouse and dependents can apply as economic dependents',
                2700, 'USD',
                JSON.stringify([
                    { label: 'Visa application fee', amount: 48, currency: 'USD' },
                    { label: 'Resident card fee', amount: 270, currency: 'USD' }
                ]),
                30, 90,
                'Renewable annually. After 4 years, can apply for permanent residence.',
                'Eligible for permanent residence after 4 years. Citizenship after 5 years of PR.',
                'Can convert to permanent residence after 4 years of temporary residence',
                new Date().toISOString(),
                'published'
            ]
        );
        console.log(`✓ Temporary Resident Visa created`);

        // Portugal
        console.log('\nSeeding Portugal...');
        const portugalResult = await pool.query(
            `INSERT INTO countries(
            name, iso2, regions, languages, currency, timezones, climate_tags,
            healthcare_overview, rights_snapshot, tax_snapshot,
            lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
            last_verified_at, status
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
            [
                'Portugal',
                'PT',
                ['Europe', 'Southern Europe'],
                ['Portuguese'],
                'EUR',
                ['Europe/Lisbon'],
                ['Mediterranean', 'Temperate'],
                'National Health Service (SNS) provides universal coverage. EU/EEA citizens have full access. Others need private insurance initially.',
                'EU member with strong equality protections. Same-sex marriage legal since 2010.',
                'NHR (Non-Habitual Resident) tax regime offers significant benefits for first 10 years. Worldwide income may be taxed.',
                5, // Excellent LGBTQ+ rights
                'Legal and accessible. Available on request up to 10 weeks.',
                'Strong hate crime protections. EU anti-discrimination directives apply.',
                new Date().toISOString(),
                'published'
            ]
        );
        const portugalId = portugalResult.rows[0].id;
        console.log(`✓ Portugal created with ID: ${ portugalId } `);

        // Seed Portugal visa paths
        console.log('Seeding Portugal visa paths...');

        // D7 Visa
        await pool.query(
            `INSERT INTO visa_paths(
            country_id, name, type, description, eligibility, work_rights,
            dependents_rules, min_income_amount, min_income_currency,
            fees, processing_min_days, processing_max_days,
            renewal_rules, to_pr_citizenship_timeline, in_country_conversion_path,
            last_verified_at, status
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
                portugalId,
                'D7 Visa (Passive Income/Retirement)',
                'retirement',
                'For retirees, remote workers, and those with passive income. Popular among digital nomads.',
                JSON.stringify(['Proof of passive income (pension, investments, rental)', 'Minimum €820/month for main applicant', 'Portuguese bank account', 'Accommodation in Portugal']),
                'Can work remotely for non-Portuguese employers. Can start Portuguese business.',
                'Family members can be included. Additional income requirements apply.',
                820, 'EUR',
                JSON.stringify([
                    { label: 'Visa application fee', amount: 90, currency: 'EUR' },
                    { label: 'Residence permit fee', amount: 5340, currency: 'EUR' }
                ]),
                60, 180,
                'Renewable every 2 years. Must maintain income requirements and spend time in Portugal.',
                'Eligible for permanent residence after 5 years. Citizenship after 5 years (with language test).',
                'Standard path: 1yr temp → 2yr temp → 2yr temp → permanent residence',
                new Date().toISOString(),
                'published'
            ]
        );
        console.log(`✓ D7 Visa created`);

        console.log('\n=== Seed Complete ===');
        console.log('Summary:');
        console.log('- 3 countries seeded (Canada, Mexico, Portugal)');
        console.log('- 3 visa paths seeded (1 per country)');
        console.log('- All entities marked as published');
        console.log('- All critical safety fields populated');

        await pool.end();
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seedData();
