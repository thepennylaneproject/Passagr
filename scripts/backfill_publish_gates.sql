-- Cleanup/backfill to make data consistent before validating constraints.
-- Conservative: normalize iso2 casing, recompute abortion_access_tier,
-- and demote invalid published/verified rows to draft for manual review.

-- 1) Normalize iso2 to uppercase where length is 2.
update public.countries
set iso2 = upper(iso2)
where iso2 is not null
  and char_length(iso2) = 2
  and iso2 <> upper(iso2);

-- 2) Recompute abortion_access_tier from abortion_access_status when available.
update public.countries
set abortion_access_tier = public.classify_abortion_access_tier(abortion_access_status)
where abortion_access_status is not null;

-- 3) Demote published/verified countries missing required safety fields.
update public.countries
set status = 'draft'
where status in ('published', 'verified')
  and (
    iso2 is null
    or char_length(iso2) <> 2
    or iso2 <> upper(iso2)
    or lgbtq_rights_index is null
    or lgbtq_rights_index < 0
    or lgbtq_rights_index > 5
    or abortion_access_status is null
    or last_verified_at is null
  );

-- 4) Demote visa paths with invalid processing ranges or missing currencies.
update public.visa_paths
set status = 'draft'
where status = 'published'
  and (
    (processing_min_days is not null and processing_max_days is not null and processing_min_days > processing_max_days)
    or (min_income_amount is not null and (min_income_currency is null or char_length(min_income_currency) <> 3))
    or (min_savings_amount is not null and (min_savings_currency is null or char_length(min_savings_currency) <> 3))
  );

-- 5) Flag cost_items with invalid parent linkage (no automatic fix; keep for manual cleanup).
-- Use the audit query in scripts/data_integrity_audit.sql to review.
