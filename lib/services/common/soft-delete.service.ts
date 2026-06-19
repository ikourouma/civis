// Soft-delete infrastructure (Mission 006-C). Rows are never hard-deleted —
// `deleted_at` is stamped and normal queries filter on `deleted_at IS NULL`.
import { createAdminClient } from '@/lib/supabase/admin';

export type SoftDeletableTable =
  | 'civis_tenants'
  | 'civis_embassies'
  | 'civis_registrants'
  | 'profiles'
  | 'civis_registrant_documents'
  | 'civis_registrant_notes';

export async function softDelete(
  table: SoftDeletableTable,
  id: string,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'RECORD_SOFT_DELETED',
    resource: table,
    resource_id: id,
  });
  const { error } = await admin.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function restore(
  table: SoftDeletableTable,
  id: string,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'RECORD_RESTORED',
    resource: table,
    resource_id: id,
  });
  const { error } = await admin.from(table).update({ deleted_at: null }).eq('id', id);
  return { error: error?.message ?? null };
}
