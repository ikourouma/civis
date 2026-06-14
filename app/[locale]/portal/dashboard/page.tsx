import { ArrowRight, CheckCircle2, Clock, FileText, ShieldCheck, UserPlus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { getCurrentUser } from '@/lib/services/auth';
import { getMyDocumentCount } from '@/lib/services/documents/document.actions';
import { getMyRegistrantRecord } from '@/lib/services/registrants';
import { createAdminClient } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { locale: string };
}

const STATUS_BADGE: Record<string, string> = {
  basic_registered: 'bg-gold/15 text-gold',
  submitted: 'bg-amber-400/15 text-amber-400',
  active: 'bg-emerald-400/15 text-emerald-400',
  rejected: 'bg-red-400/15 text-red-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function PortalDashboardPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('portal.dashboard');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const registrant = await getMyRegistrantRecord(user.id);

  // No registrant record yet → send to the registration flow
  if (!registrant) redirect(`/${locale}/portal/register`);

  const documentCount = await getMyDocumentCount();
  const firstName = user.fullName?.split(' ')[0] ?? registrant.firstName;
  const completeness = registrant.profileCompletenessScore;

  // Recent activity (admin read — registrants cannot read audit_logs under RLS)
  const admin = createAdminClient();
  const { data: activity } = await admin
    .from('audit_logs')
    .select('action, created_at')
    .eq('resource_id', registrant.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const statusKey =
    registrant.registrationStatus === 'active'
      ? 'status_active'
      : registrant.registrationStatus === 'submitted'
      ? 'status_submitted'
      : 'status_basic';

  const stats = [
    { label: t('stat_status'), value: t(statusKey), Icon: ShieldCheck },
    { label: t('stat_completeness'), value: `${completeness}%`, Icon: Clock },
    { label: t('stat_documents'), value: String(documentCount), Icon: FileText },
    { label: t('stat_account_created'), value: formatDate(registrant.createdAt), Icon: CheckCircle2 },
  ];

  const dash = 2 * Math.PI * 42;

  return (
    <WorkspaceShell locale={locale}>
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white">{t('welcome', { first_name: firstName })}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-surface/60">
            <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', STATUS_BADGE[registrant.registrationStatus] ?? 'bg-white/5 text-surface/60')}>
              {t(statusKey)}
            </span>
            <span>· {t('stat_completeness')}: {completeness}%</span>
          </p>
        </header>

        {/* Completion progress card */}
        {completeness < 100 && registrant.registrationStatus !== 'active' && (
          <div className="flex items-center gap-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.08] to-transparent p-6">
            <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#C9A84C" strokeWidth="8" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - completeness / 100)} />
            </svg>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{t('completion_title', { percent: completeness })}</h2>
              <p className="mt-1 text-sm text-surface/60">{t('completion_body')}</p>
              <Link href="/portal/profile/complete" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90">
                {t('continue_cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
                <Icon className="h-4 w-4 text-gold/70" />
              </div>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[
            { href: '/portal/profile/complete', label: t('quick_links.complete_profile'), Icon: UserPlus, highlight: completeness < 100 },
            { href: '/portal/documents', label: t('quick_links.documents'), Icon: FileText },
            { href: '/portal/privacy', label: t('quick_links.privacy'), Icon: ShieldCheck },
            { href: '/portal/settings', label: t('quick_links.settings'), Icon: Clock },
          ].map(({ href, label, Icon, highlight }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-navy-deep p-4 transition-colors hover:border-gold/30',
                highlight ? 'border-gold/30' : 'border-white/5',
              )}
            >
              <Icon className={cn('h-5 w-5', highlight ? 'text-gold' : 'text-surface/50')} />
              <span className="text-sm font-medium text-white">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          <div className="border-b border-white/5 px-6 py-4">
            <h2 className="text-sm font-semibold text-white">{t('recent_activity')}</h2>
          </div>
          {(activity ?? []).length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-surface/40">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {(activity ?? []).map((a, i) => (
                <li key={i} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-surface/70">{(a.action as string).replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="text-xs text-surface/40">{relativeTime(a.created_at as string)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
}
