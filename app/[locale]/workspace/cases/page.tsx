import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { CasesView } from '@/components/workspace/CasesView';
import { getCurrentUser } from '@/lib/services/auth';
import { getConsentRecord } from '@/lib/services/consent/consent.service';
import { getMyEmbassy } from '@/lib/services/embassies';
import { hasCapability } from '@/lib/services/entitlements/entitlement.service';
import {
  getRegistrantActivity,
  getRegistrantById,
  getRegistrantDocuments,
  getRegistrantNotes,
  searchRegistrants,
} from '@/lib/services/registrants';
import type { Registrant } from '@/lib/services/registrants';

interface PageProps {
  params: { locale: string };
  searchParams: { selected?: string; tab?: string; mode?: string; q?: string };
}

export default async function CasesPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const embassy = await getMyEmbassy();
  const tab = (searchParams.tab as 'all' | 'pending' | 'approved' | 'rejected') ?? 'all';
  const mode = (searchParams.mode as 'queue' | 'search') ?? 'queue';
  const query = searchParams.q ?? '';
  const selectedId = searchParams.selected;

  const canSearch = await hasCapability(user.tenantId ?? '', user.role, 'REGISTRY_SEARCH');

  const verificationStatus = tab === 'pending' ? 'pending_review'
    : tab === 'approved' ? 'verified'
    : tab === 'rejected' ? 'rejected'
    : undefined;

  const useSearch = mode === 'search' && canSearch;

  const [listResult, selectedRegistrant] = await Promise.all([
    embassy
      ? useSearch
        ? searchRegistrants({ embassyId: embassy.id, query: query || undefined, pageSize: 30 })
        : searchRegistrants({ embassyId: embassy.id, verificationStatus, pageSize: 25 })
      : Promise.resolve({ registrants: [], total: 0 }),
    selectedId ? getRegistrantById(selectedId) : Promise.resolve(null),
  ]);

  // Fetch the selected registrant's detail bundle for the inline panel.
  const selected = selectedRegistrant as Registrant | null;
  const [documents, consent, notes, activity] = selected
    ? await Promise.all([
        getRegistrantDocuments(selected.id),
        getConsentRecord(selected.id),
        getRegistrantNotes(selected.id),
        getRegistrantActivity(selected.id),
      ])
    : [[], null, [], []];

  return (
    <CasesView
      user={user}
      locale={locale}
      queue={listResult.registrants}
      total={listResult.total}
      selectedRegistrant={selected}
      selectedDocuments={documents}
      selectedConsent={consent}
      selectedNotes={notes}
      selectedActivity={activity}
      selectedEmbassyName={embassy?.name ?? null}
      activeTab={tab}
      mode={mode}
      query={query}
      canSearch={canSearch}
      hasEmbassy={!!embassy}
    />
  );
}
