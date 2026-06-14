import { Settings } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PortalPlaceholder } from '@/components/portal/PortalPlaceholder';
import { getCurrentUser } from '@/lib/services/auth';

export default async function PortalSettingsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  return (
    <PortalPlaceholder
      locale={locale}
      eyebrow="Settings"
      title="My Settings"
      body="Account settings, password, and communication preferences arrive in an upcoming release."
      Icon={Settings}
    />
  );
}
