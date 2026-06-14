import { setRequestLocale } from 'next-intl/server';

import { TenantSelect } from '@/components/portal/TenantSelect';
import { getPublicTenants } from '@/lib/services/tenants/public-tenant.service';

interface PageProps {
  params: { locale: string };
}

// Public entry point for the two-phase registration flow (no auth required).
export default async function RegisterEntryPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const tenants = await getPublicTenants();

  return <TenantSelect tenants={tenants} locale={locale as 'en' | 'fr'} />;
}
