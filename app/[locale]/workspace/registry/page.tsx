import { BarChart3, CheckCircle2, Clock, Download, FileText, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/services/auth';
import { searchRegistrants, getRegistrantStats } from '@/lib/services/registrants';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { locale: string };
  searchParams: {
    q?: string;
    status?: string;
    country?: string;
    page?: string;
  };
}

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-gold/15 text-gold',
  verified: 'bg-emerald-400/15 text-emerald-400',
  rejected: 'bg-red-400/15 text-red-400',
  unverified: 'bg-white/5 text-surface/50',
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function RegistryPage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Registry');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  if (!['tenant_admin', 'super_admin', 'analyst'].includes(user.role)) {
    redirect(`/${locale}/workspace/dashboard`);
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const verificationStatus = searchParams.status as
    | 'unverified'
    | 'pending_review'
    | 'verified'
    | 'rejected'
    | undefined;

  const tenantId = user.tenantId ?? '';

  const [stats, { registrants, total }] = await Promise.all([
    getRegistrantStats(tenantId),
    searchRegistrants({
      query: searchParams.q,
      verificationStatus,
      countryOfResidence: searchParams.country,
      page,
      pageSize: 50,
    }),
  ]);

  const totalPages = Math.ceil(total / 50);

  const summaryTiles = [
    { label: t('tile_total'), value: stats.total, Icon: Users, color: 'text-gold' },
    { label: t('tile_verified'), value: stats.verified, Icon: CheckCircle2, color: 'text-emerald-400' },
    { label: t('tile_pending'), value: stats.pending, Icon: Clock, color: 'text-amber-400' },
    { label: t('tile_draft'), value: stats.draft, Icon: FileText, color: 'text-blue-400' },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-surface/60">{t('subtitle')}</p>
        </div>
        <a
          href={`/api/registry/export?format=csv`}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/60 transition-colors hover:border-gold/30 hover:text-gold"
          download
        >
          <Download className="h-4 w-4" />
          {t('export_csv')}
        </a>
      </header>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryTiles.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
              <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name or email…"
          className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ''}
          className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:border-gold/40 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending_review">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="unverified">Unverified</option>
        </select>
        <input
          name="country"
          defaultValue={searchParams.country}
          placeholder="Country of residence…"
          className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          {t('filter_apply')}
        </button>
        {(searchParams.q || searchParams.status || searchParams.country) && (
          <a
            href="?page=1"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/60 hover:text-surface/80"
          >
            {t('filter_clear')}
          </a>
        )}
      </form>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 bg-navy-deep px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{t('table_title')}</h2>
          <span className="text-xs text-surface/50">{total} total</span>
        </div>

        {registrants.length === 0 ? (
          <div className="bg-navy-deep px-6 py-16 text-center">
            <BarChart3 className="mx-auto mb-3 h-8 w-8 text-surface/20" />
            <p className="text-sm text-surface/50">No registrants match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-navy-deep text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Nationality</th>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Complete</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registrants.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-3">
                      <p className="font-medium text-white">
                        {r.firstName} {r.lastName}
                      </p>
                      {r.email && (
                        <p className="text-[10px] text-surface/40">{r.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-surface/70">{r.nationality}</td>
                    <td className="px-4 py-3 text-surface/70">{r.countryOfResidence}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium',
                          STATUS_BADGE[r.verificationStatus] ?? 'bg-white/5 text-surface/50',
                        )}
                      >
                        {STATUS_LABEL[r.verificationStatus] ?? r.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{ width: `${r.profileCompletenessScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-surface/40">
                          {r.profileCompletenessScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface/50">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-navy-deep px-6 py-4">
            <p className="text-xs text-surface/50">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?q=${searchParams.q ?? ''}&status=${searchParams.status ?? ''}&country=${searchParams.country ?? ''}&page=${page - 1}`}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-surface/80"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?q=${searchParams.q ?? ''}&status=${searchParams.status ?? ''}&country=${searchParams.country ?? ''}&page=${page + 1}`}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-surface/80"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
