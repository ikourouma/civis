import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { EmbassyDetailClient } from '@/components/workspace/EmbassyDetailClient';
import { getCurrentUser } from '@/lib/services/auth';
import { getEmbassyWithStaffAndStats } from '@/lib/services/embassies';
import { searchRegistrants } from '@/lib/services/registrants';
import { getUnassignedStaff } from '@/lib/services/staff';
import { createAdminClient } from '@/lib/supabase/admin';

interface PageProps {
  params: { locale: string; embassyId: string };
}

export default async function EmbassyDetailPage({ params: { locale, embassyId } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['tenant_admin', 'super_admin'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const detail = await getEmbassyWithStaffAndStats(embassyId);
  if (!detail) notFound();

  const [unassigned, registrantResult] = await Promise.all([
    getUnassignedStaff(),
    searchRegistrants({ embassyId, pageSize: 25 }),
  ]);

  const admin = createAdminClient();
  const { data: activity } = await admin
    .from('audit_logs')
    .select('action, metadata, created_at')
    .eq('resource_id', embassyId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <EmbassyDetailClient
      locale={locale as 'en' | 'fr'}
      detail={detail}
      assignable={unassigned.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName }))}
      registrants={registrantResult.registrants.map((r) => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`,
        country: r.countryOfResidence,
        status: r.verificationStatus,
      }))}
      registrantTotal={registrantResult.total}
      activity={(activity ?? []).map((a) => ({
        action: a.action as string,
        createdAt: a.created_at as string,
      }))}
    />
  );
}
