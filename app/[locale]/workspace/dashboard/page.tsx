import { ArrowRight, BarChart3, Building2, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { getCurrentTenant } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

const TIER_LABEL: Record<string, string> = {
  cloud: 'Cloud',
  government: 'Government',
  sovereign: 'Sovereign',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-success-teal/15 text-success-teal',
  pilot: 'bg-gold/15 text-gold',
  suspended: 'bg-red-400/15 text-red-400',
  archived: 'bg-white/5 text-surface/50',
};

export default async function WorkspaceDashboardPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Workspace');

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/auth/signin`);
  }

  const tenant = await getCurrentTenant();

  const modules = [
    { key: 'registry', href: '/workspace/registry', Icon: Users },
    { key: 'embassies', href: '/workspace/embassy', Icon: Building2 },
    { key: 'analytics', href: '/intelligence/dashboard', Icon: BarChart3 },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t('common.welcome')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {user.fullName ?? user.email}
        </h1>
        <p className="mt-2 text-sm text-surface/60">
          {t('common.role_label')}: <span className="text-surface/80">{user.role}</span>
        </p>
      </header>

      {/* Tenant card */}
      {tenant && (
        <section className="mb-10 rounded-2xl border border-white/5 bg-navy-deep p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">
            {t('common.tenant_label')}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{tenant.name}</h2>
              <p className="mt-1 text-xs text-surface/60">
                {tenant.officialCountryName ?? tenant.name} · {tenant.countryCode}
                {tenant.region ? ` · ${tenant.region}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded bg-navy/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface">
                {TIER_LABEL[tenant.deploymentTier] ?? tenant.deploymentTier}
              </span>
              <span
                className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[tenant.status] ?? ''}`}
              >
                {tenant.status}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Module cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {modules.map(({ key, href, Icon }) => (
          <Link
            key={key}
            href={href}
            className="group flex h-full flex-col rounded-2xl border border-white/5 bg-navy-deep p-6 transition-colors hover:border-gold/30"
          >
            <Icon className="h-5 w-5 text-gold/70" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-white">
              {t(`nav.${key}`)}
            </h3>
            <p className="mt-2 flex-1 text-xs text-surface/50">
              {t('common.coming_soon')}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gold/80 group-hover:text-gold">
              {t('common.open')}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
