import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { RegistrantDetail } from '@/components/registrants/RegistrantDetail';
import { requireCapability } from '@/lib/entitlements/guards';
import { getConsentRecord } from '@/lib/services/consent/consent.service';
import { getEmbassyById } from '@/lib/services/embassies';
import {
  getRegistrantActivity,
  getRegistrantById,
  getRegistrantDocuments,
  getRegistrantNotes,
} from '@/lib/services/registrants';

interface PageProps {
  params: { locale: string; id: string };
}

export default async function RegistrantDetailPage({ params: { locale, id } }: PageProps) {
  setRequestLocale(locale);
  await requireCapability('REGISTRY_VIEW_PROFILE');

  const registrant = await getRegistrantById(id);
  if (!registrant) notFound();

  const [embassy, documents, consent, notes, activity] = await Promise.all([
    registrant.embassyId ? getEmbassyById(registrant.embassyId) : Promise.resolve(null),
    getRegistrantDocuments(id),
    getConsentRecord(id),
    getRegistrantNotes(id),
    getRegistrantActivity(id),
  ]);

  return (
    <RegistrantDetail
      locale={locale}
      registrant={registrant}
      embassyName={embassy?.name ?? null}
      documents={documents}
      consent={consent}
      notes={notes}
      activity={activity}
      variant="page"
    />
  );
}
