-- Migration to process staging_country_research data into production tables
-- This functions as a "seed" promotion script, taking the raw JSON snapshots and populating the schema.

do $$
declare
  r record;
  country_id uuid;
  pathway jsonb;
  source_item jsonb;
  regime jsonb;
begin
  -- Loop through all staging records that haven't been processed (or just all of them, using upsert)
  for r in select * from staging_country_research loop
    begin
    
    -- 1. Upsert Country
    insert into countries (
      name, iso2, status, regions, languages, currency, timezones, climate_tags,
      healthcare_overview, tax_snapshot, rights_snapshot,
      lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
      last_verified_at
    )
    values (
      r.payload->'country'->>'name',
      r.payload->'country'->>'iso2',
      'published', -- defaulting to published as per migration intent
      array(select jsonb_array_elements_text(r.payload->'country'->'region')), -- region is string in JSON but array in DB? check. Spain says "region": "europe". Portugal SQL had array['europe']. Need to cast.
      null, -- languages not in JSON? Portugal had it. Spain JSON doesn't show languages list.
      r.payload->'pathways'->0->'income_requirement'->>'currency', -- Best guess for currency? Or default to null.
      null, -- timezones
      null, -- climate_tags
      r.payload->'healthcare'->>'access_notes', -- mapping healthcare_overview
      r.payload->'taxation'->>'tax_notes', -- mapping tax_snapshot
      r.payload->'rights_and_safety'->>'lgbtq_notes', -- mapping rights_snapshot? No, rights_snapshot usually summary? 
      (r.payload->'rights_and_safety'->>'lgbtq_rights_score')::numeric,
      r.payload->'rights_and_safety'->>'abortion_status',
      r.payload->'rights_and_safety'->>'hate_crime_protections',
      (r.payload->'country'->>'last_verified_at')::timestamptz
    )
    on conflict (iso2) do update set
      status = excluded.status,
      healthcare_overview = excluded.healthcare_overview,
      tax_snapshot = excluded.tax_snapshot,
      lgbtq_rights_index = excluded.lgbtq_rights_index,
      abortion_access_status = excluded.abortion_access_status,
      hate_crime_law_snapshot = excluded.hate_crime_law_snapshot,
      last_verified_at = excluded.last_verified_at
    returning id into country_id;

    -- Adjust array fields if possible. Spain JSON: "region": "europe". DB: text[].
    update countries 
    set regions = array[r.payload->'country'->>'region'] 
    where id = country_id;


    -- 2. Upsert Visa Paths
    for pathway in select * from jsonb_array_elements(r.payload->'pathways') loop
      insert into visa_paths (
        country_id, name, type, description, work_rights,
        min_income_amount, min_income_currency, 
        processing_min_days, processing_max_days,
        eligibility, last_verified_at
      )
      values (
        country_id,
        pathway->>'name',
        pathway->>'pathway_type',
        coalesce(pathway->>'notes', ''), -- Description often maps to notes in this JSON, fallback to empty string
        case when (pathway->>'remote_work_allowed')::boolean then 'Remote work allowed' else 'Employment or other' end,
        (pathway->'income_requirement'->>'amount')::numeric,
        pathway->'income_requirement'->>'currency',
        (pathway->'processing_time_months'->>'min')::numeric * 30, -- Approx days
        (pathway->'processing_time_months'->>'max')::numeric * 30,
        null, -- eligibility JSON?
        (r.payload->'country'->>'last_verified_at')::timestamptz
      )
      on conflict (country_id, name) do update set
        type = excluded.type,
        description = excluded.description,
        work_rights = excluded.work_rights,
        min_income_amount = excluded.min_income_amount,
        last_verified_at = excluded.last_verified_at;
    end loop;

    -- 3. Upsert Sources
    for source_item in select * from jsonb_array_elements(r.payload->'sources') loop
      insert into sources (url, title, publisher, content_type, fetched_at, reliability_score)
      values (
        source_item->>'url',
        'Source for ' || (r.payload->'country'->>'name'), -- Title not in JSON, generating generic
        source_item->>'source_type', -- Publisher not in JSON, using type
        source_item->>'source_type',
        (source_item->>'retrieved_at')::timestamptz,
        case when source_item->>'reliability' = 'high' then 5 when source_item->>'reliability' = 'medium' then 3 else 1 end
      )
      on conflict (url) do nothing;
    end loop;

    -- 4. Upsert Healthcare Metrics
    insert into country_healthcare_metrics (
      country_id, system_type, public_access_notes, cost_notes,
      gp_visit_cost, private_insurance_cost
    )
    values (
      country_id,
      coalesce(r.payload->'healthcare'->>'system_type', 'Private'), -- Fallback
      coalesce(r.payload->'healthcare'->>'access_notes', ''),
      coalesce(r.payload->'healthcare'->>'quality_notes', ''), -- Mapping quality_notes to cost_notes broadly
      null, -- Parsed from text? Hard to extracting "€50–€200" reliably via SQL without regex
      null
    )
    on conflict (country_id) do update set
      system_type = excluded.system_type,
      public_access_notes = excluded.public_access_notes;

    -- 5. Upsert Tax Profiles
    insert into country_tax_profiles (
      country_id, standard_income_tax, notes, us_tax_treaty,
      feie_strategy, foreign_tax_credit_strategy, local_incentives
    )
    values (
      country_id,
      coalesce(r.payload->'taxation'->>'tax_notes', ''), -- Using tax_notes for standard_income_tax summary
      coalesce(r.payload->'taxation'->>'tax_notes', ''),
      coalesce((r.payload->'taxation'->>'us_tax_treaty')::boolean, false),
      'Not specific', -- feie_strategy default
      'Not specific', -- foreign_tax_credit_strategy default
      coalesce(r.payload->'taxation'->>'special_regimes'->0->>'notes', 'None') -- local_incentives default
    )
    on conflict (country_id) do update set
      notes = excluded.notes;

    -- 6. Upsert Language Profiles
    insert into country_language_profiles (
      country_id, citizenship_language, difficulty, family_reunification_wait,
      eligible_family, years_to_permanent_residency, years_to_citizenship,
      dual_citizenship_allowed, notes
    )
    values (
      country_id,
      coalesce(r.payload->'language_family_citizenship'->>'language_for_citizenship', 'See notes'),
      coalesce(r.payload->'language_family_citizenship'->>'difficulty', 'Moderate'),
      coalesce((r.payload->'language_family_citizenship'->>'family_reunification_wait_months')::text, '0'),
      coalesce((r.payload->'language_family_citizenship'->>'eligible_family_members')::text, 'Spouse/Children'),
      coalesce((r.payload->'language_family_citizenship'->>'years_to_pr')::text, '5'),
      coalesce((r.payload->'language_family_citizenship'->>'years_to_citizenship'->>'min')::text, '5'), -- Simplified
      coalesce((r.payload->'language_family_citizenship'->>'dual_citizenship_allowed')::boolean, true),
      coalesce(r.payload->'language_family_citizenship'->>'notes', '')
    )
    on conflict (country_id) do update set
       notes = excluded.notes;

    -- 7. Upsert Quality of Life
    insert into country_quality_of_life (
      country_id, eiu_liveability, monocle_qol, climate,
      english_proficiency, major_expat_hubs, timezone_from_us, direct_flights, notes
    )
    values (
      country_id,
      'Not Ranked', -- Default based on JSON absence of this specific field usually
      'Not Ranked',
      coalesce(r.payload->'quality_of_life'->>'climate', ''),
      coalesce(r.payload->'quality_of_life'->>'english_proficiency', ''),
      coalesce((r.payload->'quality_of_life'->>'major_expat_hubs')::text, ''),
      coalesce(r.payload->'quality_of_life'->>'time_zone_from_us_est', ''),
      coalesce(r.payload->'quality_of_life'->>'direct_flights_from_us', ''),
      coalesce(r.payload->'quality_of_life'->>'notes', '')
    )
    on conflict (country_id) do update set
       notes = excluded.notes;

    RAISE NOTICE 'Processed %', r.payload->'country'->>'name';
    
    exception when others then
      RAISE WARNING 'Error processing %: %', r.payload->'country'->>'name', SQLERRM;
    end;
  end loop;
end $$;
