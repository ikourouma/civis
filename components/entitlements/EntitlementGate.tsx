'use client';

import { useHasCapability } from '@/components/providers/EntitlementProvider';
import type { CapabilityCode } from '@/lib/entitlements/capabilities';

interface EntitlementGateProps {
  capability: CapabilityCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Renders children only when the current user's tenant entitles their role to
// the capability. Hidden by default when not entitled.
export function EntitlementGate({ capability, children, fallback = null }: EntitlementGateProps) {
  const isEntitled = useHasCapability(capability);
  return isEntitled ? <>{children}</> : <>{fallback}</>;
}
