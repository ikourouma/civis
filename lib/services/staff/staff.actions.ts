'use server';

import { revalidatePath } from 'next/cache';

import {
  deactivateStaffMember,
  provisionStaffMember,
  reactivateStaffMember,
  resetStaffPassword,
  updateStaffRole,
  type ProvisionStaffInput,
  type StaffRole,
} from './staff.service';
import { assignStaffToEmbassy } from '@/lib/services/embassies';
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

function revalidateStaff() {
  revalidatePath('/workspace/users');
  revalidatePath('/workspace/embassy/staff');
}

export async function provisionStaffAction(input: ProvisionStaffInput) {
  const result = await provisionStaffMember(input);
  if (result.user) revalidateStaff();
  return result;
}

export async function updateStaffRoleAction(userId: string, newRole: StaffRole) {
  const result = await updateStaffRole(userId, newRole);
  if (result.success) revalidateStaff();
  return result;
}

export async function deactivateStaffAction(userId: string, reason: string) {
  const result = await deactivateStaffMember(userId, reason);
  if (result.success) revalidateStaff();
  return result;
}

export async function reactivateStaffAction(userId: string) {
  const result = await reactivateStaffMember(userId);
  if (result.success) revalidateStaff();
  return result;
}

export async function resetStaffPasswordAction(userId: string) {
  return resetStaffPassword(userId);
}

// Assign an existing tenant user to an embassy.
//  - tenant_admin: any tenant user, any role
//  - embassy_admin: own embassy only, consular_officer only
export async function assignStaffAction(
  userId: string,
  embassyId: string,
  role: StaffRole,
): Promise<{ success: boolean; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller || !caller.tenantId) return { success: false, error: 'Unauthorized' };

  if (caller.role === 'embassy_admin') {
    if (!caller.embassyIds.includes(embassyId)) {
      return { success: false, error: 'You can only assign staff to your own embassy.' };
    }
    if (role !== 'consular_officer') {
      return { success: false, error: 'Embassy admins can only assign Consular Officers.' };
    }
  } else if (!['tenant_admin', 'super_admin'].includes(caller.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const { error } = await assignStaffToEmbassy(userId, embassyId, role, caller.tenantId, caller.id);
  if (error) return { success: false, error };

  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle();
  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_EMBASSY_ASSIGNED',
    resource: 'civis_embassy_staff',
    resource_id: embassyId,
    metadata: { email: target?.email, embassy_id: embassyId, role, assigned_by: caller.email },
  });

  revalidateStaff();
  return { success: true, error: null };
}

// Unassign a user from an embassy (deactivate the assignment row).
export async function unassignStaffAction(
  userId: string,
  embassyId: string,
): Promise<{ success: boolean; error: string | null }> {
  const caller = await getCurrentUser();
  if (!caller) return { success: false, error: 'Unauthorized' };
  if (caller.role === 'embassy_admin' && !caller.embassyIds.includes(embassyId)) {
    return { success: false, error: 'You can only manage your own embassy.' };
  }
  if (!['tenant_admin', 'super_admin', 'embassy_admin'].includes(caller.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('civis_embassy_staff')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('embassy_id', embassyId);
  if (error) return { success: false, error: error.message };

  const { data: target } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle();
  await admin.from('audit_logs').insert({
    user_id: caller.id,
    user_role: caller.role,
    action: 'STAFF_EMBASSY_UNASSIGNED',
    resource: 'civis_embassy_staff',
    resource_id: embassyId,
    metadata: { email: target?.email, embassy_id: embassyId, unassigned_by: caller.email },
  });

  revalidateStaff();
  return { success: true, error: null };
}
