import { createClient as createServerClientFn } from '@/lib/supabase/server';
import type { CivisUser } from './auth.types';

export async function getUserProfile(userId: string): Promise<CivisUser | null> {
  const supabase = await createServerClientFn();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    tenantId: profile.tenant_id,
    embassyIds: [], // not needed in account/profile display context
    isActive: profile.is_active,
    lastSignInAt: profile.last_sign_in_at,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<CivisUser, 'fullName'>>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientFn();

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: updates.fullName })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
