import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { RegistryBrowser } from '@/components/registrants/RegistryBrowser';
import { requireCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import { getMyEmbassy } from '@/lib/services/embassies';
import { hasCapability } from '@/lib/services/entitlements/entitlement.service';
import { searchRegistrants } from '@/lib/services/registrants';
import { getCurrentTenant } from '@/lib/services/tenants';

interface PageProps {
  params: { locale: string };
  searchParams: {
    q?: string;
    status?: string;
    country?: string;
    generation?: string;
    minComplete?: string;
    page?: string;
  };
}

type ScopeKind = 'embassy' | 'tenant' | 'platform';

export default async function RegistryPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);
  await requireCapability('REGISTRY_VIEW_LIST');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const tenantId = user.tenantId ?? '';

  // Determine scope by role.
  let scopeKind: ScopeKind = 'tenant';
  let embassyId: string | undefined;
  let scopeLabel = '';

  if (user.role === 'super_admin') {
    scopeKind = 'platform';
    scopeLabel = 'Showing all registrants across all tenants';
  } else if (user.role === 'embassy_admin' || user.role === 'consular_officer') {
    const embassy = await getMyEmbassy();
    scopeKind = 'embassy';
    embassyId = embassy?.id;
    scopeLabel = `Showing registrants for: ${embassy?.name ?? 'your embassy'}`;
  } else {
    const tenant = await getCurrentTenant();
    scopeKind = 'tenant';
    scopeLabel = `Showing all registrants for: ${tenant?.officialCountryName ?? tenant?.name ?? 'your government'}`;
  }

  const verificationStatus = searchParams.status as
    | 'unverified' | 'pending_review' | 'verified' | 'rejected' | undefined;

  const [scopedCount, filtered, canViewProfile, canSearch, canExport] = await Promise.all([
    searchRegistrants({ embassyId, pageSize: 1 }).then((r) => r.total),
    searchRegistrants({
      query: searchParams.q,
      verificationStatus,
      countryOfResidence: searchParams.country,
      embassyId,
      page,
      pageSize: 50,
    }),
    hasCapability(tenantId, user.role, 'REGISTRY_VIEW_PROFILE'),
    hasCapability(tenantId, user.role, 'REGISTRY_SEARCH'),
    hasCapability(tenantId, user.role, 'REGISTRY_EXPORT_CSV'),
  ]);

  // In-memory post-filters for fields the query API doesn't cover.
  let rows = filtered.registrants;
  if (searchParams.generation) {
    rows = rows.filter((r) => r.generation === searchParams.generation);
  }
  if (searchParams.minComplete) {
    const min = parseInt(searchParams.minComplete, 10);
    if (!Number.isNaN(min)) rows = rows.filter((r) => r.profileCompletenessScore >= min);
  }

  const totalPages = Math.ceil(filtered.total / 50);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Sovereign Registry</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Registrants</h1>
        <p className="mt-1 text-sm text-surface/60">Browse, search, and review diaspora registrants.</p>
      </header>

      <RegistryBrowser
        registrants={rows}
        total={filtered.total}
        page={page}
        totalPages={totalPages}
        scope={{ kind: scopeKind, label: scopeLabel, count: scopedCount }}
        flags={{ canViewProfile, canSearch, canExport }}
        filters={{
          q: searchParams.q,
          status: searchParams.status,
          country: searchParams.country,
          generation: searchParams.generation,
          minComplete: searchParams.minComplete,
        }}
      />
    </div>
  );
}
