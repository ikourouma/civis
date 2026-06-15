import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmbassyManageClient } from '@/components/workspace/EmbassyManageClient';
import { getCurrentUser } from '@/lib/services/auth';
import { getEmbassiesWithCounts } from '@/lib/services/embassies';

interface PageProps {
  params: { locale: string };
}

export default async function EmbassyManagePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('embassy_management');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['tenant_admin', 'super_admin'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const embassies = await getEmbassiesWithCounts();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('page_title')}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('page_subtitle')}</p>
      </header>

      <EmbassyManageClient locale={locale as 'en' | 'fr'} embassies={embassies} />
    </div>
  );
}
