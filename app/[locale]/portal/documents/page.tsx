import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PortalPlaceholder } from '@/components/portal/PortalPlaceholder';
import { getCurrentUser } from '@/lib/services/auth';

export default async function PortalDocumentsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  return (
    <PortalPlaceholder
      locale={locale}
      eyebrow="My Documents"
      title="Documents"
      body="Upload and manage your identity documents from the Complete Profile page. A dedicated document manager arrives in an upcoming release."
      Icon={FileText}
    />
  );
}
