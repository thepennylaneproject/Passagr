import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { encryptForUser } from '../src/server/crypto/envelope';

const BATCH_SIZE = Number.parseInt(process.env.NOTES_BACKFILL_BATCH_SIZE || '100', 10);

type LegacyNoteRow = {
  id: string;
  user_id: string;
  body: string;
};

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let totalUpdated = 0;

  while (true) {
    const { data, error } = await supabase
      .from('user_saved_path_notes')
      .select('id, user_id, body')
      .is('deleted_at', null)
      .not('body', 'is', null)
      .or('body_ciphertext.is.null,body_nonce.is.null,body_key_version.is.null')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as LegacyNoteRow[];
    if (!batch.length) {
      break;
    }

    for (const row of batch) {
      const encrypted = await encryptForUser(row.user_id, row.body);
      const { error: updateError } = await supabase
        .from('user_saved_path_notes')
        .update({
          body_ciphertext: toByteaLiteral(encrypted.ciphertext),
          body_nonce: toByteaLiteral(encrypted.nonce),
          body_key_version: encrypted.key_version,
        })
        .eq('id', row.id)
        .eq('user_id', row.user_id);

      if (updateError) {
        throw updateError;
      }

      totalUpdated += 1;
    }

    console.log(`Backfilled ${totalUpdated} notes...`);
  }

  console.log(`Done. Total notes backfilled: ${totalUpdated}`);
}

function toByteaLiteral(base64: string): string {
  return `\\x${Buffer.from(base64, 'base64').toString('hex')}`;
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
