-- P-2.1: pipeline_alerts table for alert_writer to persist alerts
CREATE TABLE IF NOT EXISTS public.pipeline_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type text NOT NULL,
    entity_id text,
    alert_type text NOT NULL CHECK (alert_type IN ('high', 'medium')),
    notification text NOT NULL,
    email_summary text,
    acknowledged boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pipeline_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_all_pipeline_alerts
    ON public.pipeline_alerts FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- P-3.1: Function to flag stale editorial reviews (pending > 72h)
CREATE OR REPLACE FUNCTION flag_stale_editorial_reviews()
RETURNS integer AS $$
DECLARE
    flagged integer;
BEGIN
    UPDATE editorial_reviews
    SET notes = notes || ' [STALE: >72h pending]'
    WHERE status = 'pending'
      AND created_at < now() - interval '72 hours'
      AND notes NOT LIKE '%[STALE%';
    GET DIAGNOSTICS flagged = ROW_COUNT;
    RETURN flagged;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
