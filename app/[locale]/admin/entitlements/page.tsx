import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EntitlementsPanel } from '@/components/admin/EntitlementsPanel';
import { getCurrentUser } from '@/lib/services/auth';
import { getEffectiveEntitlements } from '@/lib/services/entitlements/entitlement.service';
import { getAllTenants } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

export default async function EntitlementsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('entitlements');

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const tenants = await getAllTenants();
  const initialTenant = tenants[0];
  const initialEntitlements = initialTenant
    ? await getEffectiveEntitlements(initialTenant.id, 'tenant_admin')
    : [];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Sovereign Command</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('page_subtitle')}</p>
      </header>

      {tenants.length === 0 ? (
        <p className="text-sm text-surface/50">No tenants found.</p>
      ) : (
        <EntitlementsPanel
          locale={locale as 'en' | 'fr'}
          tenants={tenants.map((t) => ({ id: t.id, name: t.name, countryCode: t.countryCode }))}
          initialTenantId={initialTenant!.id}
          initialRole="tenant_admin"
          initialEntitlements={initialEntitlements}
        />
      )}
    </div>
  );
}
