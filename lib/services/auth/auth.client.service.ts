// Browser-only auth actions — safe to import in client components.
// No next/headers, no server-only imports.
import { createClient } from '@/lib/supabase/client';
import type { SignInCredentials, AuthResult, CivisSession } from './auth.types';

export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.session) {
    return { success: false, error: error?.message ?? 'Authentication failed' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();

  if (profileError || !profile) {
    console.error('[signIn] profile fetch failed:', profileError);
    return { success: false, error: 'Profile not found. Contact your administrator.' };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: 'Your account has been deactivated. Contact your administrator.',
    };
  }

  const session: CivisSession = {
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      tenantId: profile.tenant_id,
      isActive: profile.is_active,
      lastSignInAt: profile.last_sign_in_at,
    },
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at ?? 0,
  };

  return { success: true, session };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
