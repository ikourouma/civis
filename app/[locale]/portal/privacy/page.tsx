import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PrivacyRightsView } from '@/components/gdpr/PrivacyRightsView';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { getCurrentUser } from '@/lib/services/auth';
import { getConsentRecord } from '@/lib/services/consent/consent.service';
import { getMyGDPRRequests } from '@/lib/services/gdpr';
import { getMyRegistrantRecord } from '@/lib/services/registrants';
import { getTenantSettings } from '@/lib/services/settings';

export default async function PortalPrivacyPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const registrant = await getMyRegistrantRecord(user.id);

  const [consent, requests, settings] = await Promise.all([
    registrant ? getConsentRecord(registrant.id) : Promise.resolve(null),
    registrant ? getMyGDPRRequests(registrant.id) : Promise.resolve([]),
    user.tenantId ? getTenantSettings(user.tenantId) : Promise.resolve(null),
  ]);

  return (
    <WorkspaceShell locale={locale}>
      <PrivacyRightsView
        consent={consent}
        requests={requests}
        retentionDays={settings?.retention.retentionDays ?? 2555}
        contactEmail={settings?.primaryContactEmail ?? null}
      />
    </WorkspaceShell>
  );
}
