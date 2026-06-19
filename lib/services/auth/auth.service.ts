// Server-only auth — uses next/headers. Never import in client components.
import { createClient as createServerClientFn } from '@/lib/supabase/server';
import type { CivisSession } from './auth.types';

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

  // Active embassy assignments (drives embassy-scoped intelligence for the Ambassador)
  const { data: staffRows } = await supabase
    .from('civis_embassy_staff')
    .select('embassy_id')
    .eq('user_id', session.user.id)
    .eq('is_active', true);

  const embassyIds = (staffRows ?? [])
    .map((r) => r.embassy_id as string)
    .filter(Boolean);

  return {
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      tenantId: profile.tenant_id,
      embassyIds,
      isActive: profile.is_active,
      lastSignInAt: profile.last_sign_in_at,
      diplomaticTitle: profile.diplomatic_title ?? null,
    },
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? 0,
  };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
