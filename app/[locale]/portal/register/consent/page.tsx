import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ConsentStep } from '@/components/portal/ConsentStep';
import { getBrandByCountry } from '@/lib/services/branding';
import { getPublicTenantById } from '@/lib/services/tenants/public-tenant.service';

interface PageProps {
  params: { locale: string };
  searchParams: { tenant?: string };
}

export default async function RegisterConsentPage({
  params: { locale },
  searchParams,
}: PageProps) {
  setRequestLocale(locale);

  const tenantId = searchParams.tenant;
  if (!tenantId) redirect(`/${locale}/portal/register`);

  const tenant = await getPublicTenantById(tenantId);
  if (!tenant) redirect(`/${locale}/portal/register`);

  const brand = await getBrandByCountry(tenant.countryCode);

  return (
    <ConsentStep
      locale={locale as 'en' | 'fr'}
      tenantId={tenant.id}
      governmentName={tenant.displayName[locale as 'en' | 'fr'] ?? tenant.displayName.en}
      brandPrimary={brand?.palette.primary ?? '#2A3F62'}
      sealUrl={brand?.assets.sealUrl}
    />
  );
}
