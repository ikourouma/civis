'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { CivisUser } from '@/lib/services/auth/auth.types';

// Maps a raw profiles row to the CivisUser shape used across the UI.
function mapProfile(row: {
  id: string;
  email: string;
  full_name: string | null;
  role: CivisUser['role'];
  tenant_id: string | null;
  is_active: boolean;
  last_sign_in_at: string | null;
}): CivisUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    tenantId: row.tenant_id,
    embassyIds: [], // marketing header has no embassy-scope dependency
    isActive: row.is_active,
    lastSignInAt: row.last_sign_in_at,
  };
}

// Client-side session reader for the marketing header. Keeps public pages
// statically rendered while still reflecting auth state after hydration.
// Subscribes to auth changes so the header updates on sign-in/sign-out.
export function useClientUser(): { user: CivisUser | null; loading: boolean } {
  const [user, setUser] = useState<CivisUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, tenant_id, is_active, last_sign_in_at')
        .eq('id', session.user.id)
        .single();

      if (!active) return;
      setUser(profile ? mapProfile(profile) : null);
      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        return;
      }
      load();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
