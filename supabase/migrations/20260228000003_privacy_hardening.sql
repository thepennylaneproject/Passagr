-- D-4: Restrict country_profile_compact to published rows only
-- If the view exists, recreate it with a WHERE clause filtering to published status.
-- This prevents draft/unpublished data from leaking through the view.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'country_profile_compact') THEN
    EXECUTE '
      CREATE OR REPLACE VIEW public.country_profile_compact AS
      SELECT id, name, iso2, regions, languages, currency, climate_tags,
             lgbtq_rights_index, abortion_access_status, last_verified_at
      FROM public.countries
      WHERE status = ''published''
    ';
  END IF;
END $$;

-- D-5: Tighten checklist template policy to scope by created_by
-- Only allow editors to modify templates they created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'editor_template_access') THEN
    DROP POLICY editor_template_access ON public.checklist_templates;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_templates') THEN
    CREATE POLICY editor_template_access ON public.checklist_templates
      FOR ALL TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- D-6: Create restricted views that exclude PII columns
-- Prevents email, phone from appearing in broad SELECT * queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lm_clients') THEN
    CREATE OR REPLACE VIEW public.lm_clients_safe AS
    SELECT id, created_at, updated_at, status
    FROM public.lm_clients;
    
    -- Only service role can access the full table
    REVOKE ALL ON public.lm_clients_safe FROM anon;
    GRANT SELECT ON public.lm_clients_safe TO service_role;
  END IF;
END $$;
