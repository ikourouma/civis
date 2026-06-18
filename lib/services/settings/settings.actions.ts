'use server';

import { revalidatePath } from 'next/cache';

import { checkCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import { updateTenantSettings, type UpdateTenantSettingsInput } from './settings.service';

export async function saveTenantSettingsAction(
  input: UpdateTenantSettingsInput,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  if (!user.tenantId) return { success: false, error: 'No tenant context.' };
  const cap = await checkCapability('SETTINGS_EDIT');
  if (!cap.allowed) return { success: false, error: cap.error };

  const res = await updateTenantSettings(user.tenantId, input, user.id, user.role);
  if (res.success) revalidatePath('/workspace/settings');
  return res;
}
