'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { checkCapability } from '@/lib/entitlements/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  exportAuditCSV,
  getAuditLog,
  getAuditStats,
  type AuditFilters,
  type AuditScope,
  type AuditStats,
} from './audit.service';

// Resolve the scope a user is allowed to query: tenant/embassy admins are
// hard-scoped to their tenant; super admins see everything (optionally filtered).
function scopeForUser(role: string, tenantId: string | null): AuditScope {
  if (role === 'super_admin') return {};
  return { tenantId: tenantId ?? '__none__' };
}

// Audit viewing is permitted by AUDIT_VIEW_TENANT or AUDIT_VIEW_EMBASSY.
async function canViewAudit(role: string): Promise<{ allowed: boolean; error?: string }> {
  if (role === 'super_admin') return { allowed: true };
  const [tenantCap, embassyCap] = await Promise.all([
    checkCapability('AUDIT_VIEW_TENANT'),
    checkCapability('AUDIT_VIEW_EMBASSY'),
  ]);
  if (tenantCap.allowed || embassyCap.allowed) return { allowed: true };
  return { allowed: false, error: tenantCap.error };
}

export async function loadAuditPageAction(
  filters: AuditFilters,
  page: number,
): Promise<{ entries: Awaited<ReturnType<typeof getAuditLog>>['entries']; total: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { entries: [], total: 0, error: 'Unauthorized' };
  const cap = await canViewAudit(user.role);
  if (!cap.allowed) return { entries: [], total: 0, error: cap.error };
  const scope = scopeForUser(user.role, user.tenantId);
  const { entries, total } = await getAuditLog(scope, filters, { page, pageSize: 50 });
  return { entries, total };
}

export async function loadAuditStatsAction(
  filters: AuditFilters,
): Promise<{ stats?: AuditStats; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };
  const cap = await canViewAudit(user.role);
  if (!cap.allowed) return { error: cap.error };
  const scope = scopeForUser(user.role, user.tenantId);
  const stats = await getAuditStats(scope, filters);
  return { stats };
}

export async function exportAuditAction(
  filters: AuditFilters,
): Promise<{ csv?: string; rowCount?: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };
  const cap = await checkCapability('AUDIT_EXPORT');
  if (user.role !== 'super_admin' && !cap.allowed) return { error: cap.error };

  const scope = scopeForUser(user.role, user.tenantId);

  // Meta-audit: exporting the audit log is itself audited.
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: user.role === 'super_admin' ? 'PLATFORM_AUDIT_EXPORTED' : 'AUDIT_EXPORTED',
    resource: 'audit_logs',
    metadata: { filters_applied: filters },
  });

  const { csv, rowCount } = await exportAuditCSV(scope, filters);
  return { csv, rowCount };
}

// Records that a super admin viewed the platform audit log (full accountability).
export async function recordPlatformAuditView(filters: AuditFilters): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return;
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'PLATFORM_AUDIT_VIEWED',
    resource: 'audit_logs',
    metadata: { filters_applied: filters },
  });
}
