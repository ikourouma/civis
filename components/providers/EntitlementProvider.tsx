'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

import type { CapabilityCode } from '@/lib/entitlements/capabilities';

interface EntitlementContextValue {
  capabilities: Set<CapabilityCode>;
  hasCapability: (code: CapabilityCode) => boolean;
  isLoading: boolean;
}

const EntitlementContext = createContext<EntitlementContextValue>({
  capabilities: new Set(),
  hasCapability: () => false,
  isLoading: true,
});

export function EntitlementProvider({
  enabledCapabilities,
  children,
}: {
  enabledCapabilities: CapabilityCode[];
  children: React.ReactNode;
}) {
  const capabilities = useMemo(() => new Set(enabledCapabilities), [enabledCapabilities]);
  const hasCapability = useCallback((code: CapabilityCode) => capabilities.has(code), [capabilities]);

  const value = useMemo(
    () => ({ capabilities, hasCapability, isLoading: false }),
    [capabilities, hasCapability],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  return useContext(EntitlementContext);
}

export function useHasCapability(code: CapabilityCode): boolean {
  const { hasCapability } = useEntitlement();
  return hasCapability(code);
}
