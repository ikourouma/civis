import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { BrandProvider } from '@/components/providers/BrandProvider';
import { EntitlementProvider } from '@/components/providers/EntitlementProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { TenantContextBanner } from '@/components/workspace/TenantContextBanner';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { tierForBrandSource } from '@/lib/branding/tier-rules';
import { getCurrentUser } from '@/lib/services/auth';
import type { CivisUser } from '@/lib/services/auth/auth.types';
import { getDefaultBrand, getTenantBrand } from '@/lib/services/branding';
import { getEffectiveEntitlements, getUserCapabilities } from '@/lib/services/entitlements/entitlement.service';
import { createAdminClient } from '@/lib/supabase/admin';

interface WorkspaceShellProps {
  children: React.ReactNode;
  locale: string;
  title?: string;
}

// Shared authenticated workspace chrome — sidebar + top header + content area.
// Used by /admin, /workspace, /intelligence, /executive, /portal layouts.
// Performs its own session check as defense-in-depth (middleware is first line).
export async function WorkspaceShell({ children, locale, title }: WorkspaceShellProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/signin`);
  }

  // Super-admin "View as Tenant" context (D4): render as a tenant_admin scoped to
  // the selected tenant, with a persistent banner. Actions still attribute to the
  // real super-admin via getCurrentUser.
  const contextTenantId =
    user.role === 'super_admin' ? cookies().get('tenant_context')?.value ?? null : null;

  let effectiveUser: CivisUser = user;
  let contextBanner: { name: string; tier: string } | null = null;

  if (contextTenantId) {
    const admin = createAdminClient();
    const { data: ctx } = await admin
      .from('civis_tenants')
      .select('name, deployment_tier')
      .eq('id', contextTenantId)
      .maybeSingle();
    if (ctx) {
      const row = ctx as { name: string; deployment_tier: string };
      effectiveUser = { ...user, role: 'tenant_admin', tenantId: contextTenantId };
      contextBanner = { name: row.name, tier: row.deployment_tier };
    }
  }

  // Resolve the tenant's sovereign brand (falls back to the Afronovation platform brand).
  const [brand, capabilities] = await Promise.all([
    effectiveUser.tenantId ? getTenantBrand(effectiveUser.tenantId) : getDefaultBrand(),
    contextTenantId
      ? getEffectiveEntitlements(contextTenantId, 'tenant_admin').then((es) => es.filter((e) => e.isEnabled).map((e) => e.code))
      : getUserCapabilities(user.id),
  ]);
  const tier = tierForBrandSource(brand?.brandSource);

  return (
    <SessionProvider user={effectiveUser}>
      <BrandProvider initialBrand={brand} tier={tier}>
        <EntitlementProvider enabledCapabilities={capabilities}>
          <div className="flex h-screen flex-col overflow-hidden bg-navy-deepest text-surface">
            {contextBanner && <TenantContextBanner tenantName={contextBanner.name} tier={contextBanner.tier} />}
            <div className="flex flex-1 overflow-hidden">
              <WorkspaceSidebar user={effectiveUser} locale={locale} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <WorkspaceHeader user={effectiveUser} title={title} />
                <main className="flex-1 overflow-y-auto bg-navy-deepest px-6 py-8 lg:px-10">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </EntitlementProvider>
      </BrandProvider>
    </SessionProvider>
  );
}
