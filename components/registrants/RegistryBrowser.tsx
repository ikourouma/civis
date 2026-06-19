'use client';

import { BarChart3, Building2, Download, Globe, Search, Settings2, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useRouter as useLocaleRouter } from '@/i18n/navigation';
import { assignEmbassyAction } from '@/lib/services/registrants/registrant.actions';
import type { Registrant } from '@/lib/services/registrants';
import { cn } from '@/lib/utils';

type ScopeKind = 'embassy' | 'tenant' | 'platform';

interface Filters {
  q?: string;
  status?: string;
  country?: string;
  generation?: string;
  minComplete?: string;
  embassy?: string;
}

interface Props {
  registrants: Registrant[];
  total: number;
  page: number;
  totalPages: number;
  scope: { kind: ScopeKind; label: string; count: number };
  flags: { canViewProfile: boolean; canSearch: boolean; canExport: boolean };
  filters: Filters;
  embassies?: { id: string; name: string }[];
  canAssign?: boolean;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-white/5 text-surface/50',
  basic_registered: 'bg-blue-400/15 text-blue-400',
  submitted: 'bg-amber-400/15 text-amber-400',
  active: 'bg-emerald-400/15 text-emerald-400',
  inactive: 'bg-white/5 text-surface/50',
  rejected: 'bg-red-400/15 text-red-400',
};

const SCOPE_ICON: Record<ScopeKind, typeof Globe> = {
  embassy: Building2,
  tenant: Globe,
  platform: Settings2,
};

