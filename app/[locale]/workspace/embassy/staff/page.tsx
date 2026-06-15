import { Building2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { StaffAssignmentPanel } from '@/components/workspace/StaffAssignmentPanel';
import { getCurrentUser } from '@/lib/services/auth';
import { getEmbassyById, getEmbassyStaff } from '@/lib/services/embassies';
import { getUnassignedStaff } from '@/lib/services/staff';

interface PageProps {
  params: { locale: string };
}

export default async function EmbassyAdminStaffPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);
  if (!['embassy_admin', 'super_admin'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const embassyId = user.embassyIds[0];

  if (!embassyId) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">Embassy Staff</h1>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-navy-deep py-16 text-center">
          <Building2 className="mb-4 h-10 w-10 text-surface/20" />
          <p className="text-sm text-surface/50">You are not assigned to an embassy yet. Contact your Tenant Administrator.</p>
        </div>
      </div>
    );
  }

  const [embassy, staff, unassigned] = await Promise.all([
    getEmbassyById(embassyId),
    getEmbassyStaff(embassyId),
    getUnassignedStaff(),
  ]);

  if (!embassy) redirect(`/${locale}/workspace/embassy`);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Embassy Staff</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{embassy.name}</h1>
        <p className="mt-1 text-sm text-surface/60">
          {embassy.hostCity}, {embassy.hostCountry}
        </p>
      </header>

      <StaffAssignmentPanel
        embassyId={embassy.id}
        embassyName={embassy.name}
        staff={staff}
        assignable={unassigned.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName }))}
        mode="embassy_admin"
      />
    </div>
  );
}
