import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ExecutiveDashboard } from '@/components/intelligence/ExecutiveDashboard';
import { getCurrentUser } from '@/lib/services/auth';
import {
  getCityDistribution,
  getCountryDistribution,
  getDashboardKPIs,
  getInvestmentInterestBreakdown,
  getRegistrationTrends,
  getReturnInterestBreakdown,
  type AnalyticsScope,
} from '@/lib/services/analytics';
import { getBrandByCountry } from '@/lib/services/branding';
import { getCurrentTenant } from '@/lib/services/tenants';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: { locale: string };
}

export default async function ExecutiveDashboardPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!user.tenantId) redirect(`/${locale}/workspace/dashboard`);

  const isEmbassyScoped = user.embassyIds.length > 0;
  const scope: AnalyticsScope = { tenantId: user.tenantId, embassyId: user.embassyIds[0] };
  const tenant = await getCurrentTenant();
  const countryName = tenant?.officialCountryName ?? tenant?.name ?? 'Your Nation';
  const brand = tenant ? await getBrandByCountry(tenant.countryCode) : null;

  let embassyName = '';
  if (isEmbassyScoped) {
    const supabase = await createClient();
    const { data } = await supabase.from('civis_embassies').select('name').eq('id', user.embassyIds[0]!).maybeSingle();
    embassyName = (data?.name as string) ?? 'Your Embassy';
  }

  const [kpis, countries, cities, trends, returnI, investI] = await Promise.all([
    getDashboardKPIs(scope),
    getCountryDistribution(scope, 5),
    isEmbassyScoped ? getCityDistribution(scope, undefined, 5) : Promise.resolve([]),
    getRegistrationTrends(scope, { from: new Date(Date.now() - 182 * 24 * 3.6e6), period: 'month' }),
    getReturnInterestBreakdown(scope),
    getInvestmentInterestBreakdown(scope),
  ]);

  return (
    <ExecutiveDashboard
      locale={locale as 'en' | 'fr'}
      isEmbassyScoped={isEmbassyScoped}
      countryName={countryName}
      embassyName={embassyName}
      sealUrl={brand?.assets.sealUrl}
      kpis={kpis}
      countries={countries}
      cities={cities}
      trends={trends.map((tr) => ({ date: tr.date, count: tr.count }))}
      engagement={{ returnInterest: returnI.percentage, investmentInterest: investI.percentage }}
    />
  );
}
