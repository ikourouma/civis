import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { DocumentReviewClient } from '@/components/workspace/DocumentReviewClient';
import { requireCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import { getDocumentsForReview } from '@/lib/services/documents/document-review.service';
import { getMyEmbassy } from '@/lib/services/embassies';

interface PageProps {
  params: { locale: string };
  searchParams: { status?: string; type?: string; q?: string };
}

export default async function DocumentsPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);
  await requireCapability('REGISTRANT_VIEW_DOCUMENTS');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const embassy = await getMyEmbassy();
  const documents = await getDocumentsForReview(
    { tenantId: user.tenantId ?? '', embassyId: embassy?.id },
    { status: searchParams.status, documentType: searchParams.type, search: searchParams.q },
  );

  return (
    <DocumentReviewClient
      documents={documents}
      filters={{ status: searchParams.status, type: searchParams.type, q: searchParams.q }}
    />
  );
}
