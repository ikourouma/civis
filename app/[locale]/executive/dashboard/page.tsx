import { BarChart3, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { locale: string };
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export default async function ExecutiveDashboard({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('executive');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const isEmbassyScoped = user.embassyIds.length > 0;
  const supabase = await createClient();

  // Tenant (country) name
  let countryName = 'Your Nation';
  if (user.tenantId) {
    const { data: tenant } = await supabase
      .from('civis_tenants')
      .select('name, official_country_name')
      .eq('id', user.tenantId)
      .maybeSingle();
    countryName = (tenant?.official_country_name as string) ?? (tenant?.name as string) ?? countryName;
  }

  // Embassy name (embassy-scoped Ambassador)
  let embassyName = '';
  if (isEmbassyScoped) {
    const { data: embassy } = await supabase
      .from('civis_embassies')
      .select('name')
      .eq('id', user.embassyIds[0]!)
      .maybeSingle();
    embassyName = (embassy?.name as string) ?? 'Your Embassy';
  }

  // Counts — RLS auto-scopes these to the embassy (Ambassador) or whole tenant (Minister)
  const countOf = async (filter?: (q: ReturnType<typeof baseCount>) => ReturnType<typeof baseCount>) => {
    let q = baseCount();
    if (filter) q = filter(q);
    const { count } = await q;
    return count ?? 0;
  };
  function baseCount() {
    return supabase.from('civis_registrants').select('id', { count: 'exact', head: true });
  }

  const [total, verified, pending, thisMonth] = await Promise.all([
    countOf(),
    countOf((q) => q.eq('verification_status', 'verified')),
    countOf((q) => q.eq('verification_status', 'pending_review')),
    countOf((q) => q.gte('created_at', startOfMonthISO())),
  ]);

  // Recent registrants
  const { data: recent } = await supabase
    .from('civis_registrants')
    .select('first_name, last_name, country_of_residence, verification_status, created_at')
    .order('created_at', { ascending: false })
    .limit(8);

  const title = isEmbassyScoped
    ? t('embassy_dashboard_title', { embassy_name: embassyName })
    : t('national_dashboard_title', { country_name: countryName });

  const tiles = [
    { label: t('kpi_total'), value: total, Icon: Users, color: 'text-gold' },
    { label: t('kpi_pending'), value: pending, Icon: Clock, color: 'text-amber-400' },
    { label: t('kpi_verified'), value: verified, Icon: CheckCircle2, color: 'text-emerald-400' },
    { label: t('kpi_this_month'), value: thisMonth, Icon: BarChart3, color: 'text-blue-400' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {isEmbassyScoped ? t('scope_embassy') : t('scope_national')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-surface/60">
          <MapPin className="h-4 w-4 text-surface/40" />
          {isEmbassyScoped ? embassyName : countryName}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className="text-3xl font-bold text-white">{value.toLocaleString(locale)}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{t('recent_registrations')}</h2>
        </div>
        {(recent ?? []).length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-surface/40">{t('no_registrations')}</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {(recent ?? []).map((r, i) => (
              <li key={i} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {r.first_name as string} {r.last_name as string}
                  </p>
                  <p className="text-xs text-surface/40">{(r.country_of_residence as string) || '—'}</p>
                </div>
                <span className="text-xs capitalize text-surface/50">
                  {(r.verification_status as string).replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
