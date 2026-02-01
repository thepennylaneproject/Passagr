-- Migration to retry processing staging_country_research data into production tables
-- Fixes eligibility Not-Null constraint in visa_paths.

do $$
declare
  v_r record;
  v_country_id uuid;
  v_pathway jsonb;
  v_source_item jsonb;
begin
  -- Loop through all staging records
  for v_r in select * from staging_country_research loop
    begin
    
    -- 1. Upsert Country
    insert into countries (
      name, iso2, status, regions, languages, currency, timezones, climate_tags,
      healthcare_overview, tax_snapshot, rights_snapshot,
      lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
      last_verified_at
    )
    values (
      v_r.payload->'country'->>'name',
      v_r.payload->'country'->>'iso2',
      'published',
      array[v_r.payload->'country'->>'region'],
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(v_r.payload->'country'->'languages') t(x)), 
        '{}'::text[]
      ),
      coalesce(v_r.payload->'pathways'->0->'income_requirement'->>'currency', 'USD'),
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(v_r.payload->'country'->'timezones') t(x)),
        '{}'::text[]
      ),
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(v_r.payload->'country'->'climate_tags') t(x)),
        '{}'::text[]
      ),
      coalesce(v_r.payload->'healthcare'->>'access_notes', ''),
      coalesce(v_r.payload->'taxation'->>'tax_notes', ''),
      coalesce(v_r.payload->'rights_and_safety'->>'lgbtq_notes', ''),
      coalesce((v_r.payload->'rights_and_safety'->>'lgbtq_rights_score')::numeric, 0),
      coalesce(v_r.payload->'rights_and_safety'->>'abortion_status', 'Unknown'),
      coalesce(v_r.payload->'rights_and_safety'->>'hate_crime_protections', 'Unknown'),
      (v_r.payload->'country'->>'last_verified_at')::timestamptz
    )
    on conflict (iso2) do update set
      status = excluded.status,
      regions = excluded.regions,
      languages = excluded.languages,
      currency = excluded.currency,
      timezones = excluded.timezones,
      climate_tags = excluded.climate_tags,
      healthcare_overview = excluded.healthcare_overview,
      tax_snapshot = excluded.tax_snapshot,
      lgbtq_rights_index = excluded.lgbtq_rights_index,
      abortion_access_status = excluded.abortion_access_status,
      hate_crime_law_snapshot = excluded.hate_crime_law_snapshot,
      last_verified_at = excluded.last_verified_at
    returning id into v_country_id;

    -- 2. Upsert Visa Paths
    for v_pathway in select * from jsonb_array_elements(v_r.payload->'pathways') loop
      insert into visa_paths (
        country_id, name, type, description, work_rights,
        min_income_amount, min_income_currency, 
        processing_min_days, processing_max_days,
        eligibility, last_verified_at
      )
      values (
        v_country_id,
        v_pathway->>'name',
        v_pathway->>'pathway_type',
        coalesce(v_pathway->>'notes', ''),
        case when (v_pathway->>'remote_work_allowed')::boolean then 'Remote work allowed' else 'Employment or other' end,
        (v_pathway->'income_requirement'->>'amount')::numeric,
        v_pathway->'income_requirement'->>'currency',
        (v_pathway->'processing_time_months'->>'min')::numeric * 30,
        (v_pathway->'processing_time_months'->>'max')::numeric * 30,
        coalesce(v_pathway->'eligibility', '[]'::jsonb), -- Fix: Default to empty JSON array
        (v_r.payload->'country'->>'last_verified_at')::timestamptz
      )
      on conflict (country_id, name) do update set
        type = excluded.type,
        description = excluded.description,
        work_rights = excluded.work_rights,
        min_income_amount = excluded.min_income_amount,
        last_verified_at = excluded.last_verified_at;
    end loop;

    -- 3. Upsert Sources
    for v_source_item in select * from jsonb_array_elements(v_r.payload->'sources') loop
      insert into sources (url, title, publisher, content_type, fetched_at, reliability_score)
      values (
        v_source_item->>'url',
        'Source for ' || (v_r.payload->'country'->>'name'),
        v_source_item->>'source_type',
        v_source_item->>'source_type',
        (v_source_item->>'retrieved_at')::timestamptz,
        case when v_source_item->>'reliability' = 'high' then 5 when v_source_item->>'reliability' = 'medium' then 3 else 1 end
      )
      on conflict (url) do nothing;
    end loop;

    -- 4. Upsert Healthcare Metrics
    insert into country_healthcare_metrics (
      country_id, system_type, public_access_notes, cost_notes,
      gp_visit_cost, private_insurance_cost
    )
    values (
      v_country_id,
      coalesce(v_r.payload->'healthcare'->>'system_type', 'Private'),
      coalesce(v_r.payload->'healthcare'->>'access_notes', ''),
      coalesce(v_r.payload->'healthcare'->>'quality_notes', ''),
      null,
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
      v_country_id,
      coalesce(v_r.payload->'taxation'->>'tax_notes', ''),
      coalesce(v_r.payload->'taxation'->>'tax_notes', ''),
      coalesce((v_r.payload->'taxation'->>'us_tax_treaty')::boolean, false),
      'Not specific',
      'Not specific',
      coalesce(v_r.payload->'taxation'->>'special_regimes'->0->>'notes', 'None')
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
      v_country_id,
      coalesce(v_r.payload->'language_family_citizenship'->>'language_for_citizenship', 'See notes'),
      coalesce(v_r.payload->'language_family_citizenship'->>'difficulty', 'Moderate'),
      coalesce((v_r.payload->'language_family_citizenship'->>'family_reunification_wait_months')::text, '0'),
      coalesce((v_r.payload->'language_family_citizenship'->>'eligible_family_members')::text, 'Spouse/Children'),
      coalesce((v_r.payload->'language_family_citizenship'->>'years_to_pr')::text, '5'),
      coalesce((v_r.payload->'language_family_citizenship'->>'years_to_citizenship'->>'min')::text, '5'),
      coalesce((v_r.payload->'language_family_citizenship'->>'dual_citizenship_allowed')::boolean, true),
      coalesce(v_r.payload->'language_family_citizenship'->>'notes', '')
    )
    on conflict (country_id) do update set
       notes = excluded.notes;

    -- 7. Upsert Quality of Life
    insert into country_quality_of_life (
      country_id, eiu_liveability, monocle_qol, climate,
      english_proficiency, major_expat_hubs, timezone_from_us, direct_flights, notes
    )
    values (
      v_country_id,
      'Not Ranked',
      'Not Ranked',
      coalesce(v_r.payload->'quality_of_life'->>'climate', ''),
      coalesce(v_r.payload->'quality_of_life'->>'english_proficiency', ''),
      coalesce((v_r.payload->'quality_of_life'->>'major_expat_hubs')::text, ''),
      coalesce(v_r.payload->'quality_of_life'->>'time_zone_from_us_est', ''),
      coalesce(v_r.payload->'quality_of_life'->>'direct_flights_from_us', ''),
      coalesce(v_r.payload->'quality_of_life'->>'notes', '')
    )
    on conflict (country_id) do update set
       notes = excluded.notes;

    RAISE NOTICE 'Processed %', v_r.payload->'country'->>'name';
    
    exception when others then
      RAISE WARNING 'Error processing %: %', v_r.payload->'country'->>'name', SQLERRM;
    end;
  end loop;
end $$;