function completeColor(score: number): string {
  if (score > 80) return 'bg-emerald-400';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RegistryBrowser({ registrants, total, page, totalPages, scope, flags, filters, embassies, canAssign }: Props) {
  const t = useTranslations('registrant_detail');
  const router = useRouter();
  const localeRouter = useLocaleRouter();
  const { toast } = useToast();
  const [isAssigning, startAssign] = useTransition();

  function assign(registrantId: string, embassyId: string) {
    startAssign(async () => {
      const res = await assignEmbassyAction(registrantId, embassyId || null);
      if (res.success) toast({ type: 'success', title: 'Embassy assigned' });
      else toast({ type: 'error', title: 'Assignment failed', description: res.error });
    });
  }
  const [showAdvanced, setShowAdvanced] = useState(
    !!(filters.country || filters.generation || filters.minComplete),
  );
  const [query, setQuery] = useState(filters.q ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyFilters(next: Filters, resetPage = true) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...next };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (!resetPage && page > 1) params.set('page', String(page));
    router.push(`?${params.toString()}`);
  }

  // Debounced live search (min 2 chars, 300ms).
  useEffect(() => {
    if (!flags.canSearch) return;
    if (query === (filters.q ?? '')) return;
    if (query.length > 0 && query.length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilters({ q: query }), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const ScopeIcon = SCOPE_ICON[scope.kind];
  const embassyMap = useMemo(() => new Map((embassies ?? []).map((e) => [e.id, e.name])), [embassies]);
  const showEmbassyCol = !!embassies && embassies.length > 0;

  return (
    <div className="space-y-6">
      {/* Scope banner */}
      <div className="flex items-center gap-2 rounded-xl border border-gold/15 bg-gold/[0.04] px-4 py-3 text-sm text-surface/80">
        <ScopeIcon className="h-4 w-4 text-gold" />
        <span>{scope.label}</span>
        <span className="ml-auto rounded bg-white/5 px-2 py-0.5 text-xs text-surface/60">{scope.count} records</span>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {flags.canSearch ? (
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full rounded-lg border border-white/10 bg-navy-deep py-2 pl-9 pr-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
              />
            </div>
          ) : (
            <p className="text-xs text-surface/40">{t('search.profile_not_enabled')}</p>
          )}

          <select
            value={filters.status ?? ''}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:border-gold/40 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending_review">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="unverified">Unverified</option>
          </select>

          {embassies && embassies.length > 0 && (
            <select
              value={filters.embassy ?? ''}
              onChange={(e) => applyFilters({ embassy: e.target.value })}
              className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:border-gold/40 focus:outline-none"
            >
              <option value="">All embassies</option>
              {embassies.map((em) => (
                <option key={em.id} value={em.id}>{em.name}</option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-surface/70 hover:text-white"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>

          {flags.canExport && (
            <a
              href="/api/registry/export?format=csv"
              download
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-surface/70 hover:border-gold/30 hover:text-gold"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </a>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-navy-deep p-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Country of Residence</span>
              <input
                defaultValue={filters.country}
                onBlur={(e) => applyFilters({ country: e.target.value })}
                placeholder="e.g. United States"
                className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Generation</span>
              <input
                defaultValue={filters.generation}
                onBlur={(e) => applyFilters({ generation: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Min Completeness %</span>
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={filters.minComplete}
                onBlur={(e) => applyFilters({ minComplete: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 bg-navy-deep px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Registrants</h2>
          <span className="text-xs text-surface/50">{total} total</span>
        </div>

        {registrants.length === 0 ? (
          <div className="bg-navy-deep px-6 py-16 text-center">
            <BarChart3 className="mx-auto mb-3 h-8 w-8 text-surface/20" />
            <p className="text-sm text-surface/50">{t('search.no_results')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-navy-deep text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Nationality</th>
                  <th className="px-4 py-3 text-left">Country</th>
                  {showEmbassyCol && <th className="px-4 py-3 text-left">Embassy</th>}
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Complete</th>
                  <th className="px-4 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registrants.map((r) => {
                  const cells = (
                    <>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar firstName={r.firstName} lastName={r.lastName} photoUrl={r.profilePhotoUrl} />
                          <div className="min-w-0">
                            <p className="font-medium text-white">{r.firstName} {r.lastName}</p>
                            {r.email && <p className="text-[10px] text-surface/40">{r.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface/70">{r.nationality || '—'}</td>
                      <td className="px-4 py-3 text-surface/70">{r.countryOfResidence || '—'}</td>
                      {showEmbassyCol && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {r.embassyId ? (
                            <span className="text-xs text-surface/70">{embassyMap.get(r.embassyId) ?? 'Assigned'}</span>
                          ) : canAssign ? (
                            <select
                              defaultValue=""
                              disabled={isAssigning}
                              onChange={(e) => assign(r.id, e.target.value)}
                              className="rounded border border-amber-400/30 bg-navy px-2 py-1 text-xs text-amber-400 focus:outline-none"
                            >
                              <option value="">⚠ Unassigned</option>
                              {(embassies ?? []).map((em) => (
                                <option key={em.id} value={em.id}>{em.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unassigned</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', STATUS_BADGE[r.registrationStatus] ?? 'bg-white/5 text-surface/50')}>
                          {r.registrationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div className={cn('h-full rounded-full', completeColor(r.profileCompletenessScore))} style={{ width: `${r.profileCompletenessScore}%` }} />
                          </div>
                          <span className="text-[10px] text-surface/40">{r.profileCompletenessScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface/50">{fmtDate(r.createdAt)}</td>
                    </>
                  );
                  return flags.canViewProfile ? (
                    <tr
                      key={r.id}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                      onClick={() => localeRouter.push(`/workspace/registrant/${r.id}`)}
                    >
                      {cells}
                    </tr>
                  ) : (
                    <tr key={r.id} title={t('search.profile_not_enabled')} className="transition-colors hover:bg-white/5">
                      {cells}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-navy-deep px-6 py-4">
            <p className="text-xs text-surface/50">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <button type="button" onClick={() => router.push(buildPageUrl(filters, page - 1))} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-surface/80">
                  Previous
                </button>
              )}
              {page < totalPages && (
                <button type="button" onClick={() => router.push(buildPageUrl(filters, page + 1))} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-surface/80">
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ firstName, lastName, photoUrl }: { firstName: string; lastName: string; photoUrl: string | null }) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={`${firstName} ${lastName}`} className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white ring-1 ring-white/10">
      {initials}
    </div>
  );
}

function buildPageUrl(filters: Filters, page: number): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  params.set('page', String(page));
  return `?${params.toString()}`;
}
