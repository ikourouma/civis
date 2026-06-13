import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';

export default async function IntelligenceDashboard({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('Workspace');
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('common.welcome')}</p>
      <h1 className="mt-2 text-3xl font-bold text-white">{user?.fullName ?? user?.email}</h1>
      <p className="mt-2 text-sm text-surface/60">
        {t('common.role_label')}: <span className="text-surface/80">{user?.role}</span>
      </p>
      <p className="mt-8 text-sm text-surface/50">{t('common.coming_soon_mission')}</p>
    </div>
  );
}
