'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/services/auth';

type Result = { success: boolean; error?: string };

// Personal profile update (name + diplomatic title). Email is immutable here.
export async function updateMyProfileAction(input: { fullName?: string; diplomaticTitle?: string | null }): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.diplomaticTitle !== undefined) updates.diplomatic_title = input.diplomaticTitle;
  const { error } = await admin.from('profiles').update(updates).eq('id', user.id);
  return { success: !error, error: error?.message };
}

// Sends a password reset email to the signed-in user.
export async function sendPasswordResetAction(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(user.email);
  return { success: !error, error: error?.message };
}

// Revoke all other sessions for the current user.
export async function signOutOtherSessionsAction(): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  return { success: !error, error: error?.message };
}
