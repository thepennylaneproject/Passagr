-- Data integrity audit queries for constraints introduced in 20260204100000_data_integrity_and_rls.sql

-- 1) Published/verified countries without valid iso2
select id, name, iso2, status
from public.countries
where status in ('published', 'verified')
  and (
    iso2 is null
    or char_length(iso2) <> 2
    or iso2 <> upper(iso2)
  );

-- 2) Published/verified countries missing safety fields
select id, name, status, lgbtq_rights_index, abortion_access_status, last_verified_at
from public.countries
where status in ('published', 'verified')
  and (
    lgbtq_rights_index is null
    or lgbtq_rights_index < 0
    or lgbtq_rights_index > 5
    or abortion_access_status is null
    or last_verified_at is null
  );

-- 3) Visa path processing range invalid
select id, country_id, name, processing_min_days, processing_max_days
from public.visa_paths
where processing_min_days is not null
  and processing_max_days is not null
  and processing_min_days > processing_max_days;

-- 4) Visa path missing currency when amount set
select id, country_id, name, min_income_amount, min_income_currency, min_savings_amount, min_savings_currency
from public.visa_paths
where (min_income_amount is not null and (min_income_currency is null or char_length(min_income_currency) <> 3))
   or (min_savings_amount is not null and (min_savings_currency is null or char_length(min_savings_currency) <> 3));

-- 5) Cost items with invalid parent linkage
select id, scope, country_id, visapath_id
from public.cost_items
where ((country_id is not null)::int + (visapath_id is not null)::int) <> 1;

-- 6) Country list tables with missing parents (should be none)
select cl.id, cl.country_id, cl.language
from public.country_languages cl
left join public.countries c on c.id = cl.country_id
where c.id is null;

select ct.id, ct.country_id, ct.timezone
from public.country_timezones ct
left join public.countries c on c.id = ct.country_id
where c.id is null;

select cc.id, cc.country_id, cc.tag
from public.country_climate_tags cc
left join public.countries c on c.id = cc.country_id
where c.id is null;

-- 7) Changelog rows referencing missing entities
select c.id, c.entity_type, c.entity_id
from public.changelogs c
left join public.countries co on c.entity_type = 'country' and c.entity_id = co.id
left join public.visa_paths vp on c.entity_type = 'visa_path' and c.entity_id = vp.id
left join public.requirements r on c.entity_type = 'requirement' and c.entity_id = r.id
left join public.steps s on c.entity_type = 'step' and c.entity_id = s.id
left join public.cost_items ci on c.entity_type = 'cost_item' and c.entity_id = ci.id
left join public.sources so on c.entity_type = 'source' and c.entity_id = so.id
left join public.cities ct on c.entity_type = 'city' and c.entity_id = ct.id
where (c.entity_type = 'country' and co.id is null)
   or (c.entity_type = 'visa_path' and vp.id is null)
   or (c.entity_type = 'requirement' and r.id is null)
   or (c.entity_type = 'step' and s.id is null)
   or (c.entity_type = 'cost_item' and ci.id is null)
   or (c.entity_type = 'source' and so.id is null)
   or (c.entity_type = 'city' and ct.id is null);
