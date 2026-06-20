import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { NotificationsClient } from '@/components/workspace/NotificationsClient';
import { getCurrentUser } from '@/lib/services/auth';
import { getMyNotifications } from '@/lib/services/notifications';

interface PageProps {
  params: { locale: string };
}

export default async function NotificationsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const notifications = await getMyNotifications(100);
  return <NotificationsClient initial={notifications} />;
}
