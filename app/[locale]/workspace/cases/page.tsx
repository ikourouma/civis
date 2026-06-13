import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CasesView } from '@/components/workspace/CasesView';
import { getCurrentUser } from '@/lib/services/auth';
import { getMyEmbassy } from '@/lib/services/embassies';
import { searchRegistrants, getRegistrantById } from '@/lib/services/registrants';
import type { Registrant } from '@/lib/services/registrants';

interface PageProps {
  params: { locale: string };
  searchParams: { selected?: string; tab?: string };
}

export default async function CasesPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Cases');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const embassy = await getMyEmbassy();
  const tab = (searchParams.tab as 'all' | 'pending' | 'approved' | 'rejected') ?? 'all';
  const selectedId = searchParams.selected;

  const verificationStatus = tab === 'pending' ? 'pending_review'
    : tab === 'approved' ? 'verified'
    : tab === 'rejected' ? 'rejected'
    : undefined;

  const [queueResult, selectedRegistrant] = await Promise.all([
    embassy
      ? searchRegistrants({ embassyId: embassy.id, verificationStatus, pageSize: 25 })
      : Promise.resolve({ registrants: [], total: 0 }),
    selectedId ? getRegistrantById(selectedId) : Promise.resolve(null),
  ]);

  return (
    <CasesView
      user={user}
      locale={locale}
      queue={queueResult.registrants}
      total={queueResult.total}
      selectedRegistrant={selectedRegistrant as Registrant | null}
      activeTab={tab}
      hasEmbassy={!!embassy}
    />
  );
}
