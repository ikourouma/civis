// Staff provisioning + management for Tenant Admins (and Embassy Admins for a
// scoped subset). Uses the admin client; every function guards on the caller's
// role and tenant. Service-layer enforcement mirrors the DB provisioning guard.
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export type StaffRole = 'embassy_admin' | 'consular_officer' | 'analyst' | 'executive_viewer';

const PROVISIONABLE_ROLES: StaffRole[] = [
  'embassy_admin',
  'consular_officer',
  'analyst',
  'executive_viewer',
];

export interface StaffMember {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  diplomaticTitle: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
  embassyId: string | null;
  embassyName: string | null;
}

export interface ProvisionStaffInput {
  email: string;
  fullName: string;
  role: StaffRole;
  embassyId?: string;
  diplomaticTitle?: string;
  sendWelcomeEmail: boolean;
}

export interface StaffFilters {
  role?: string;
  embassyId?: string;
  isActive?: boolean;
  search?: string;
}

function tempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 18; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function provisionStaffMember(
  input: ProvisionStaffInput,
): Promise<{ user: { id: string; email: string; role: string } | null; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller) return { user: null, error: 'Unauthorized' };
  if (!['tenant_admin', 'super_admin'].includes(caller.role)) {
    return { user: null, error: 'Insufficient permissions' };
  }
  if (!PROVISIONABLE_ROLES.includes(input.role)) {
    return { user: null, error: `Cannot provision role: ${input.role}` };
  }
  if (!caller.tenantId) return { user: null, error: 'No tenant context' };

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: tempPassword(),
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: input.role },
  });

  if (authError || !authData?.user) {
    const msg = authError?.message?.toLowerCase().includes('already')
      ? 'A user with this email already exists.'
      : authError?.message ?? 'Failed to create staff account.';
    return { user: null, error: msg };
  }

  const userId = authData.user.id;

  await admin.from('profiles').upsert(
    {
      id: userId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      tenant_id: caller.tenantId,
      diplomatic_title: input.diplomaticTitle ?? null,
    },
    { onConflict: 'id' },
  );

  if (input.embassyId) {
    await admin.from('civis_embassy_staff').upsert(
      {
        tenant_id: caller.tenantId,
        embassy_id: input.embassyId,
        user_id: userId,
        role: input.role,
        is_active: true,
        assigned_by: caller.id,
      },
      { onConflict: 'embassy_id,user_id' },
    );
  }

  if (input.sendWelcomeEmail) {
    try {
      await admin.auth.resetPasswordForEmail(input.email);
    } catch {
      // Best-effort — depends on SMTP configuration.
    }
  }

  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_PROVISIONED',
    resource: 'profiles',
    resource_id: userId,
    metadata: { email: input.email, role: input.role, embassy: input.embassyId ?? null, provisioned_by: caller.email },
  });

  return { user: { id: userId, email: input.email, role: input.role }, error: null };
}

export async function updateStaffRole(
  userId: string,
  newRole: StaffRole,
): Promise<{ success: boolean; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller) return { success: false, error: 'Unauthorized' };
  if (!['tenant_admin', 'super_admin'].includes(caller.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  if (!PROVISIONABLE_ROLES.includes(newRole)) {
    return { success: false, error: `Cannot assign role: ${newRole}` };
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('email, role, tenant_id').eq('id', userId).maybeSingle();
  if (!target) return { success: false, error: 'User not found' };
  if (caller.role === 'tenant_admin' && target.tenant_id !== caller.tenantId) {
    return { success: false, error: 'Cannot modify users in another tenant' };
  }

  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_ROLE_CHANGED',
    resource: 'profiles',
    resource_id: userId,
    metadata: { email: target.email, old_role: target.role, new_role: newRole, changed_by: caller.email },
  });

  const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', userId);
  return { success: !error, error: error?.message ?? null };
}

export async function deactivateStaffMember(
  userId: string,
  reason: string,
): Promise<{ success: boolean; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller || !['tenant_admin', 'super_admin'].includes(caller.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('email, tenant_id').eq('id', userId).maybeSingle();
  if (!target) return { success: false, error: 'User not found' };
  if (caller.role === 'tenant_admin' && target.tenant_id !== caller.tenantId) {
    return { success: false, error: 'Cannot modify users in another tenant' };
  }

  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_DEACTIVATED',
    resource: 'profiles',
    resource_id: userId,
    metadata: { email: target.email, reason, deactivated_by: caller.email },
  });

  const { error } = await admin.from('profiles').update({ is_active: false }).eq('id', userId);
  return { success: !error, error: error?.message ?? null };
}

