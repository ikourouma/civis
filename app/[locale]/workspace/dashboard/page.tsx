import { ArrowRight, BarChart3, Building2, Clock, Plus, UserCog, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { ConsularDashboard } from '@/components/workspace/ConsularDashboard';
import { DonutChart, HorizontalBarChart, TrendAreaChart } from '@/components/intelligence/charts';
import {
  getCountryDistribution,
  getDashboardKPIs,
  getFieldCompletionRates,
  getProfessionDistribution,
  getRegistrationStatusBreakdown,
  getRegistrationTrends,
} from '@/lib/services/analytics';
import { getCurrentUser } from '@/lib/services/auth';
import { getEmbassiesWithCounts } from '@/lib/services/embassies';
import { getCurrentTenant } from '@/lib/services/tenants';
import { createAdminClient } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { locale: string };
}

const TIER_LABEL: Record<string, string> = { cloud: 'Cloud', government: 'Government', sovereign: 'Sovereign' };
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-400/15 text-emerald-400',
  pilot: 'bg-gold/15 text-gold',
  suspended: 'bg-red-400/15 text-red-400',
  archived: 'bg-white/5 text-surface/50',
};

export default async function WorkspaceDashboardPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Workspace');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  // Consular officers get a focused, embassy-scoped dashboard (D12).
  if (user.role === 'consular_officer') {
    return <ConsularDashboard user={user} locale={locale as 'en' | 'fr'} />;
  }

  const tenant = await getCurrentTenant();
  const isTenantAdmin = ['tenant_admin', 'super_admin'].includes(user.role);
  const tenantId = user.tenantId;

  const admin = createAdminClient();

  // Live KPIs (tenant-scoped)
  const [embassyCount, staffCount, registrantCount, pendingCount] = tenantId
    ? await Promise.all([
        admin.from('civis_embassies').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
        admin.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).neq('role', 'registrant'),
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('verification_status', 'pending_review'),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }];

  const embassies = await getEmbassiesWithCounts();

  // Operational analytics (tenant-scoped)
  const analyticsScope = tenantId ? { tenantId } : null;
  const [trends, statusBreakdown, topCountries, topProfessions, analyticsKpis, fieldRates] = analyticsScope
    ? await Promise.all([
        getRegistrationTrends(analyticsScope, { from: new Date(Date.now() - 90 * 24 * 3.6e6), period: 'month' }),
        getRegistrationStatusBreakdown(analyticsScope),
        getCountryDistribution(analyticsScope, 5),
        getProfessionDistribution(analyticsScope, 5),
        getDashboardKPIs(analyticsScope),
        getFieldCompletionRates(analyticsScope),
      ])
    : [[], [], [], [], null, []];
  const lowFields = (fieldRates as { field: string; completionRate: number }[]).filter((f) => f.completionRate < 50);

  // Recent activity across the tenant
  let activity: { action: string; created_at: string }[] = [];
  if (tenantId) {
    const { data: tenantUsers } = await admin.from('profiles').select('id').eq('tenant_id', tenantId);
    const ids = (tenantUsers as { id: string }[] | null)?.map((u) => u.id) ?? [];
    if (ids.length > 0) {
      const { data } = await admin
        .from('audit_logs')
        .select('action, created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(10);
      activity = (data as { action: string; created_at: string }[]) ?? [];
    }
  }

  const tiles = [
    { label: 'Total Embassies', value: embassyCount.count ?? 0, Icon: Building2, href: '/workspace/embassy/manage' },
    { label: 'Total Staff', value: staffCount.count ?? 0, Icon: UserCog, href: '/workspace/users' },
    { label: 'Total Registrants', value: registrantCount.count ?? 0, Icon: Users, href: '/workspace/registry' },
    { label: 'Pending Verification', value: pendingCount.count ?? 0, Icon: Clock, href: '/workspace/registry?status=pending_review' },
  ];

  const quickActions = [
    { label: 'Create Embassy', href: '/workspace/embassy/manage', Icon: Plus },
    { label: 'Add Staff Member', href: '/workspace/users', Icon: UserCog },
    { label: 'View Registry', href: '/workspace/registry', Icon: Users },
    { label: 'View Analytics', href: '/intelligence/dashboard', Icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('common.welcome')}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{user.fullName ?? user.email}</h1>
        {tenant && (
          <p className="mt-1 flex items-center gap-2 text-sm text-surface/60">
            {tenant.name}
            <span className="rounded bg-navy/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface">
              {TIER_LABEL[tenant.deploymentTier] ?? tenant.deploymentTier}
            </span>
            <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', STATUS_BADGE[tenant.status])}>
              {tenant.status}
            </span>
          </p>
        )}
      </header>

      {/* KPIs — clickable (D10) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-xl border border-white/5 bg-navy-deep p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
              <Icon className="h-4 w-4 text-gold/70" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      {isTenantAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-navy-deep p-4 transition-colors hover:border-gold/30"
            >
              <Icon className="h-5 w-5 text-gold/70" />
              <span className="text-sm font-medium text-white">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Embassy overview */}
      {embassies.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Embassies</h2>
            <Link href="/workspace/embassy/manage" className="text-xs font-medium text-gold hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {embassies.slice(0, 6).map((e) => (
              <Link
                key={e.id}
                href={`/workspace/embassy/${e.id}`}
                className="rounded-xl border border-white/5 bg-navy-deep p-4 transition-colors hover:border-gold/30"
              >
                <p className="truncate text-sm font-semibold text-white">{e.name}</p>
                <p className="mt-1 text-xs text-surface/50">{e.staffCount} staff · {e.registrantCount} registrants</p>
                <span className={cn('mt-3 inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase', e.status === 'active' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/5 text-surface/40')}>
                  {e.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Registration overview + quick intelligence */}
      {analyticsScope && (analyticsKpis?.totalRegistrants ?? 0) > 0 && (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Registration Overview</h2>
              <Link href="/intelligence/dashboard" className="text-xs font-medium text-gold hover:underline">
                View Full Intelligence Dashboard →
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-navy-deep p-5 lg:col-span-2">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-surface/40">Registration Trend</p>
                <TrendAreaChart data={trends as typeof trends} />
              </div>
              <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-surface/40">Status</p>
                <DonutChart data={(statusBreakdown as { label: string; count: number }[]).map((s) => ({ label: s.label, count: s.count }))} height={200} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-surface/40">Top Countries</p>
              <HorizontalBarChart data={(topCountries as { countryName: string; count: number }[]).map((c) => ({ label: c.countryName, count: c.count }))} height={200} />
            </div>
            <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-surface/40">Top Professions</p>
              <HorizontalBarChart data={(topProfessions as { occupation: string; count: number }[]).map((p) => ({ label: p.occupation, count: p.count }))} height={200} />
            </div>
            <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-surface/40">Data Quality</p>
              <p className="text-4xl font-bold text-white">{analyticsKpis?.avgCompletenessScore ?? 0}%</p>
              <p className="text-xs text-surface/50">Average profile completeness</p>
              {lowFields.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-red-400/80">Fields below 50%</p>
                  <ul className="space-y-1">
                    {lowFields.map((f) => (
                      <li key={f.field} className="flex justify-between text-xs">
                        <span className="text-surface/60">{f.field}</span>
                        <span className="text-red-400">{f.completionRate}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Recent activity */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
        </div>
        {activity.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-surface/40">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm capitalize text-surface/70">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="text-xs text-surface/40">{new Date(a.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
