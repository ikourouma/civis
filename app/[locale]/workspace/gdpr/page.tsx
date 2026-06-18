import { setRequestLocale } from 'next-intl/server';

import { GDPRQueue } from '@/components/gdpr/GDPRQueue';
import { requireCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import { getGDPRStats, getTenantGDPRRequests } from '@/lib/services/gdpr';

interface PageProps {
  params: { locale: string };
}

export default async function GDPRPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  await requireCapability('GDPR_PROCESS_REQUESTS');

  const user = await getCurrentUser();
  const scope = { tenantId: user?.tenantId ?? '' };

  const [requests, stats] = await Promise.all([
    getTenantGDPRRequests(scope),
    getGDPRStats(scope),
  ]);

  return <GDPRQueue initialRequests={requests} stats={stats} />;
}
