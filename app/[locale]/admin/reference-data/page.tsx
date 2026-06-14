import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ReferenceDataPanel } from '@/components/admin/ReferenceDataPanel';
import { getCurrentUser } from '@/lib/services/auth';
import { getPendingSuggestions, getSuggestionCounts } from '@/lib/services/admin/reference-management.service';

interface PageProps {
  params: { locale: string };
}

export default async function ReferenceDataPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('reference_data');

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const [pending, counts] = await Promise.all([
    getPendingSuggestions({ status: 'pending_review' }),
    getSuggestionCounts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('page_subtitle')}</p>
      </header>

      <ReferenceDataPanel
        locale={locale as 'en' | 'fr'}
        initialPending={pending}
        pendingCount={counts.pending}
      />
    </div>
  );
}
