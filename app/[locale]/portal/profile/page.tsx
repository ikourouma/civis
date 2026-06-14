import { User } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PortalPlaceholder } from '@/components/portal/PortalPlaceholder';
import { getCurrentUser } from '@/lib/services/auth';

export default async function PortalProfilePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  return (
    <PortalPlaceholder
      locale={locale}
      eyebrow="My Profile"
      title="My Profile"
      body="View and edit your registration profile from the Complete Profile page. A consolidated profile view arrives in an upcoming release."
      Icon={User}
    />
  );
}
