'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { getCityDistribution, type AnalyticsScope } from '@/lib/services/analytics';

async function userScope(): Promise<AnalyticsScope | null> {
  const user = await getCurrentUser();
  if (!user?.tenantId) return null;
  return { tenantId: user.tenantId, embassyId: user.embassyIds[0] };
}

// Drill-down: city distribution within a selected country, scoped to the caller.
export async function getCountryCitiesAction(
  countryName: string,
): Promise<{ city: string; country: string; count: number }[]> {
  const scope = await userScope();
  if (!scope) return [];
  return getCityDistribution(scope, countryName, 12);
}
