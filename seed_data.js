const { Client } = require('pg');

const connectionString = 'postgresql://postgres:EXoAjLVZVjjhIJMraECLtkIxNigNadIe@gondola.proxy.rlwy.net:13974/railway';

async function seedData() {
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('=== Seeding Database ===\n');

        // Check existing countries
        const existing = await client.query('SELECT name FROM countries');
        const existingNames = existing.rows.map(r => r.name);
        console.log(`Found ${existingNames.length} existing countries\n`);

        // Seed Mexico
        if (!existingNames.includes('Mexico')) {
            console.log('Seeding Mexico...');
            const mexicoResult = await client.query(
                `INSERT INTO countries (name, iso2, regions, languages, currency, timezones, climate_tags,
          healthcare_overview, rights_snapshot, tax_snapshot,
          lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
          last_verified_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
                ['Mexico', 'MX', ['North America', 'Latin America'], ['Spanish'], 'MXN',
                    ['America/Mexico_City'], ['Tropical', 'Arid'],
                    'Mixed public-private system. IMSS provides public coverage.',
                    'Constitutional protections exist but enforcement varies by state.',
                    'Territorial tax system for residents.',
                    4, 'Legal nationwide as of September 2023.',
                    'Federal hate crime laws exist.',
                    new Date().toISOString(), 'published']
            );
            console.log(`✓ Mexico created with ID: ${mexicoResult.rows[0].id}`);
        } else {
            console.log('Mexico already exists, skipping...');
        }

        // Seed Portugal
        if (!existingNames.includes('Portugal')) {
            console.log('Seeding Portugal...');
            const portugalResult = await client.query(
                `INSERT INTO countries (name, iso2, regions, languages, currency, timezones, climate_tags,
          healthcare_overview, rights_snapshot, tax_snapshot,
          lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
          last_verified_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
                ['Portugal', 'PT', ['Europe'], ['Portuguese'], 'EUR',
                    ['Europe/Lisbon'], ['Mediterranean'],
                    'National Health Service provides universal coverage.',
                    'EU member with strong equality protections.',
                    'NHR tax regime offers benefits for first 10 years.',
                    5, 'Legal and accessible.',
                    'Strong hate crime protections.',
                    new Date().toISOString(), 'published']
            );
            console.log(`✓ Portugal created with ID: ${portugalResult.rows[0].id}`);
        } else {
            console.log('Portugal already exists, skipping...');
        }

        console.log('\n=== Seed Complete ===');
        await client.end();
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seedData();
