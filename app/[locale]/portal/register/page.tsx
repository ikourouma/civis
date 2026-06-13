import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';
import { getMyRegistrantRecord } from '@/lib/services/registrants';
import { RegistrationWizard } from '@/components/portal/RegistrationWizard';

interface PageProps {
  params: { locale: string };
}

export default async function RegisterPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  // Already registered — redirect to portal dashboard
  const existing = await getMyRegistrantRecord(user.id);
  if (existing) redirect(`/${locale}/portal/dashboard`);

  return <RegistrationWizard user={user} locale={locale} />;
}
