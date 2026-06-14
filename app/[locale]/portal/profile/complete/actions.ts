'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  completeProfileSection,
  submitForVerification,
  type ProfileSection,
} from '@/lib/services/registrants';

async function myRegistrantId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_registrants')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function completeProfileSectionAction(
  section: ProfileSection,
  data: Record<string, unknown>,
): Promise<{ success: boolean; newCompletenessScore: number; status: string | null; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, newCompletenessScore: 0, status: null, error: 'Unauthorized' };

  const registrantId = await myRegistrantId(user.id);
  if (!registrantId) return { success: false, newCompletenessScore: 0, status: null, error: 'No registrant record.' };

  const result = await completeProfileSection(registrantId, section, data, user.id);
  if (result.success) revalidatePath('/portal/profile/complete');
  return result;
}

export async function submitForVerificationAction(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const registrantId = await myRegistrantId(user.id);
  if (!registrantId) return { success: false, error: 'No registrant record.' };

  const result = await submitForVerification(registrantId, user.id);
  if (result.success) {
    revalidatePath('/portal/profile/complete');
    revalidatePath('/portal/dashboard');
  }
  return result;
}