export async function reactivateStaffMember(
  userId: string,
): Promise<{ success: boolean; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller || !['tenant_admin', 'super_admin'].includes(caller.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('email, tenant_id').eq('id', userId).maybeSingle();
  if (!target) return { success: false, error: 'User not found' };
  if (caller.role === 'tenant_admin' && target.tenant_id !== caller.tenantId) {
    return { success: false, error: 'Cannot modify users in another tenant' };
  }

  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_REACTIVATED',
    resource: 'profiles',
    resource_id: userId,
    metadata: { email: target.email, reactivated_by: caller.email },
  });

  const { error } = await admin.from('profiles').update({ is_active: true }).eq('id', userId);
  return { success: !error, error: error?.message ?? null };
}

export async function resetStaffPassword(
  userId: string,
): Promise<{ success: boolean; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller || !['tenant_admin', 'super_admin'].includes(caller.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('email, tenant_id').eq('id', userId).maybeSingle();
  if (!target) return { success: false, error: 'User not found' };
  if (caller.role === 'tenant_admin' && target.tenant_id !== caller.tenantId) {
    return { success: false, error: 'Cannot modify users in another tenant' };
  }

  try {
    await admin.auth.resetPasswordForEmail(target.email as string);
  } catch {
    // Best-effort.
  }

  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_PASSWORD_RESET',
    resource: 'profiles',
    resource_id: userId,
    metadata: { email: target.email, reset_by: caller.email },
  });
  return { success: true, error: null };
}

// All staff for the caller's tenant (profiles + embassy assignment), with filters.
export async function getTenantStaff(filters?: StaffFilters): Promise<StaffMember[]> {
  const caller = await getCurrentUser();
  if (!caller?.tenantId) return [];
  const admin = createAdminClient();

  let q = admin
    .from('profiles')
    .select('id, email, full_name, role, diplomatic_title, is_active, last_sign_in_at')
    .eq('tenant_id', caller.tenantId)
    .neq('role', 'registrant')
    .is('deleted_at', null)
    .order('full_name');

  if (filters?.role) q = q.eq('role', filters.role);
  if (filters?.isActive !== undefined) q = q.eq('is_active', filters.isActive);
  if (filters?.search) q = q.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);

  const { data: profiles } = await q;
  if (!profiles) return [];

  // Embassy assignments for these users
  const ids = (profiles as { id: string }[]).map((p) => p.id);
  const { data: assignments } = await admin
    .from('civis_embassy_staff')
    .select('user_id, embassy_id, is_active, civis_embassies(name)')
    .in('user_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
    .eq('is_active', true);

  const byUser = new Map<string, { embassyId: string; embassyName: string | null }>();
  for (const a of (assignments as unknown as { user_id: string; embassy_id: string; civis_embassies: { name: string } | null }[]) ?? []) {
    byUser.set(a.user_id, { embassyId: a.embassy_id, embassyName: a.civis_embassies?.name ?? null });
  }

  let members = (profiles as {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    diplomatic_title: string | null;
    is_active: boolean;
    last_sign_in_at: string | null;
  }[]).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    diplomaticTitle: p.diplomatic_title,
    isActive: p.is_active,
    lastSignInAt: p.last_sign_in_at,
    embassyId: byUser.get(p.id)?.embassyId ?? null,
    embassyName: byUser.get(p.id)?.embassyName ?? null,
  }));

  if (filters?.embassyId) members = members.filter((m) => m.embassyId === filters.embassyId);
  return members;
}

// Tenant staff not yet assigned to any embassy (for assignment pickers).
export async function getUnassignedStaff(): Promise<StaffMember[]> {
  const all = await getTenantStaff({ isActive: true });
  return all.filter((m) => !m.embassyId);
}

export interface StaffStats {
  total: number;
  embassyAdmins: number;
  consularOfficers: number;
  analysts: number;
}

export async function getStaffStats(): Promise<StaffStats> {
  const all = await getTenantStaff();
  return {
    total: all.length,
    embassyAdmins: all.filter((m) => m.role === 'embassy_admin').length,
    consularOfficers: all.filter((m) => m.role === 'consular_officer').length,
    analysts: all.filter((m) => m.role === 'analyst').length,
  };
}
