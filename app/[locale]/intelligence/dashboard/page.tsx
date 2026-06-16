import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AnalystDashboard } from '@/components/intelligence/AnalystDashboard';
import { getCurrentUser } from '@/lib/services/auth';
import {
  getAgeDistribution,
  getCompletenessDistribution,
  getCountryDistribution,
  getDashboardKPIs,
  getDiasporaAssociationMembership,
  getEducationDistribution,
  getEmbassyPerformance,
  getFieldCompletionRates,
  getGenderDistribution,
  getGenerationDistribution,
  getInvestmentInterestBreakdown,
  getProfessionDistribution,
  getRegistrationStatusBreakdown,
  getRegistrationTrends,
  getReturnInterestBreakdown,
  type AnalyticsScope,
} from '@/lib/services/analytics';
import { getCurrentTenant } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
  searchParams: { range?: string };
}

function rangeFrom(range: string | undefined): Date | undefined {
  const now = Date.now();
  switch (range) {
    case '30d': return new Date(now - 30 * 24 * 3.6e6);
    case '90d': return new Date(now - 90 * 24 * 3.6e6);
    case 'all': return undefined;
    case '12m':
    default: return new Date(now - 365 * 24 * 3.6e6);
  }
}

export default async function IntelligenceDashboardPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!user.tenantId) redirect(`/${locale}/workspace/dashboard`);

  const scope: AnalyticsScope = { tenantId: user.tenantId, embassyId: user.embassyIds[0] };
  const range = searchParams.range ?? '12m';
  const tenant = await getCurrentTenant();

  const [
    kpis, trends, countries, age, gender, generation, education, professions,
    status, completeness, fieldRates, embassyPerf, returnI, investI, association,
  ] = await Promise.all([
    getDashboardKPIs(scope),
    getRegistrationTrends(scope, { from: rangeFrom(range), period: 'month' }),
    getCountryDistribution(scope, 10),
    getAgeDistribution(scope),
    getGenderDistribution(scope),
    getGenerationDistribution(scope),
    getEducationDistribution(scope),
    getProfessionDistribution(scope, 15),
    getRegistrationStatusBreakdown(scope),
    getCompletenessDistribution(scope),
    getFieldCompletionRates(scope),
    getEmbassyPerformance(scope),
    getReturnInterestBreakdown(scope),
    getInvestmentInterestBreakdown(scope),
    getDiasporaAssociationMembership(scope),
  ]);

  return (
    <AnalystDashboard
      locale={locale as 'en' | 'fr'}
      range={range}
      countryName={tenant?.officialCountryName ?? tenant?.name ?? 'Your Nation'}
      data={{
        kpis, trends, countries, age, gender, generation, education, professions,
        status, completeness, fieldRates, embassyPerf,
        engagement: { returnInterest: returnI.percentage, investmentInterest: investI.percentage, association: association.percentage },
      }}
    />
  );
}
