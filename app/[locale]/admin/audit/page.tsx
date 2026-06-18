import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AuditViewer } from '@/components/audit/AuditViewer';
import { getCurrentUser } from '@/lib/services/auth';
import { getAuditLog, getAuditStats } from '@/lib/services/audit';
import { recordPlatformAuditView } from '@/lib/services/audit/audit.actions';
import { getAllTenants } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

export default async function PlatformAuditPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const scope = {}; // platform-wide

  const [tenants, { entries, total }, stats] = await Promise.all([
    getAllTenants(),
    getAuditLog(scope, {}, { page: 1, pageSize: 50 }),
    getAuditStats(scope, {}),
  ]);

  // Viewing the platform audit log is itself audited.
  await recordPlatformAuditView({});

  return (
    <AuditViewer
      isPlatform
      canExport
      subtitle="All platform activity across all tenants"
      tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
      initialEntries={entries}
      initialTotal={total}
      initialStats={stats}
    />
  );
}
