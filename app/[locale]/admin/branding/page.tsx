import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { BrandingPanel } from '@/components/admin/BrandingPanel';
import { getCurrentUser } from '@/lib/services/auth';
import { getAllBrands } from '@/lib/services/branding';

interface PageProps {
  params: { locale: string };
}

export default async function BrandingAdminPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('branding.admin');

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const brands = await getAllBrands();

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('page_subtitle')}</p>
      </header>

      <BrandingPanel locale={locale as 'en' | 'fr'} brands={brands} />
    </div>
  );
}
