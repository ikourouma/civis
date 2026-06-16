import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ExportClient } from '@/components/intelligence/ExportClient';
import { getCurrentUser } from '@/lib/services/auth';
import { getExportHistory } from '@/lib/services/export/export.actions';

interface PageProps {
  params: { locale: string };
}

export default async function ExportPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['analyst', 'tenant_admin', 'super_admin', 'executive_viewer'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const history = await getExportHistory();
  const canIncludePhone = ['tenant_admin', 'super_admin'].includes(user.role);

  return (
    <div className="mx-auto max-w-3xl">
      <ExportClient locale={locale as 'en' | 'fr'} history={history} canIncludePhone={canIncludePhone} />
    </div>
  );
}
