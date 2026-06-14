'use server';

// Server Actions for reference-data mutations that require elevated privileges:
//  - submitSuggestion: insert into civis_registry_suggestions (+ audit), resolving
//    tenant + email from the authenticated session.
//  - incrementUsage: bump usage_count on a canonical record (admin client; users
//    cannot UPDATE canonical tables under RLS).
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/services/auth';
import type { ReferenceCategory } from './autocomplete.service';

const CANONICAL_TABLE: Record<ReferenceCategory, string | null> = {
  occupation: 'civis_occupations',
  industry: 'civis_industries',
  field_of_study: 'civis_fields_of_study',
  diaspora_association: 'civis_diaspora_associations',
  employer: null,
};

export async function submitSuggestion(
  category: ReferenceCategory,
  value: string,
  context: string,
  language: 'en' | 'fr' = 'en',
): Promise<{ suggestionId: string | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { suggestionId: null, error: 'Unauthorized' };

  const trimmed = value.trim();
  if (!trimmed) return { suggestionId: null, error: 'Empty value' };

  const admin = createAdminClient();

  // Audit BEFORE the mutation returns success (mission rule).
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'SUGGESTION_SUBMITTED',
    resource: 'civis_registry_suggestions',
    metadata: { category, value: trimmed, context },
  });

  const { data, error } = await admin
    .from('civis_registry_suggestions')
    .insert({
      tenant_id: user.tenantId,
      suggested_by: user.id,
      suggested_by_email: user.email,
      category,
      suggested_value: trimmed,
      language,
      context,
      status: 'pending_review',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { suggestionId: null, error: error?.message ?? 'Failed to record suggestion' };
  }

  return { suggestionId: data.id, error: null };
}

export async function incrementUsage(
  category: ReferenceCategory,
  id: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const table = CANONICAL_TABLE[category];
  if (!table) return { error: null }; // employer has no canonical table — no-op

  const admin = createAdminClient();

  // Read current count then increment (no RPC dependency).
  const { data: current } = await admin.from(table).select('usage_count').eq('id', id).single();
  const next = ((current?.usage_count as number | undefined) ?? 0) + 1;

  const { error } = await admin.from(table).update({ usage_count: next }).eq('id', id);
  return { error: error?.message ?? null };
}
