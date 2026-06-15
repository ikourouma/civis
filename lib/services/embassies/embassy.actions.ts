'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import {
  createEmbassyWithJurisdiction,
  deactivateEmbassy,
  reactivateEmbassy,
  setEmbassyJurisdictions,
  updateEmbassy,
  type CreateEmbassyInput,
} from './embassy.service';

function guardTenantAdmin(role: string) {
  return ['tenant_admin', 'super_admin'].includes(role);
}

export async function createEmbassyAction(
  input: CreateEmbassyInput,
): Promise<{ embassyId: string | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user || !guardTenantAdmin(user.role)) return { embassyId: null, error: 'Insufficient permissions' };
  if (!user.tenantId) return { embassyId: null, error: 'No tenant context' };

  const { embassy, error } = await createEmbassyWithJurisdiction(input, user.id, user.tenantId);
  if (error || !embassy) return { embassyId: null, error: error ?? 'Failed to create embassy' };

  revalidatePath('/workspace/embassy/manage');
  return { embassyId: embassy.id, error: null };
}

export async function updateEmbassyAction(
  embassyId: string,
  input: Partial<CreateEmbassyInput>,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user || !guardTenantAdmin(user.role)) return { success: false, error: 'Insufficient permissions' };

  const { error } = await updateEmbassy(embassyId, input, user.id);
  if (error) return { success: false, error };

  if (input.jurisdictionCountries && user.tenantId) {
    await setEmbassyJurisdictions(embassyId, user.tenantId, input.jurisdictionCountries);
  }

  revalidatePath(`/workspace/embassy/${embassyId}`);
  revalidatePath('/workspace/embassy/manage');
  return { success: true, error: null };
}

export async function deactivateEmbassyAction(
  embassyId: string,
  reason: string,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user || !guardTenantAdmin(user.role)) return { success: false, error: 'Insufficient permissions' };
  const { error } = await deactivateEmbassy(embassyId, reason, user.id);
  if (!error) revalidatePath('/workspace/embassy/manage');
  return { success: !error, error };
}

export async function reactivateEmbassyAction(
  embassyId: string,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user || !guardTenantAdmin(user.role)) return { success: false, error: 'Insufficient permissions' };
  const { error } = await reactivateEmbassy(embassyId, user.id);
  if (!error) revalidatePath('/workspace/embassy/manage');
  return { success: !error, error };
}
