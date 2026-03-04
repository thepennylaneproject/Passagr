-- Guardrails for staging -> production promotion replays.
-- Prevents duplicate promotion bookkeeping and introduces explicit batch-level run tracking.

CREATE TABLE IF NOT EXISTS public.staging_promotion_runs (
  import_batch_id text PRIMARY KEY,
  promoted_at timestamptz NOT NULL DEFAULT now(),
  promoted_by text NOT NULL DEFAULT current_user,
  staged_row_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_staging_promotion_runs_promoted_at
  ON public.staging_promotion_runs (promoted_at DESC);

CREATE OR REPLACE FUNCTION public.register_staging_promotion_run(
  p_import_batch_id text,
  p_staged_row_count integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_import_batch_id IS NULL OR btrim(p_import_batch_id) = '' THEN
    RAISE EXCEPTION 'import_batch_id is required';
  END IF;

  INSERT INTO public.staging_promotion_runs (import_batch_id, staged_row_count)
  VALUES (p_import_batch_id, GREATEST(p_staged_row_count, 0))
  ON CONFLICT (import_batch_id) DO NOTHING;

  RETURN FOUND;
END;
$$;

DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX ux_staging_country_research_batch_iso2
      ON public.staging_country_research (import_batch_id, lower(iso2))
      WHERE iso2 IS NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped ux_staging_country_research_batch_iso2 creation: %', SQLERRM;
  END;
END $$;
