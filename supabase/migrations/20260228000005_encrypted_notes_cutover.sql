-- Finalize encrypted notes cutover for user_saved_path_notes.
-- Preconditions:
-- 1) All rows have body_ciphertext/body_nonce/body_key_version populated.
-- 2) Application reads/writes notes only through encrypted server endpoints.

DO $$
DECLARE
  unencrypted_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_saved_path_notes'
      AND column_name = 'body'
  ) THEN
    -- Already cut over.
    RETURN;
  END IF;

  SELECT count(*)
    INTO unencrypted_count
  FROM public.user_saved_path_notes
  WHERE body_ciphertext IS NULL
     OR body_nonce IS NULL
     OR body_key_version IS NULL
     OR body_key_version <= 0;

  IF unencrypted_count > 0 THEN
    RAISE EXCEPTION 'Encrypted notes cutover blocked: % note rows are missing encrypted payload columns', unencrypted_count;
  END IF;

  ALTER TABLE public.user_saved_path_notes
    DROP CONSTRAINT IF EXISTS ck_user_saved_path_notes_body_encryption_state;

  ALTER TABLE public.user_saved_path_notes
    ALTER COLUMN body_ciphertext SET NOT NULL,
    ALTER COLUMN body_nonce SET NOT NULL,
    ALTER COLUMN body_key_version SET NOT NULL;

  ALTER TABLE public.user_saved_path_notes
    ADD CONSTRAINT ck_user_saved_path_notes_encrypted_only
    CHECK (body_key_version > 0);

  ALTER TABLE public.user_saved_path_notes
    DROP COLUMN body;
END $$;
