import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TenantBrandView } from '@/components/workspace/TenantBrandView';
import { tierForBrandSource } from '@/lib/branding/tier-rules';
import { getCurrentUser } from '@/lib/services/auth';
import { getDefaultBrand, getTenantBrand } from '@/lib/services/branding';

interface PageProps {
  params: { locale: string };
}

export default async function TenantBrandingPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('branding');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['tenant_admin', 'super_admin'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const brand = user.tenantId ? await getTenantBrand(user.tenantId) : await getDefaultBrand();
  const tier = tierForBrandSource(brand?.brandSource);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t('tenant.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('tenant.page_title')}</h1>
        {brand && (
          <p className="mt-2 text-sm text-surface/60">
            {brand.displayName[locale as 'en' | 'fr'] ?? brand.displayName.en}
            {' — '}
            {t(`tier_labels.${tier}` as 'tier_labels.cloud')}
          </p>
        )}
      </header>

      <TenantBrandView brand={brand} tier={tier} locale={locale as 'en' | 'fr'} />
    </div>
  );
}
