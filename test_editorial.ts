// Test differ and editorial router
import { handler as differHandler } from './workers/differ';
import { handler as routerHandler } from './workers/editorial_router';

async function testEditorialWorkflow() {
    console.log('=== Testing Editorial Workflow ===\n');

    // Test 1: New country (should require review)
    console.log('Test 1: New country entity');
    const newCountry = {
        entity_type: 'country',
        entity_id: null, // New entity
        name: 'Portugal',
        iso2: 'PT',
        lgbtq_rights_index: 5,
        abortion_access_status: 'Legal and accessible',
        hate_crime_law_snapshot: 'Comprehensive protections',
        last_verified_at: new Date().toISOString()
    };

    const validationResult1 = {
        valid: true,
        errors: [],
        warnings: [],
        impact: 'low'
    };

    const differOutput1 = await differHandler({
        proposedEntity: newCountry,
        validationResult: validationResult1
    });

    if (differOutput1) {
        const routerResult1 = await routerHandler({
            proposedEntity: newCountry,
            differOutput: differOutput1,
            validationResult: validationResult1
        });
        console.log('Router Result:', JSON.stringify(routerResult1, null, 2));
        console.log('Expected: requires_review=true (new entity)\n');
    }

    // Test 2: Update with critical field change (lgbtq_rights_index)
    console.log('Test 2: Update with critical field change');
    const updatedCountry = {
        entity_type: 'country',
        entity_id: '123', // Existing entity (won't exist in DB, but simulates update)
        name: 'Canada',
        iso2: 'CA',
        lgbtq_rights_index: 4, // Changed from 5 to 4
        abortion_access_status: 'Legal and accessible',
        last_verified_at: new Date().toISOString()
    };

    // Simulate differ output with critical field change
    const differOutput2 = {
        change_type: 'update' as const,
        diff_summary: 'Changes detected for country: 1 fields modified.',
        diff_fields: [{
            field: 'lgbtq_rights_index',
            from: 5,
            to: 4
        }],
        source_ids: ['source-123']
    };

    const validationResult2 = {
        valid: true,
        errors: [],
        warnings: [],
        impact: 'low'
    };

    const routerResult2 = await routerHandler({
        proposedEntity: updatedCountry,
        differOutput: differOutput2,
        validationResult: validationResult2
    });
    console.log('Router Result:', JSON.stringify(routerResult2, null, 2));
    console.log('Expected: requires_review=true (critical field change)\n');

    // Test 3: Update with non-critical field change
    console.log('Test 3: Update with non-critical field change');
    const differOutput3 = {
        change_type: 'update' as const,
        diff_summary: 'Changes detected for country: 1 fields modified.',
        diff_fields: [{
            field: 'healthcare_overview',
            from: 'Old text',
            to: 'Updated text'
        }],
        source_ids: ['source-124']
    };

    const routerResult3 = await routerHandler({
        proposedEntity: updatedCountry,
        differOutput: differOutput3,
        validationResult: validationResult2
    });
    console.log('Router Result:', JSON.stringify(routerResult3, null, 2));
    console.log('Expected: requires_review=false (non-critical change, low impact)\n');

    // Test 4: Update with high validation impact
    console.log('Test 4: Update with high validation impact');
    const validationResult4 = {
        valid: false,
        errors: ['Missing required field: abortion_access_status'],
        warnings: [],
        impact: 'high'
    };

    const routerResult4 = await routerHandler({
        proposedEntity: updatedCountry,
        differOutput: differOutput3,
        validationResult: validationResult4
    });
    console.log('Router Result:', JSON.stringify(routerResult4, null, 2));
    console.log('Expected: requires_review=true (high validation impact)\n');

    console.log('=== Tests Complete ===');
}

testEditorialWorkflow().catch(console.error);
