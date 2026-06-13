import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClientFn } from '@/lib/supabase/server';
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
    return { success: false, error: 'Profile not found. Contact your administrator.' };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { success: false, error: 'Your account has been deactivated. Contact your administrator.' };
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

export async function getSession(): Promise<CivisSession | null> {
  const supabase = await createServerClientFn();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  return {
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      tenantId: profile.tenant_id,
      isActive: profile.is_active,
      lastSignInAt: profile.last_sign_in_at,
    },
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? 0,
  };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
