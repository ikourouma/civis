'use server';

// Reference-data administration — super-admin only. All mutations write audit logs.
// Uses the admin (service role) client because canonical tables are not user-writable
// under RLS. Every function guards on the authenticated user's role.
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CATEGORY_TABLE,
  TAB_TABLE,
  type CanonicalEntry,
  type CanonicalTab,
  type RegistrySuggestion,
  type SuggestionCategory,
  type SuggestionFilters,
} from './reference-management.types';

interface SuggestionRow {
  id: string;
  tenant_id: string | null;
  suggested_by: string | null;
  suggested_by_email: string | null;
  category: SuggestionCategory;
  suggested_value: string;
  language: string;
  context: string | null;
  status: RegistrySuggestion['status'];
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  merged_into_table: string | null;
  merged_into_id: string | null;
  created_at: string;
  civis_tenants?: { name: string } | null;
}

function mapSuggestion(row: SuggestionRow): RegistrySuggestion {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.civis_tenants?.name ?? null,
    suggestedBy: row.suggested_by,
    suggestedByEmail: row.suggested_by_email,
    category: row.category,
    suggestedValue: row.suggested_value,
    language: row.language,
    context: row.context,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewerNotes: row.reviewer_notes,
    mergedIntoTable: row.merged_into_table,
    mergedIntoId: row.merged_into_id,
    createdAt: row.created_at,
  };
}

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;
  return user;
}

export async function getPendingSuggestions(
  filters?: SuggestionFilters,
): Promise<RegistrySuggestion[]> {
  const user = await requireSuperAdmin();
  if (!user) return [];

  const admin = createAdminClient();
  let q = admin
    .from('civis_registry_suggestions')
    .select('*, civis_tenants(name)')
    .order('created_at', { ascending: false });

  q = q.eq('status', filters?.status ?? 'pending_review');
  if (filters?.category) q = q.eq('category', filters.category);
  if (filters?.tenantId) q = q.eq('tenant_id', filters.tenantId);
  if (filters?.query) q = q.ilike('suggested_value', `%${filters.query}%`);

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as SuggestionRow[]).map(mapSuggestion);
}

export async function getSuggestionCounts(): Promise<{ pending: number }> {
  const user = await requireSuperAdmin();
  if (!user) return { pending: 0 };

  const admin = createAdminClient();
  const { count } = await admin
    .from('civis_registry_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_review');

  return { pending: count ?? 0 };
}

export async function getCanonicalList(
  tab: CanonicalTab,
  query?: string,
): Promise<CanonicalEntry[]> {
  const user = await requireSuperAdmin();
  if (!user) return [];

  const admin = createAdminClient();
  const table = TAB_TABLE[tab];

  if (tab === 'countries') {
    let q = admin
      .from(table)
      .select('id, country_name_en, country_name_fr, flag_emoji, iso_code_alpha2, region, is_au_member')
      .order('country_name_en')
      .limit(300);
    if (query) q = q.ilike('country_name_en', `%${query}%`);
    const { data } = await q;
    return ((data as Record<string, unknown>[]) ?? []).map((r) => ({
      id: r.id as string,
      nameEn: r.country_name_en as string,
      nameFr: r.country_name_fr as string,
      category: r.region as string | null,
      usageCount: 0,
      flagEmoji: r.flag_emoji as string,
      isoCode: r.iso_code_alpha2 as string,
      isAUMember: r.is_au_member as boolean,
    }));
  }

  if (tab === 'education') {
    const { data } = await admin
      .from(table)
      .select('id, name_en, name_fr, level_order')
      .order('level_order');
    return ((data as Record<string, unknown>[]) ?? []).map((r) => ({
      id: r.id as string,
      nameEn: r.name_en as string,
      nameFr: r.name_fr as string,
      category: null,
      usageCount: 0,
      levelOrder: r.level_order as number,
    }));
  }

  // occupations / industries / fields / associations
  const hasCategory = tab === 'occupations' || tab === 'fields';
  const hasNaics = tab === 'industries';
  const cols = [
    'id',
    'name_en',
    'name_fr',
    'usage_count',
    hasCategory ? 'category' : null,
    hasNaics ? 'naics_code' : null,
    tab === 'associations' ? 'country_code' : null,
  ]
    .filter(Boolean)
    .join(', ');

  let q = admin.from(table).select(cols).order('usage_count', { ascending: false }).limit(500);
  if (query) q = q.ilike('name_en', `%${query}%`);
  const { data } = await q;

  return ((data as unknown as Record<string, unknown>[]) ?? []).map((r) => ({
    id: r.id as string,
    nameEn: r.name_en as string,
    nameFr: (r.name_fr as string | null) ?? null,
    category: (r.category as string | null) ?? null,
    usageCount: (r.usage_count as number | undefined) ?? 0,
    naicsCode: (r.naics_code as string | null) ?? null,
    countryCode: (r.country_code as string | null) ?? null,
  }));
}

