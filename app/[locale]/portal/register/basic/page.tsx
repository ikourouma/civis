import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { BasicRegistrationForm } from '@/components/portal/BasicRegistrationForm';
import { getPublicTenantById } from '@/lib/services/tenants/public-tenant.service';

interface PageProps {
  params: { locale: string };
  searchParams: { tenant?: string };
}

export default async function RegisterBasicPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);

  const tenantId = searchParams.tenant;
  if (!tenantId) redirect(`/${locale}/portal/register`);

  const tenant = await getPublicTenantById(tenantId);
  if (!tenant) redirect(`/${locale}/portal/register`);

  return (
    <BasicRegistrationForm
      locale={locale as 'en' | 'fr'}
      tenantId={tenant.id}
      defaultCountry={tenant.countryCode}
      supportedLanguages={tenant.supportedLanguages}
    />
  );
}
