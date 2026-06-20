'use client';

import { ChevronDown, ChevronRight, Download, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment, useState, useTransition } from 'react';

import { PrintButton } from '@/components/ui/PrintButton';
import {
  exportAuditAction,
  loadAuditPageAction,
  loadAuditStatsAction,
} from '@/lib/services/audit/audit.actions';
import type { AuditActionGroup, AuditEntry, AuditFilters, AuditStats } from '@/lib/services/audit';
import { cn } from '@/lib/utils';

const GROUPS: AuditActionGroup[] = ['registration', 'staff', 'embassy', 'export', 'entitlement', 'system'];

interface Props {
  isPlatform: boolean;
  canExport: boolean;
  subtitle: string;
  tenants: { id: string; name: string }[];
  initialEntries: AuditEntry[];
  initialTotal: number;
  initialStats: AuditStats;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-gold/15 text-gold',
  tenant_admin: 'bg-blue-400/15 text-blue-400',
  embassy_admin: 'bg-emerald-400/15 text-emerald-400',
  consular_officer: 'bg-cyan-400/15 text-cyan-400',
  registrant: 'bg-white/5 text-surface/60',
};

export function AuditViewer({
  isPlatform,
  canExport,
  subtitle,
  tenants,
  initialEntries,
  initialTotal,
  initialStats,
}: Props) {
  const t = useTranslations('audit');
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<AuditStats>(initialStats);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  function reload(nextFilters: AuditFilters, nextPage: number) {
    startTransition(async () => {
      const [pageRes, statsRes] = await Promise.all([
        loadAuditPageAction(nextFilters, nextPage),
        loadAuditStatsAction(nextFilters),
      ]);
      setEntries(pageRes.entries);
      setTotal(pageRes.total);
      if (statsRes.stats) setStats(statsRes.stats);
      setPage(nextPage);
    });
  }

  function setFilter(patch: Partial<AuditFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    reload(next, 1);
  }

  function toggleGroup(g: AuditActionGroup) {
    const current = filters.groups ?? [];
    const next = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
    setFilter({ groups: next.length ? next : undefined });
  }

  function exportCsv() {
    setMsg(null);
    startTransition(async () => {
      const res = await exportAuditAction(filters);
      if (res.error || !res.csv) {
        setMsg(res.error ?? 'Export failed.');
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(`${res.rowCount} rows exported.`);
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Accountability</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
          <p className="mt-1 text-sm text-surface/60">{subtitle}</p>
        </div>
        <PrintButton />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t('stats.total_events')} value={stats.totalEvents.toLocaleString()} />
        <Stat label={t('stats.unique_users')} value={stats.uniqueUsers.toLocaleString()} />
        <Stat label={t('stats.most_common')} value={stats.mostCommonAction.replace(/_/g, ' ')} small />
        <Stat label="Filtered Range" value={filters.dateFrom ? 'Custom' : 'All time'} small />
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-xl border border-white/5 bg-navy-deep p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-surface/40" />
          <label className="flex items-center gap-1.5 text-xs text-surface/60">
            {t('filters.date_range')}
            <input type="date" onChange={(e) => setFilter({ dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="rounded border border-white/10 bg-navy px-2 py-1 text-xs text-white" />
            <span>—</span>
            <input type="date" onChange={(e) => setFilter({ dateTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="rounded border border-white/10 bg-navy px-2 py-1 text-xs text-white" />
          </label>
          <input
            placeholder={t('filters.user')}
            onBlur={(e) => setFilter({ userEmail: e.target.value || undefined })}
            className="rounded-lg border border-white/10 bg-navy px-3 py-1.5 text-xs text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
          <input
            placeholder={t('filters.search')}
            onBlur={(e) => setFilter({ search: e.target.value || undefined })}
            className="rounded-lg border border-white/10 bg-navy px-3 py-1.5 text-xs text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
          {isPlatform && tenants.length > 0 && (
            <select
              onChange={(e) => setFilter({ tenantId: e.target.value || undefined })}
              className="rounded-lg border border-white/10 bg-navy px-3 py-1.5 text-xs text-surface/70 focus:border-gold/40 focus:outline-none"
            >
              <option value="">{t('filters.tenant')}: All</option>
              {tenants.map((tn) => (
                <option key={tn.id} value={tn.id}>{tn.name}</option>
              ))}
            </select>
          )}
          {canExport && (
            <button type="button" onClick={exportCsv} disabled={isPending} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/70 hover:border-gold/30 hover:text-gold disabled:opacity-50">
              <Download className="h-3.5 w-3.5" /> {t('export_button')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => {
            const on = filters.groups?.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGroup(g)}
                className={cn('rounded-full px-3 py-1 text-[11px] font-medium transition-colors', on ? 'bg-gold text-navy-deepest' : 'bg-white/5 text-surface/60 hover:text-white')}
              >
                {t(`action_groups.${g}` as 'action_groups.all')}
              </button>
            );
          })}
        </div>
      </div>

      {msg && <p className="text-xs text-surface/60">{msg}</p>}

      {/* Table */}
      <section className={cn('overflow-hidden rounded-xl border border-white/5', isPending && 'opacity-60')}>
        <div className="overflow-x-auto">
          <table className="w-full bg-navy-deep text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                <th className="w-8 px-3 py-3"></th>
                <th className="px-3 py-3 text-left">{t('columns.timestamp')}</th>
                <th className="px-3 py-3 text-left">{t('columns.action')}</th>
                <th className="px-3 py-3 text-left">{t('columns.performed_by')}</th>
                <th className="px-3 py-3 text-left">{t('columns.role')}</th>
                {isPlatform && <th className="px-3 py-3 text-left">{t('filters.tenant')}</th>}
                <th className="px-3 py-3 text-left">{t('columns.resource')}</th>
                <th className="px-3 py-3 text-left">{t('columns.ip_address')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.length === 0 ? (
                <tr><td colSpan={isPlatform ? 8 : 7} className="px-6 py-12 text-center text-sm text-surface/50">No audit entries match these filters.</td></tr>
              ) : (
                entries.map((e) => (
                  <Fragment key={e.id}>
                    <tr className="cursor-pointer hover:bg-white/5" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                      <td className="px-3 py-2.5 text-surface/40">{expanded === e.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-surface/60">{fmt(e.timestamp)}</td>
                      <td className="px-3 py-2.5 font-medium text-white">{e.action.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2.5 text-surface/70">{e.userEmail}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] uppercase', ROLE_BADGE[e.userRole] ?? 'bg-white/5 text-surface/50')}>{e.userRole.replace('_', ' ')}</span>
                      </td>
                      {isPlatform && <td className="px-3 py-2.5 text-xs text-surface/60">{e.tenantName ?? 'Platform'}</td>}
                      <td className="px-3 py-2.5 text-xs text-surface/60">{e.resource}</td>
                      <td className="px-3 py-2.5 text-xs text-surface/40">{e.ipAddress ?? '—'}</td>
                    </tr>
                    {expanded === e.id && (
                      <tr className="bg-navy">
                        <td colSpan={isPlatform ? 8 : 7} className="px-6 py-3">
                          <pre className="overflow-x-auto rounded-lg border border-white/5 bg-navy-deepest p-3 text-[11px] text-surface/70">
                            {JSON.stringify({ resourceId: e.resourceId, metadata: e.metadata }, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-navy-deep px-6 py-3">
            <p className="text-xs text-surface/50">Page {page} of {totalPages} · {total} events</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1 || isPending} onClick={() => reload(filters, page - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-surface/80 disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= totalPages || isPending} onClick={() => reload(filters, page + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-surface/80 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
      <p className={cn('mt-2 font-bold text-white', small ? 'text-base capitalize' : 'text-3xl')}>{value}</p>
    </div>
  );
}
