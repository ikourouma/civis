import { Settings } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';

interface PageProps {
  params: { locale: string };
}

export default async function SettingsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  if (!['super_admin', 'tenant_admin'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Configuration</p>
      <h1 className="mt-2 text-3xl font-bold text-white">Settings</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-navy-deep py-20 text-center">
        <Settings className="mb-4 h-10 w-10 text-surface/20" />
        <p className="text-sm font-medium text-white">Coming in Mission 005</p>
        <p className="mt-2 text-xs text-surface/50">
          Tenant configuration and settings will be available in the next mission.
        </p>
      </div>
    </div>
  );
}
