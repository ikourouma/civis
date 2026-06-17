import { redirect } from 'next/navigation';

import type { CapabilityCode } from '@/lib/entitlements/capabilities';
import { getSession } from '@/lib/services/auth';
import { hasCapability } from '@/lib/services/entitlements/entitlement.service';

// Server Component / page guard — redirects when not entitled.
export async function requireCapability(
  capability: CapabilityCode,
  redirectTo?: string,
): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/en/auth/signin');
  if (session.user.role === 'super_admin') return;
  if (!session.user.tenantId) {
    redirect(redirectTo ?? '/en/workspace/dashboard?error=insufficient_entitlement');
  }

  const entitled = await hasCapability(session.user.tenantId, session.user.role, capability);
  if (!entitled) {
    redirect(redirectTo ?? '/en/workspace/dashboard?error=insufficient_entitlement');
  }
}

// Server Action guard — returns a result instead of redirecting.
export async function checkCapability(
  capability: CapabilityCode,
): Promise<{ allowed: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { allowed: false, error: 'Not authenticated' };
  if (session.user.role === 'super_admin') return { allowed: true };
  if (!session.user.tenantId) return { allowed: false, error: 'No tenant context' };

  const entitled = await hasCapability(session.user.tenantId, session.user.role, capability);
  return entitled
    ? { allowed: true }
    : { allowed: false, error: `Capability '${capability}' is not enabled for your role in this deployment.` };
}
