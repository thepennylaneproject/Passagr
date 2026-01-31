
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env vars
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const SUPABASE_URL = envConfig.VITE_SUPABASE_URL || envConfig.SUPABASE_URL;
const SERVICE_KEY = envConfig.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY.startsWith('sb_secret_')) {
    console.error('Error: valid SUPABASE_URL and SUPABASE_SECRET_KEY (service_role) are required in .env.local');
    console.error('Current Secret Key starts with "sb_secret_", which looks like a placeholder.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('=== Seeding via Supabase API ===');
    console.log('Target:', SUPABASE_URL);

    try {
        // --- 1. SEED COUNTRIES ---
        console.log('\nSeeding Countries...');
        
        // Canada
        const { data: canada, error: canadaErr } = await supabase
            .from('countries')
            .upsert({
                name: 'Canada',
                iso2: 'CA',
                regions: ['North America'],
                languages: ['English', 'French'],
                currency: 'CAD',
                timezones: ['America/Toronto', 'America/Vancouver'],
                climate_tags: ['Temperate', 'Continental', 'Subarctic'],
                healthcare_overview: 'Universal healthcare system. High quality care.',
                rights_snapshot: 'Strong constitutional protections.',
                tax_snapshot: 'Progressive taxation system.',
                lgbtq_rights_index: 5,
                abortion_access_status: 'Legal and accessible nationwide',
                hate_crime_law_snapshot: 'Comprehensive hate crime laws.',
                last_verified_at: new Date().toISOString(),
                status: 'published'
            }, { onConflict: 'name' })
            .select()
            .single();

        if (canadaErr) throw canadaErr;
        console.log('✓ Canada seeded:', canada.id);

        // Portugal
        const { data: portugal, error: ptErr } = await supabase
            .from('countries')
            .upsert({
                name: 'Portugal',
                iso2: 'PT',
                regions: ['Europe', 'Southern Europe'],
                languages: ['Portuguese'],
                currency: 'EUR',
                timezones: ['Europe/Lisbon'],
                climate_tags: ['Mediterranean', 'Temperate'],
                healthcare_overview: 'National Health Service (SNS). Universal coverage.',
                rights_snapshot: 'Strong equality protections.',
                tax_snapshot: 'NHR tax regime available.',
                lgbtq_rights_index: 5,
                abortion_access_status: 'Legal and accessible',
                hate_crime_law_snapshot: 'Strong hate crime protections.',
                last_verified_at: new Date().toISOString(),
                status: 'published'
            }, { onConflict: 'name' })
            .select()
            .single();

        if (ptErr) throw ptErr;
        console.log('✓ Portugal seeded:', portugal.id);

        // --- 2. SEED VISA PATHS ---
        console.log('\nSeeding Visa Paths...');

        // Canada Express Entry
        const { error: fswErr } = await supabase
            .from('visa_paths')
            .upsert({
                country_id: canada.id,
                name: 'Express Entry (Federal Skilled Worker)',
                type: 'work',
                description: 'Points-based immigration system for skilled workers.',
                eligibility: ['Skilled work experience', 'Language proficiency'],
                fees: [{ label: 'Application fee', amount: 850, currency: 'CAD' }],
                status: 'published',
                last_verified_at: new Date().toISOString()
            }, { onConflict: 'country_id, name' });
        
        if (fswErr) throw fswErr;
        console.log('✓ Express Entry seeded');

        // Portugal D7
        const { error: d7Err } = await supabase
            .from('visa_paths')
            .upsert({
                country_id: portugal.id,
                name: 'D7 Visa (Passive Income)',
                type: 'retirement',
                description: 'For retirees and those with passive income.',
                eligibility: ['Proof of passive income', 'Clean criminal record'],
                fees: [{ label: 'Visa fee', amount: 90, currency: 'EUR' }],
                min_income_amount: 820,
                min_income_currency: 'EUR',
                status: 'published',
                last_verified_at: new Date().toISOString()
            }, { onConflict: 'country_id, name' });

        if (d7Err) throw d7Err;
        console.log('✓ D7 Visa seeded');

        console.log('\nSeed Complete!');

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

main();
