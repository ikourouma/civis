import { Building2, CheckCircle2, Clock, Users, UserCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';
import { getMyEmbassy, getEmbassyStats, getEmbassyStaff } from '@/lib/services/embassies';
import { searchRegistrants } from '@/lib/services/registrants';
import { cn } from '@/lib/utils';

const MISSION_TYPE_LABEL: Record<string, string> = {
  embassy: 'Embassy',
  consulate: 'Consulate',
  high_commission: 'High Commission',
  permanent_mission: 'Permanent Mission',
  honorary_consulate: 'Honorary Consulate',
};

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-gold/15 text-gold',
  pending_review: 'bg-gold/15 text-gold',
  active: 'bg-emerald-400/15 text-emerald-400',
  verified: 'bg-emerald-400/15 text-emerald-400',
  draft: 'bg-white/5 text-surface/50',
  rejected: 'bg-red-400/15 text-red-400',
  inactive: 'bg-white/5 text-surface/50',
};

interface PageProps {
  params: { locale: string };
}

export default async function EmbassyWorkspacePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Embassy');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const [embassy, staff] = await Promise.all([
    getMyEmbassy(),
    null as null,
  ]);

  if (!embassy) {
    return (
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('title')}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Embassy Workspace</h1>
        </header>
        <div className="rounded-xl border border-white/5 bg-navy-deep p-10 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-surface/30" />
          <p className="text-sm font-medium text-white">No embassy assigned</p>
          <p className="mt-2 text-xs text-surface/50">
            Contact your Tenant Administrator to assign you to an embassy.
          </p>
        </div>
      </div>
    );
  }

  const [stats, embassyStaff, pendingResult] = await Promise.all([
    getEmbassyStats(embassy.id),
    getEmbassyStaff(embassy.id),
    searchRegistrants({
      embassyId: embassy.id,
      verificationStatus: 'pending_review',
      pageSize: 10,
    }),
  ]);

  const kpiTiles = [
    { label: t('kpi_total'), value: stats.total, Icon: Users, color: 'text-gold' },
    { label: t('kpi_pending'), value: stats.pending, Icon: Clock, color: 'text-amber-400' },
    { label: t('kpi_verified'), value: stats.verified, Icon: CheckCircle2, color: 'text-emerald-400' },
    { label: t('kpi_this_month'), value: stats.thisMonth, Icon: UserCheck, color: 'text-blue-400' },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('title')}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{embassy.name}</h1>
        <p className="mt-1 text-sm text-surface/60">
          {MISSION_TYPE_LABEL[embassy.missionType] ?? embassy.missionType} — {embassy.hostCity},{' '}
          {embassy.hostCountry}
        </p>
      </header>

      {/* Embassy profile card */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Embassy Profile</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
          {embassy.email && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Email</p>
              <p className="mt-1 text-sm text-surface/80">{embassy.email}</p>
            </div>
          )}
          {embassy.phone && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Phone</p>
              <p className="mt-1 text-sm text-surface/80">{embassy.phone}</p>
            </div>
          )}
          {embassy.headOfMission && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Head of Mission</p>
              <p className="mt-1 text-sm text-surface/80">{embassy.headOfMission}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Status</p>
            <span className={cn(
              'mt-1 inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize',
              embassy.status === 'active' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/5 text-surface/50',
            )}>
              {embassy.status}
            </span>
          </div>
        </div>
      </section>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiTiles.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
              <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending review queue */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{t('queue_title')}</h2>
          <span className="rounded bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
            {stats.pending}
          </span>
        </div>

        {pendingResult.registrants.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400/40" />
            <p className="text-sm text-surface/50">No registrants pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingResult.registrants.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-surface/50">{r.nationality} · {r.countryOfResidence}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Completeness bar */}
                  <div className="hidden w-16 sm:block">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${r.profileCompletenessScore}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-center text-[9px] text-surface/40">
                      {r.profileCompletenessScore}%
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded px-2 py-0.5 text-xs font-medium',
                      STATUS_BADGE[r.verificationStatus] ?? 'bg-white/5 text-surface/50',
                    )}
                  >
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Embassy staff */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{t('staff_title')}</h2>
        </div>
        {embassyStaff.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-surface/50">No staff assigned.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {embassyStaff.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[11px] font-semibold text-gold">
                  {(s.fullName?.[0] ?? s.email[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{s.fullName ?? s.email}</p>
                  <p className="text-xs text-surface/50">{s.email}</p>
                </div>
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs capitalize text-surface/60">
                  {s.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
