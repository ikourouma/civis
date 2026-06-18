import { setRequestLocale } from 'next-intl/server';

import { SettingsForm } from '@/components/settings/SettingsForm';
import { requireCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import { hasCapability } from '@/lib/services/entitlements/entitlement.service';
import { getTenantSettings } from '@/lib/services/settings';

interface PageProps {
  params: { locale: string };
}

export default async function SettingsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  await requireCapability('SETTINGS_VIEW');

  const user = await getCurrentUser();
  const tenantId = user?.tenantId ?? '';
  const role = user?.role ?? 'tenant_admin';

  const [settings, canEdit, canRetention, canConsent] = await Promise.all([
    getTenantSettings(tenantId),
    hasCapability(tenantId, role, 'SETTINGS_EDIT'),
    hasCapability(tenantId, role, 'SETTINGS_DATA_RETENTION'),
    hasCapability(tenantId, role, 'SETTINGS_CONSENT_CONFIG'),
  ]);

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">Tenant Settings</h1>
        <p className="mt-4 text-sm text-surface/50">No tenant configuration found.</p>
      </div>
    );
  }

  return <SettingsForm settings={settings} flags={{ canEdit, canRetention, canConsent }} />;
}
