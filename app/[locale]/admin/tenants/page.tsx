import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { TenantsManagement } from '@/components/admin/TenantsManagement';
import { getCurrentUser } from '@/lib/services/auth';
import { getTenantsAdminView } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
}

export default async function AdminTenantsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const tenants = await getTenantsAdminView();

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Sovereign Command</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Tenant Management</h1>
        <p className="mt-2 text-sm text-surface/60">Manage sovereign government deployments</p>
      </header>

      <TenantsManagement tenants={tenants} />
    </div>
  );
}
