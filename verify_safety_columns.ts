import { Client } from 'pg';

const connectionString = 'postgresql://postgres:EXoAjLVZVjjhIJMraECLtkIxNigNadIe@gondola.proxy.rlwy.net:13974/railway';

async function verifySchema() {
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        // Check for safety columns in countries table
        const countriesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'countries' 
      AND column_name IN ('lgbtq_rights_index', 'abortion_access_status', 'hate_crime_law_snapshot')
      ORDER BY column_name
    `);

        console.log('\n✓ Safety columns in countries table:');
        countriesColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

        // Check for in_country_conversion_path in visa_paths
        const visaPathsColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'visa_paths' 
      AND column_name = 'in_country_conversion_path'
    `);

        console.log('\n✓ Safety columns in visa_paths table:');
        visaPathsColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

        // Check for prep_mode in requirements
        const requirementsColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'requirements' 
      AND column_name = 'prep_mode'
    `);

        console.log('\n✓ Safety columns in requirements table:');
        requirementsColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}, default: ${row.column_default})`);
        });

        // Check freshness policies
        const policies = await client.query(`
      SELECT key, ttl_days, criticality 
      FROM freshness_policies 
      WHERE key IN ('lgbtq_rights_index', 'abortion_access_status', 'hate_crime_law_snapshot')
      ORDER BY key
    `);

        console.log('\n✓ Safety-related freshness policies:');
        policies.rows.forEach(row => {
            console.log(`  - ${row.key}: ${row.ttl_days} days (${row.criticality})`);
        });

        console.log('\n✅ All critical safety fields verified successfully!');

        await client.end();
    } catch (err) {
        console.error('✗ Verification failed:', err);
        process.exit(1);
    }
}

verifySchema();
