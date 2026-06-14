import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProfileCompletion } from '@/components/portal/ProfileCompletion';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { getCurrentUser } from '@/lib/services/auth';
import { getSignedDocUrl } from '@/lib/services/documents/document.actions';
import { getMyRegistrantRecord } from '@/lib/services/registrants';

interface PageProps {
  params: { locale: string };
}

export default async function ProfileCompletePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const registrant = await getMyRegistrantRecord(user.id);
  if (!registrant) redirect(`/${locale}/portal/dashboard`);

  const photoUrl = registrant.profilePhotoUrl
    ? await getSignedDocUrl(registrant.profilePhotoUrl)
    : null;

  return (
    <WorkspaceShell locale={locale}>
      <ProfileCompletion
        locale={locale as 'en' | 'fr'}
        registrant={registrant}
        initialPhotoUrl={photoUrl}
      />
    </WorkspaceShell>
  );
}
