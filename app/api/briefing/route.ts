import { NextResponse } from 'next/server';

import {
  getAgeDistribution,
  getCountryDistribution,
  getDashboardKPIs,
  getInvestmentInterestBreakdown,
  getReturnInterestBreakdown,
  type AnalyticsScope,
} from '@/lib/services/analytics';
import { getCurrentUser } from '@/lib/services/auth';
import { getBrandByCountry } from '@/lib/services/branding';
import { renderBriefing } from '@/lib/services/export/executive-briefing';
import { getCurrentTenant } from '@/lib/services/tenants';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scope: AnalyticsScope = { tenantId: user.tenantId, embassyId: user.embassyIds[0] };
  const tenant = await getCurrentTenant();
  const countryName = tenant?.officialCountryName ?? tenant?.name ?? 'Your Nation';
  const brand = tenant ? await getBrandByCountry(tenant.countryCode) : null;

  const [kpis, countries, age, returnI, investI] = await Promise.all([
    getDashboardKPIs(scope),
    getCountryDistribution(scope, 5),
    getAgeDistribution(scope),
    getReturnInterestBreakdown(scope),
    getInvestmentInterestBreakdown(scope),
  ]);

  const pdf = await renderBriefing({
    countryName,
    classification: `${countryName} — Official Use Only`,
    generatedAt: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
    primary: brand?.palette.primary ?? '#2A3F62',
    secondary: brand?.palette.secondary ?? '#C9A84C',
    kpis: [
      { label: 'Total Registered', value: kpis.totalRegistrants.toLocaleString() },
      { label: 'Active', value: kpis.activeRegistrants.toLocaleString() },
      { label: 'Pending', value: kpis.pendingVerification.toLocaleString() },
      { label: 'Growth vs Last Mo.', value: `${kpis.registrationGrowthPercent >= 0 ? '+' : ''}${kpis.registrationGrowthPercent}%` },
    ],
    countries: countries.map((c) => ({ name: c.countryName, count: c.count, flag: c.flagEmoji })),
    age: age.map((a) => ({ label: a.label, count: a.count })),
    engagement: { returnInterest: returnI.percentage, investmentInterest: investI.percentage },
  });

  // Audit the briefing export
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'DATA_EXPORTED',
    resource: 'civis_registrants',
    metadata: { export_type: 'pdf', report_type: 'executive_briefing', exported_by: user.email },
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="civis-briefing-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  });
}
