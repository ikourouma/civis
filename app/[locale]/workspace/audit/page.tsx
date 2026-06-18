import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AuditViewer } from '@/components/audit/AuditViewer';
import { getCurrentUser } from '@/lib/services/auth';
import { getAuditLog, getAuditStats } from '@/lib/services/audit';
import { hasCapability } from '@/lib/services/entitlements/entitlement.service';
import { getCurrentTenant } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

export default async function TenantAuditPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  const tenantId = user.tenantId ?? '';

  // Audit access requires tenant-wide OR embassy-level audit capability.
  const [viewTenant, viewEmbassy] = await Promise.all([
    hasCapability(tenantId, user.role, 'AUDIT_VIEW_TENANT'),
    hasCapability(tenantId, user.role, 'AUDIT_VIEW_EMBASSY'),
  ]);
  if (!viewTenant && !viewEmbassy) {
    redirect(`/${locale}/workspace/dashboard?error=insufficient_entitlement`);
  }
  const scope = { tenantId };

  const [tenant, { entries, total }, stats, canExport] = await Promise.all([
    getCurrentTenant(),
    getAuditLog(scope, {}, { page: 1, pageSize: 50 }),
    getAuditStats(scope, {}),
    hasCapability(tenantId, user.role, 'AUDIT_EXPORT'),
  ]);

  return (
    <AuditViewer
      isPlatform={false}
      canExport={canExport}
      subtitle={`All platform activity for ${tenant?.officialCountryName ?? tenant?.name ?? 'your government'}`}
      tenants={[]}
      initialEntries={entries}
      initialTotal={total}
      initialStats={stats}
    />
  );
}
