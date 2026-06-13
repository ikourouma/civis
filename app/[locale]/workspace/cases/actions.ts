'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import { approveRegistrant, rejectRegistrant } from '@/lib/services/registrants';

export async function approveRegistrantAction(
  registrantId: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };
  if (!['consular_officer', 'embassy_admin', 'tenant_admin', 'super_admin'].includes(user.role)) {
    return { error: 'Insufficient permissions' };
  }

  const result = await approveRegistrant(registrantId, user.id, user.role);
  if (!result.error) revalidatePath('/workspace/cases');
  return result;
}

export async function rejectRegistrantAction(
  registrantId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };
  if (!['consular_officer', 'embassy_admin', 'tenant_admin', 'super_admin'].includes(user.role)) {
    return { error: 'Insufficient permissions' };
  }

  if (!reason.trim()) return { error: 'Rejection reason is required' };

  const result = await rejectRegistrant(registrantId, reason, user.id, user.role);
  if (!result.error) revalidatePath('/workspace/cases');
  return result;
}
