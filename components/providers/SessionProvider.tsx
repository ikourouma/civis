'use client';

import { createContext, useContext } from 'react';

import type { CivisUser } from '@/lib/services/auth/auth.types';

const SessionContext = createContext<CivisUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: CivisUser | null;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): CivisUser | null {
  return useContext(SessionContext);
}

export function useRequiredSession(): CivisUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useRequiredSession called outside authenticated route');
  return user;
}