export async function approveSuggestion(
  suggestionId: string,
  reviewerNotes?: string,
): Promise<{ canonicalId: string | null; error: string | null }> {
  const user = await requireSuperAdmin();
  if (!user) return { canonicalId: null, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { data: sug } = await admin
    .from('civis_registry_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();

  if (!sug) return { canonicalId: null, error: 'Suggestion not found' };

  const row = sug as SuggestionRow;
  const table = CATEGORY_TABLE[row.category];

  // Audit BEFORE mutation
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'SUGGESTION_APPROVED',
    resource: table ?? 'civis_registry_suggestions',
    resource_id: suggestionId,
    metadata: { value: row.suggested_value, category: row.category },
  });

  let canonicalId: string | null = null;

  if (table) {
    const insertRow: Record<string, unknown> = {
      name_en: row.suggested_value,
      is_canonical: true,
    };
    if (row.category === 'diaspora_association') {
      insertRow.tenant_id = row.tenant_id;
    }

    const { data: created, error: insErr } = await admin
      .from(table)
      .upsert(insertRow, { onConflict: 'name_en', ignoreDuplicates: false })
      .select('id')
      .single();

    if (insErr || !created) {
      return { canonicalId: null, error: insErr?.message ?? 'Failed to create canonical entry' };
    }
    canonicalId = created.id;
  }

  const { error: updErr } = await admin
    .from('civis_registry_suggestions')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
      merged_into_table: table,
      merged_into_id: canonicalId,
    })
    .eq('id', suggestionId);

  if (updErr) return { canonicalId, error: updErr.message };

  revalidatePath('/admin/reference-data');
  return { canonicalId, error: null };
}

export async function rejectSuggestion(
  suggestionId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: 'Unauthorized' };
  if (!reason.trim()) return { error: 'A reason is required' };

  const admin = createAdminClient();

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'SUGGESTION_REJECTED',
    resource: 'civis_registry_suggestions',
    resource_id: suggestionId,
    metadata: { reason },
  });

  const { error } = await admin
    .from('civis_registry_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reason,
    })
    .eq('id', suggestionId);

  if (error) return { error: error.message };
  revalidatePath('/admin/reference-data');
  return { error: null };
}

export async function mergeSuggestion(
  suggestionId: string,
  targetCanonicalId: string,
  reviewerNotes?: string,
): Promise<{ error: string | null }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();
  const { data: sug } = await admin
    .from('civis_registry_suggestions')
    .select('category')
    .eq('id', suggestionId)
    .single();

  if (!sug) return { error: 'Suggestion not found' };
  const table = CATEGORY_TABLE[(sug as { category: SuggestionCategory }).category];

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'SUGGESTION_MERGED',
    resource: table ?? 'civis_registry_suggestions',
    resource_id: suggestionId,
    metadata: { merged_into_id: targetCanonicalId },
  });

  const { error } = await admin
    .from('civis_registry_suggestions')
    .update({
      status: 'merged',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
      merged_into_table: table,
      merged_into_id: targetCanonicalId,
    })
    .eq('id', suggestionId);

  if (error) return { error: error.message };
  revalidatePath('/admin/reference-data');
  return { error: null };
}

export async function addCanonicalEntry(
  tab: CanonicalTab,
  data: { nameEn: string; nameFr?: string; category?: string; naicsCode?: string; levelOrder?: number },
): Promise<{ id: string | null; error: string | null }> {
  const user = await requireSuperAdmin();
  if (!user) return { id: null, error: 'Unauthorized' };
  if (!data.nameEn.trim()) return { id: null, error: 'Name is required' };

  const admin = createAdminClient();
  const table = TAB_TABLE[tab];

  const insertRow: Record<string, unknown> = { name_en: data.nameEn.trim() };
  if (tab === 'countries') {
    return { id: null, error: 'Countries are managed via ISO seed, not manual entry' };
  }
  if (data.nameFr) insertRow.name_fr = data.nameFr.trim();
  if (tab === 'occupations' || tab === 'fields') insertRow.category = data.category ?? null;
  if (tab === 'industries') insertRow.naics_code = data.naicsCode ?? null;
  if (tab === 'education') insertRow.level_order = data.levelOrder ?? 99;
  if (tab !== 'education') insertRow.is_canonical = true;

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'CANONICAL_ENTRY_ADDED',
    resource: table,
    metadata: { name_en: data.nameEn },
  });

  const { data: created, error } = await admin
    .from(table)
    .upsert(insertRow, { onConflict: 'name_en', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error || !created) return { id: null, error: error?.message ?? 'Failed to add entry' };

  revalidatePath('/admin/reference-data');
  return { id: created.id, error: null };
}

export async function deleteCanonicalEntry(
  tab: CanonicalTab,
  id: string,
): Promise<{ error: string | null }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: 'Unauthorized' };
  if (tab === 'countries' || tab === 'education') {
    return { error: 'This list is fixed and cannot be modified' };
  }

  const admin = createAdminClient();
  const table = TAB_TABLE[tab];

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'CANONICAL_ENTRY_DELETED',
    resource: table,
    resource_id: id,
  });

  const { error } = await admin.from(table).delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/reference-data');
  return { error: null };
}
