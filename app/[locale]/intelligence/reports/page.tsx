import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ReportBuilder } from '@/components/intelligence/ReportBuilder';
import { getCurrentUser } from '@/lib/services/auth';
import { getExportHistory } from '@/lib/services/export/export.actions';

interface PageProps {
  params: { locale: string };
}

export default async function ReportsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['analyst', 'tenant_admin', 'super_admin', 'executive_viewer'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const history = await getExportHistory();

  return (
    <div className="mx-auto max-w-5xl">
      <ReportBuilder locale={locale as 'en' | 'fr'} history={history} />
    </div>
  );
}
