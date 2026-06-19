// Platform-wide user management (Mission 006-C, Bug B2). Super-admin only.
import type { PlatformRole } from '@/lib/services/auth/auth.types';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  tenantId: string | null;
  tenantName: string | null;
  embassyNames: string[];
  diplomaticTitle: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformUserFilters {
  tenantId?: string;
  role?: PlatformRole;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface PlatformUserStats {
  total: number;
  superAdmins: number;
  tenantAdmins: number;
  staff: number;
  registrants: number;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: PlatformRole;
  tenant_id: string | null;
  diplomatic_title: string | null;
  is_active: boolean;
  created_at: string;
}

const STAFF_ROLES: PlatformRole[] = ['embassy_admin', 'consular_officer', 'analyst', 'executive_viewer', 'economic_planner'];

export async function getPlatformUsers(filters: PlatformUserFilters = {}): Promise<PlatformUser[]> {
  const admin = createAdminClient();

  let q = admin
    .from('profiles')
    .select('id, email, full_name, role, tenant_id, diplomatic_title, is_active, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.tenantId) q = q.eq('tenant_id', filters.tenantId);
  if (filters.role) q = q.eq('role', filters.role);
  if (filters.status === 'active') q = q.eq('is_active', true);
  if (filters.status === 'inactive') q = q.eq('is_active', false);
  if (filters.search) q = q.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);

  const { data } = await q.limit(500);
  const rows = (data as ProfileRow[]) ?? [];
  if (rows.length === 0) return [];

  // Tenant names.
  const { data: tenants } = await admin.from('civis_tenants').select('id, name');
  const tenantName = new Map<string, string>();
  for (const t of (tenants as { id: string; name: string }[]) ?? []) tenantName.set(t.id, t.name);

  // Embassy assignments.
  const { data: staff } = await admin
    .from('civis_embassy_staff')
    .select('user_id, is_active, civis_embassies(name)')
    .in('user_id', rows.map((r) => r.id));
  const embassiesByUser = new Map<string, string[]>();
  for (const s of (staff as unknown as { user_id: string; is_active: boolean; civis_embassies: { name: string } | null }[]) ?? []) {
    if (!s.is_active || !s.civis_embassies) continue;
    const list = embassiesByUser.get(s.user_id) ?? [];
    list.push(s.civis_embassies.name);
    embassiesByUser.set(s.user_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    tenantId: r.tenant_id,
    tenantName: r.tenant_id ? (tenantName.get(r.tenant_id) ?? null) : null,
    embassyNames: embassiesByUser.get(r.id) ?? [],
    diplomaticTitle: r.diplomatic_title,
    isActive: r.is_active,
    createdAt: r.created_at,
  }));
}

export async function getPlatformUserStats(): Promise<PlatformUserStats> {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('role').is('deleted_at', null);
  const rows = (data as { role: PlatformRole }[]) ?? [];
  return {
    total: rows.length,
    superAdmins: rows.filter((r) => r.role === 'super_admin').length,
    tenantAdmins: rows.filter((r) => r.role === 'tenant_admin').length,
    staff: rows.filter((r) => STAFF_ROLES.includes(r.role)).length,
    registrants: rows.filter((r) => r.role === 'registrant').length,
  };
}

export interface UpdatePlatformUserInput {
  fullName?: string;
  role?: PlatformRole;
  tenantId?: string | null;
  diplomaticTitle?: string | null;
}

export async function updatePlatformUser(
  userId: string,
  input: UpdatePlatformUserInput,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.role !== undefined) updates.role = input.role;
  if (input.tenantId !== undefined) updates.tenant_id = input.tenantId;
  if (input.diplomaticTitle !== undefined) updates.diplomatic_title = input.diplomaticTitle;

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'PLATFORM_USER_UPDATED',
    resource: 'profiles',
    resource_id: userId,
    metadata: { fields: Object.keys(updates) },
  });

  const { error } = await admin.from('profiles').update(updates).eq('id', userId);
  return { error: error?.message ?? null };
}

export async function setPlatformUserActive(
  userId: string,
  isActive: boolean,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: isActive ? 'PLATFORM_USER_REACTIVATED' : 'PLATFORM_USER_DEACTIVATED',
    resource: 'profiles',
    resource_id: userId,
  });
  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId);
  return { error: error?.message ?? null };
}

export async function resetPlatformUserPassword(
  userId: string,
  email: string,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'PLATFORM_USER_PASSWORD_RESET',
    resource: 'profiles',
    resource_id: userId,
    metadata: { email },
  });
  const { error } = await admin.auth.resetPasswordForEmail(email);
  return { error: error?.message ?? null };
}

// Last 10 audit entries for a user (slide-over detail).
export async function getUserRecentActivity(userId: string): Promise<{ action: string; createdAt: string }[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('audit_logs')
    .select('action, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  return ((data as { action: string; created_at: string }[]) ?? []).map((a) => ({ action: a.action, createdAt: a.created_at }));
}
