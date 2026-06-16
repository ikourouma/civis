'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import {
  DonutChart,
  HorizontalBarChart,
  TrendAreaChart,
  VerticalBarChart,
} from '@/components/intelligence/charts';
import { GeographicDistribution } from '@/components/intelligence/GeographicDistribution';
import { KpiStrip, type Kpi } from '@/components/intelligence/KpiStrip';
import { CHART_COLORS } from '@/lib/charts/chart-config';
import type {
  CountryDistribution,
  DemographicBreakdown,
  DashboardKPIs,
  EmbassyPerformance,
  ProfessionDistribution,
  RegistrationTrend,
} from '@/lib/services/analytics';
import { cn } from '@/lib/utils';

interface DashboardData {
  kpis: DashboardKPIs;
  trends: RegistrationTrend[];
  countries: CountryDistribution[];
  age: DemographicBreakdown[];
  gender: DemographicBreakdown[];
  generation: DemographicBreakdown[];
  education: DemographicBreakdown[];
  professions: ProfessionDistribution[];
  status: DemographicBreakdown[];
  completeness: { range: string; count: number; percentage: number }[];
  fieldRates: { field: string; completionRate: number }[];
  embassyPerf: EmbassyPerformance[];
  engagement: { returnInterest: number; investmentInterest: number; association: number };
}

const RANGES = [
  ['30d', '30_days'],
  ['90d', '90_days'],
  ['12m', '12_months'],
  ['all', 'all_time'],
] as const;

export function AnalystDashboard({
  locale,
  range,
  countryName,
  data,
}: {
  locale: 'en' | 'fr';
  range: string;
  countryName: string;
  data: DashboardData;
}) {
  const t = useTranslations('intelligence.dashboard');

  const kpis: Kpi[] = [
    { label: t('kpi.total'), value: data.kpis.totalRegistrants },
    { label: t('kpi.active'), value: data.kpis.activeRegistrants },
    { label: t('kpi.pending'), value: data.kpis.pendingVerification },
    { label: t('kpi.this_month'), value: data.kpis.thisMonthRegistrations },
    { label: t('kpi.completeness'), value: data.kpis.avgCompletenessScore, suffix: '%' },
    {
      label: t('kpi.growth'),
      value: data.kpis.registrationGrowthPercent,
      suffix: '%',
      tone: data.kpis.registrationGrowthPercent >= 0 ? 'up' : 'down',
    },
  ];

  return (
    <div className="-mx-6 -my-8 min-h-full bg-[#0A1628] px-6 py-8 lg:-mx-10 lg:px-10">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-white/50">
            {t('subtitle', { country: countryName, count: data.kpis.totalRegistrants })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-white/[0.08] p-0.5">
            {RANGES.map(([key, label]) => (
              <Link
                key={key}
                href={`/intelligence/dashboard?range=${key}`}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                  range === key ? 'bg-gold text-navy-deepest' : 'text-white/50 hover:text-white',
                )}
              >
                {t(`date_range.${label}` as 'date_range.30_days')}
              </Link>
            ))}
          </div>
          <Link
            href="/intelligence/export"
            className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Link>
        </div>
      </header>

      <KpiStrip items={kpis} />

      {/* Row 1 — trend + geography */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title={t('sections.registration_trend')}>
          <TrendAreaChart data={data.trends} />
        </Panel>
        <Panel title={t('sections.geographic')} action={<span className="text-[11px] text-white/30">{t('view_all_countries')}</span>}>
          <GeographicDistribution data={data.countries} limit={10} />
        </Panel>
      </div>

      {/* Row 2 — demographics donuts */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title={t('sections.age')}><DonutChart data={data.age} /></Panel>
        <Panel title={t('sections.gender')}><DonutChart data={data.gender} /></Panel>
        <Panel title={t('sections.generation')}><DonutChart data={data.generation} /></Panel>
      </div>

      {/* Row 3 — professions + education */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title={t('sections.professions')}>
          <HorizontalBarChart data={data.professions.map((p) => ({ label: p.occupation, count: p.count }))} />
        </Panel>
        <Panel title={t('sections.education')}>
          <VerticalBarChart data={data.education.map((e) => ({ label: e.label, count: e.count }))} />
        </Panel>
      </div>

      {/* Row 4 — engagement + completeness */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title={t('sections.engagement')}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={t('engagement.return_interest')} value={`${data.engagement.returnInterest}%`} />
            <Stat label={t('engagement.investment_interest')} value={`${data.engagement.investmentInterest}%`} />
            <Stat label={t('engagement.association_membership')} value={`${data.engagement.association}%`} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">{t('sections.registration_trend')}</p>
            <DonutChart data={data.status} height={180} />
          </div>
        </Panel>
        <Panel title={t('sections.completeness')}>
          <VerticalBarChart data={data.completeness.map((c) => ({ label: c.range, count: c.count }))} color={CHART_COLORS.accent2} />
        </Panel>
      </div>

      {/* Row 5 — embassy performance */}
      {data.embassyPerf.length > 0 && (
        <div className="mt-5">
          <Panel title={t('sections.embassy_performance')}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="py-2 font-medium">Embassy</th>
                    <th className="py-2 font-medium">Host</th>
                    <th className="py-2 font-medium">Registrants</th>
                    <th className="py-2 font-medium">Pending</th>
                    <th className="py-2 font-medium">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {data.embassyPerf.map((e) => (
                    <tr key={e.embassyId} className="border-t border-white/[0.06]">
                      <td className="py-2.5 font-medium text-white">{e.embassyName}</td>
                      <td className="py-2.5 text-white/60">{e.hostCountry}</td>
                      <td className="py-2.5 text-white/80">{e.totalRegistrants}</td>
                      <td className="py-2.5 text-white/80">{e.pendingVerification}</td>
                      <td className="py-2.5 text-white/80">{e.staffCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* Row 6 — field completion heatmap */}
      <div className="mt-5">
        <Panel title={t('sections.field_completion')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.fieldRates.map((f) => {
              const color = f.completionRate >= 90 ? CHART_COLORS.accent2 : f.completionRate >= 50 ? CHART_COLORS.accent3 : CHART_COLORS.accent4;
              return (
                <div key={f.field} className="rounded-md border border-white/[0.06] p-3">
                  <p className="text-[11px] text-white/60">{f.field}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums" style={{ color }}>{f.completionRate}%</p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${f.completionRate}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-white/[0.06] bg-[#111827] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] p-3 text-center">
      <p className="text-2xl font-bold text-gold">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{label}</p>
    </div>
  );
}
