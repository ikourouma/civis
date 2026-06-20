import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PersonalSettings } from '@/components/portal/PersonalSettings';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { getCurrentUser } from '@/lib/services/auth';

export default async function PortalSettingsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  return (
    <WorkspaceShell locale={locale}>
      <PersonalSettings
        fullName={user.fullName ?? ''}
        email={user.email}
        role={user.role}
        diplomaticTitle={user.diplomaticTitle ?? null}
        isStaff={user.role !== 'registrant'}
      />
    </WorkspaceShell>
  );
}
