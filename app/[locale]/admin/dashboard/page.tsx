import { BarChart3, Globe2, ShieldCheck, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { TenantsTable } from '@/components/admin/TenantsTable';
import { getCurrentUser } from '@/lib/services/auth';
import { getPlatformStats, getTenantsWithUserCounts } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

export default async function AdminDashboardPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Workspace.admin');

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const [stats, tenants] = await Promise.all([
    getPlatformStats(),
    getTenantsWithUserCounts(),
  ]);

  const tiles = [
    { key: 'total_tenants', value: stats.totalTenants, Icon: Globe2, href: '/admin/tenants' },
    { key: 'total_users', value: stats.totalUsers, Icon: Users, href: '/admin/users' },
    { key: 'live_deployments', value: stats.activeTenants, Icon: ShieldCheck, href: '/admin/tenants' },
    { key: 'in_pilot', value: stats.pilotTenants, Icon: BarChart3, href: '/admin/tenants' },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ key, value, Icon, href }) => (
          <Link
            key={key}
            href={href}
            className="group rounded-xl border border-white/5 bg-navy-deep p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                {t(key)}
              </p>
              <Icon className="h-4 w-4 text-gold/70" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold text-white">{value.toLocaleString(locale)}</p>
          </Link>
        ))}
      </div>

      <TenantsTable tenants={tenants} />
    </div>
  );
}
