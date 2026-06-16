'use client';

import { ArrowRight, Download, LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Sparkline } from '@/components/intelligence/charts';
import { CountUp } from '@/components/intelligence/KpiStrip';
import { CHART_COLORS } from '@/lib/charts/chart-config';
import type { CountryDistribution, DashboardKPIs } from '@/lib/services/analytics';

interface Props {
  locale: 'en' | 'fr';
  isEmbassyScoped: boolean;
  countryName: string;
  embassyName: string;
  sealUrl?: string;
  kpis: DashboardKPIs;
  countries: CountryDistribution[];
  cities: { city: string; country: string; count: number }[];
  trends: { date: string; count: number }[];
  engagement: { returnInterest: number; investmentInterest: number };
}

export function ExecutiveDashboard({
  locale,
  isEmbassyScoped,
  countryName,
  embassyName,
  sealUrl,
  kpis,
  countries,
  cities,
  trends,
  engagement,
}: Props) {
  const t = useTranslations('intelligence.executive');
  const loc = useLocale();
  const topCountry = countries[0];
  const verifiedPct = kpis.totalRegistrants ? Math.round((kpis.activeRegistrants / kpis.totalRegistrants) * 100) : 0;
  const now = new Date().toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' });

  const geoItems = isEmbassyScoped
    ? cities.map((c) => ({ label: c.city, count: c.count, flag: '' }))
    : countries.map((c) => ({ label: c.countryName, count: c.count, flag: c.flagEmoji }));
  const geoMax = Math.max(1, ...geoItems.map((g) => g.count));

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      {/* Minimal header */}
      <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          {sealUrl && <img src={sealUrl} alt={countryName} className="h-8 w-8 object-contain" />}
          <span className="text-base font-bold tracking-[0.2em]">CIVIS<span className="text-gold">.</span></span>
          <span className="text-sm text-white/50">{isEmbassyScoped ? embassyName : countryName}</span>
        </div>
        <form action={`/${locale}/auth/signout`} method="post">
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-gold">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero KPI */}
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            {isEmbassyScoped ? t('embassy_title') : t('title')}
          </p>
          <p className="mt-4 text-7xl font-bold tabular-nums">
            <CountUp value={kpis.totalRegistrants} />
          </p>
          <p className="mt-2 text-sm text-white/60">{t('hero_label')}</p>
          <p className="mt-1 text-xs text-white/30">{t('subtitle', { country: isEmbassyScoped ? embassyName : countryName, timestamp: now })}</p>
        </div>

        {/* Three insight cards */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Card title={isEmbassyScoped ? 'Top City' : t('top_host_country')}>
            {isEmbassyScoped ? (
              <p className="text-2xl font-bold">{cities[0]?.city ?? '—'}</p>
            ) : (
              <p className="flex items-center gap-2 text-2xl font-bold">
                <span>{topCountry?.flagEmoji}</span> {topCountry?.countryName ?? '—'}
              </p>
            )}
            <p className="mt-1 text-sm text-white/50">
              {isEmbassyScoped ? cities[0]?.count ?? 0 : topCountry?.count ?? 0} registrants
              {!isEmbassyScoped && topCountry ? ` (${topCountry.percentage}%)` : ''}
            </p>
          </Card>

          <Card title={t('momentum')}>
            <p className="text-2xl font-bold">+{kpis.thisMonthRegistrations}</p>
            <p className="mt-1 text-sm" style={{ color: kpis.registrationGrowthPercent >= 0 ? CHART_COLORS.accent2 : CHART_COLORS.accent4 }}>
              {kpis.registrationGrowthPercent >= 0 ? '+' : ''}{kpis.registrationGrowthPercent}% {t('vs_last_month')}
            </p>
            <div className="mt-2"><Sparkline data={trends} /></div>
          </Card>

          <Card title={t('verification_status')}>
            <p className="text-2xl font-bold">{kpis.activeRegistrants} <span className="text-sm font-normal text-white/40">active</span></p>
            <p className="mt-1 text-sm text-white/50">{kpis.pendingVerification} pending · {verifiedPct}% verified</p>
          </Card>
        </div>

        {/* Geographic distribution */}
        <div className="mt-10 rounded-md border border-white/[0.06] bg-[#111827] p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
            {isEmbassyScoped ? 'Top Cities in Jurisdiction' : t('top_host_country')}
          </p>
          <ul className="space-y-2.5">
            {geoItems.map((g) => (
              <li key={g.label} className="flex items-center gap-3">
                {g.flag && <span className="w-6 text-base leading-none">{g.flag}</span>}
                <span className="w-32 shrink-0 truncate text-sm text-white/80">{g.label}</span>
                <span className="relative h-3 flex-1 overflow-hidden rounded-sm bg-white/[0.04]">
                  <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${(g.count / geoMax) * 100}%`, backgroundColor: CHART_COLORS.primary }} />
                </span>
                <span className="w-10 text-right text-sm tabular-nums text-white/70">{g.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Engagement */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Card title={t('momentum')}>
            <p className="text-3xl font-bold text-gold">{engagement.returnInterest}%</p>
            <p className="mt-1 text-sm text-white/50">Interest in Returning</p>
          </Card>
          <Card title={t('momentum')}>
            <p className="text-3xl font-bold text-gold">{engagement.investmentInterest}%</p>
            <p className="mt-1 text-sm text-white/50">Interest in Investing</p>
          </Card>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`/api/briefing?locale=${locale}`}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            {isEmbassyScoped ? t('download_embassy_briefing') : t('download_briefing')}
          </a>
          <Link
            href="/intelligence/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
          >
            {t('view_full')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-[#111827] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
