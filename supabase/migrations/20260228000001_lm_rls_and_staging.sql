-- D-1: Enable RLS on all lm_* tables (PII: email, phone, legal intake summaries)
-- These tables had RLS never enabled, exposing all rows to any authenticated/anon user.

ALTER TABLE IF EXISTS public.lm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lm_attorney_sources ENABLE ROW LEVEL SECURITY;

-- Service-role-only policies for lm_* tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'lm_clients', 'lm_intakes', 'lm_attorneys', 'lm_matches',
      'lm_outreach_drafts', 'lm_review_tasks', 'lm_submissions',
      'lm_audit_logs', 'lm_attorney_sources'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'service_role_all_' || tbl,
      tbl
    );
  END LOOP;
END
$$;

-- D-2: Enable RLS on staging_country_research (exposes raw draft import payloads)
ALTER TABLE IF EXISTS public.staging_country_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS service_role_all_staging_country_research
  ON public.staging_country_research
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- D-3: Revoke excess anon grants on country lookup tables
-- These were granted INSERT/UPDATE/DELETE/TRUNCATE via remote schema dump but should be SELECT-only.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.country_languages FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.country_timezones FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.country_climate_tags FROM anon;
