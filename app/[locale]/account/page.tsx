import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';
import { getCurrentTenant } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

export default async function AccountPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Account');
  const tRoles = await getTranslations('Roles');

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/auth/signin`);
  }

  const tenant = user.tenantId ? await getCurrentTenant() : null;

  const lastSignIn = user.lastSignInAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(user.lastSignInAt),
      )
    : t('notSet');

  const rows: { label: string; value: string }[] = [
    { label: t('fullName'), value: user.fullName ?? t('notSet') },
    { label: t('email'), value: user.email },
    { label: t('accountType'), value: tRoles(user.role) },
    { label: t('tenant'), value: tenant?.name ?? t('noTenant') },
    { label: t('status'), value: user.isActive ? t('active') : t('inactive') },
    { label: t('lastSignIn'), value: lastSignIn },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('subtitle')}</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{t('profileSection')}</h2>
        </div>
        <dl className="divide-y divide-white/5">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center">
              <dt className="text-xs font-semibold uppercase tracking-widest text-surface/40 sm:w-48 sm:shrink-0">
                {label}
              </dt>
              <dd className="text-sm text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-6 rounded-lg border border-white/5 bg-navy-deep/50 px-4 py-3 text-xs text-surface/50">
        {t('editNote')}
      </p>
    </div>
  );
}
