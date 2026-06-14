// Shared seed helper — loads .env.local and exposes the admin (service role) client.
// Server-side only. Never import this into application or client code.
import { config } from 'dotenv';
import { resolve } from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Load local env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
config({ path: resolve(process.cwd(), '.env.local') });

export function seedClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
    );
    process.exit(1);
  }

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Generic seeder for simple canonical tables (occupations, industries, fields).
// Idempotent: relies on the table's UNIQUE(name_en) constraint with ignoreDuplicates.
export async function seedCanonicalTable(
  admin: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  const chunkSize = 100;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await admin
      .from(table)
      .upsert(chunk, { onConflict: 'name_en', ignoreDuplicates: true, count: 'exact' });

    if (error) {
      console.error(`  ! Chunk ${i / chunkSize + 1} failed: ${error.message}`);
      skipped += chunk.length;
    } else {
      const c = count ?? 0;
      inserted += c;
      skipped += chunk.length - c;
      console.log(`  + Chunk ${i / chunkSize + 1}: ${c} inserted`);
    }
  }

  return { inserted, skipped };
}

// Write a summary audit log entry on seed completion.
export async function writeSeedAudit(
  admin: SupabaseClient,
  resource: string,
  inserted: number,
  skipped: number,
): Promise<void> {
  const { error } = await admin.from('audit_logs').insert({
    user_id: null,
    user_role: 'super_admin',
    action: 'REFERENCE_DATA_SEEDED',
    resource,
    metadata: { inserted, skipped, seeded_at: new Date().toISOString() },
  });
  if (error) {
    console.warn(`  ! Audit log write failed: ${error.message}`);
  }
}
