import { ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PortalPlaceholder } from '@/components/portal/PortalPlaceholder';
import { getCurrentUser } from '@/lib/services/auth';

export default async function PortalPrivacyPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  return (
    <PortalPlaceholder
      locale={locale}
      eyebrow="Privacy & Data Rights"
      title="Privacy & Data Rights"
      body="Your data is held under your government's sovereign infrastructure. Consent management, data export, and withdrawal controls arrive in an upcoming release."
      Icon={ShieldCheck}
    />
  );
}
