import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PlatformUsersClient } from '@/components/admin/PlatformUsersClient';
import { getCurrentUser } from '@/lib/services/auth';
import type { PlatformRole } from '@/lib/services/auth/auth.types';
import { getPlatformUsers, getPlatformUserStats } from '@/lib/services/admin/platform-users.service';
import { getAllTenants } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
  searchParams: { tenant?: string; role?: string; status?: string; q?: string };
}

export default async function AdminUsersPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const [users, stats, tenants] = await Promise.all([
    getPlatformUsers({
      tenantId: searchParams.tenant,
      role: searchParams.role as PlatformRole | undefined,
      status: searchParams.status as 'active' | 'inactive' | undefined,
      search: searchParams.q,
    }),
    getPlatformUserStats(),
    getAllTenants(),
  ]);

  return (
    <PlatformUsersClient
      users={users}
      stats={stats}
      tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
      filters={{ tenant: searchParams.tenant, role: searchParams.role, status: searchParams.status, q: searchParams.q }}
    />
  );
}
