import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { EmbassyReportsClient } from '@/components/workspace/EmbassyReportsClient';
import { getCurrentUser } from '@/lib/services/auth';
import { getMyEmbassy } from '@/lib/services/embassies';

interface PageProps {
  params: { locale: string };
}

export default async function ReportsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['embassy_admin', 'consular_officer', 'tenant_admin', 'super_admin'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const embassy = await getMyEmbassy();

  return <EmbassyReportsClient embassyName={embassy?.name ?? null} />;
}
