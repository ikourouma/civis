// Portal carousel messages — per-tenant, localized, tenant-admin editable.
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PortalMessage {
  id: string;
  tenantId: string;
  headlineEn: string;
  headlineFr: string | null;
  subtitleEn: string | null;
  subtitleFr: string | null;
  sortOrder: number;
  isActive: boolean;
}

// A localized slide for the public carousel.
export interface PortalSlide {
  id: string;
  headline: string;
  subtitle: string | null;
}

interface MessageRow {
  id: string;
  tenant_id: string;
  headline_en: string;
  headline_fr: string | null;
  subtitle_en: string | null;
  subtitle_fr: string | null;
  sort_order: number;
  is_active: boolean;
}

function mapMessage(row: MessageRow): PortalMessage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    headlineEn: row.headline_en,
    headlineFr: row.headline_fr,
    subtitleEn: row.subtitle_en,
    subtitleFr: row.subtitle_fr,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

const COLUMNS = 'id, tenant_id, headline_en, headline_fr, subtitle_en, subtitle_fr, sort_order, is_active';

// Active, localized slides for the public portal (sorted by sort_order).
export async function getPortalMessages(tenantId: string, locale: 'en' | 'fr'): Promise<PortalSlide[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_portal_messages')
    .select(COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return ((data as MessageRow[]) ?? []).map((row) => {
    const m = mapMessage(row);
    return {
      id: m.id,
      headline: (locale === 'fr' ? m.headlineFr : m.headlineEn) || m.headlineEn,
      subtitle: (locale === 'fr' ? m.subtitleFr : m.subtitleEn) || m.subtitleEn,
    };
  });
}

// All messages for the tenant-admin editor (both languages, active + inactive).
export async function getTenantPortalMessages(tenantId: string): Promise<PortalMessage[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_portal_messages')
    .select(COLUMNS)
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true });
  return ((data as MessageRow[]) ?? []).map(mapMessage);
}

export interface PortalMessageInput {
  headlineEn: string;
  headlineFr?: string;
  subtitleEn?: string;
  subtitleFr?: string;
}

async function audit(action: string, tenantId: string, resourceId: string | null, meta: Record<string, unknown>) {
  const user = await getCurrentUser();
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user?.id ?? null,
    user_role: user?.role ?? null,
    action,
    resource: 'civis_portal_messages',
    resource_id: resourceId,
    metadata: { tenant_id: tenantId, ...meta },
  });
}

export async function createPortalMessage(
  tenantId: string,
  data: PortalMessageInput,
): Promise<{ id: string | null; error: string | null }> {
  const admin = createAdminClient();
  // Append at the end.
  const { count } = await admin
    .from('civis_portal_messages')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  const { data: row, error } = await admin
    .from('civis_portal_messages')
    .insert({
      tenant_id: tenantId,
      headline_en: data.headlineEn,
      headline_fr: data.headlineFr ?? null,
      subtitle_en: data.subtitleEn ?? null,
      subtitle_fr: data.subtitleFr ?? null,
      sort_order: (count ?? 0) + 1,
    })
    .select('id')
    .single();
  if (error || !row) return { id: null, error: error?.message ?? 'Failed to create message' };
  await audit('PORTAL_MESSAGE_CREATED', tenantId, row.id, {});
  return { id: row.id, error: null };
}

export async function updatePortalMessage(
  tenantId: string,
  id: string,
  data: PortalMessageInput,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('civis_portal_messages')
    .update({
      headline_en: data.headlineEn,
      headline_fr: data.headlineFr ?? null,
      subtitle_en: data.subtitleEn ?? null,
      subtitle_fr: data.subtitleFr ?? null,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (!error) await audit('PORTAL_MESSAGE_UPDATED', tenantId, id, {});
  return { error: error?.message ?? null };
}

// Soft delete — mark inactive (preserves audit trail).
export async function deletePortalMessage(tenantId: string, id: string): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('civis_portal_messages')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (!error) await audit('PORTAL_MESSAGE_DELETED', tenantId, id, {});
  return { error: error?.message ?? null };
}

export async function reorderPortalMessages(tenantId: string, orderedIds: string[]): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  for (let i = 0; i < orderedIds.length; i++) {
    await admin
      .from('civis_portal_messages')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i]!)
      .eq('tenant_id', tenantId);
  }
  await audit('PORTAL_MESSAGES_REORDERED', tenantId, null, { order: orderedIds });
  return { error: null };
}
