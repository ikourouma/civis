'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import {
  completeRequestAction,
  denyRequestAction,
  processCorrectionAction,
  processDeletionAction,
  processExportAction,
} from '@/lib/services/gdpr/gdpr.actions';
import type { GDPRRequest, GDPRStats } from '@/lib/services/gdpr';
import { cn } from '@/lib/utils';

interface Props {
  initialRequests: GDPRRequest[];
  stats: GDPRStats;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-400/15 text-amber-400',
  in_progress: 'bg-blue-400/15 text-blue-400',
  completed: 'bg-emerald-400/15 text-emerald-400',
  denied: 'bg-red-400/15 text-red-400',
};

const TYPE_LABEL: Record<string, string> = {
  data_export: 'Export',
  data_correction: 'Correction',
  data_deletion: 'Deletion',
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(r: GDPRRequest): boolean {
  return (r.status === 'pending' || r.status === 'in_progress') && new Date(r.deadlineAt).getTime() < Date.now();
}

export function GDPRQueue({ initialRequests, stats }: Props) {
  const t = useTranslations('gdpr');
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<GDPRRequest | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function flash(m: string) {
    setErr(null);
    setMsg(m);
    setTimeout(() => setMsg(null), 5000);
  }

  function run(fn: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res.success) { flash(ok); setActive(null); setDelConfirm(''); setDenyReason(''); }
      else setErr(res.error ?? 'Action failed.');
    });
  }

  function exportData(r: GDPRRequest) {
    startTransition(async () => {
      const res = await processExportAction(r.id);
      if (res.success && res.json) {
        const blob = new Blob([res.json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename ?? 'data-export.json';
        a.click();
        URL.revokeObjectURL(url);
        flash('Export generated and downloaded.');
      } else setErr(res.error ?? 'Export failed.');
    });
  }

  const tiles = [
    { label: t('admin.pending'), value: stats.pending, color: 'text-amber-400' },
    { label: t('admin.in_progress'), value: stats.inProgress, color: 'text-blue-400' },
    { label: t('admin.overdue'), value: stats.overdue, color: 'text-red-400' },
    { label: t('admin.completed_month'), value: stats.completedThisMonth, color: 'text-emerald-400' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Compliance</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('admin.page_title')}</h1>
        <p className="mt-1 text-sm text-surface/60">{t('admin.page_subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{tile.label}</p>
            <p className={cn('mt-2 text-3xl font-bold', tile.color)}>{tile.value}</p>
          </div>
        ))}
      </div>

      {msg && <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">{err}</div>}

      <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        {initialRequests.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-surface/50">No data subject requests.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                <th className="px-4 py-3 text-left">Citizen</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {initialRequests.map((r) => (
                <tr key={r.id} className={cn(isOverdue(r) && 'border-l-2 border-l-red-400')}>
                  <td className="px-4 py-3 text-surface/80">{r.citizenName}</td>
                  <td className="px-4 py-3 text-surface/70">{TYPE_LABEL[r.requestType]}</td>
                  <td className="px-4 py-3 text-xs text-surface/50">{fmt(r.createdAt)}</td>
                  <td className={cn('px-4 py-3 text-xs', isOverdue(r) ? 'text-red-400' : 'text-surface/50')}>{fmt(r.deadlineAt)}</td>
                  <td className="px-4 py-3"><span className={cn('rounded px-2 py-0.5 text-xs', STATUS_BADGE[r.status])}>{t(`statuses.${r.status}` as 'statuses.pending')}</span></td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== 'completed' && r.status !== 'denied' ? (
                      <button type="button" onClick={() => setActive(r)} className="rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20">{t('admin.process')}</button>
                    ) : (
                      <span className="text-xs text-surface/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Detail modal */}
      {active && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-lg space-y-4 rounded-xl border border-white/10 bg-navy-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base font-semibold text-white">{active.citizenName}</h3>
              <p className="text-xs text-surface/50">{TYPE_LABEL[active.requestType]} · submitted {fmt(active.createdAt)} · deadline {fmt(active.deadlineAt)}</p>
              {active.citizenEmail && <p className="text-xs text-surface/50">{active.citizenEmail}</p>}
            </div>

            {active.requestDetails && (
              <p className="rounded-lg border border-white/5 bg-navy p-3 text-sm text-surface/70">{active.requestDetails}</p>
            )}

            {active.requestType === 'data_export' && (
              <button type="button" disabled={isPending} onClick={() => exportData(active)} className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-50">{t('admin.generate_export')}</button>
            )}

            {active.requestType === 'data_correction' && (
              <div className="space-y-3">
                {active.correctionFields && (
                  <pre className="overflow-x-auto rounded-lg border border-white/5 bg-navy p-3 text-[11px] text-surface/70">{JSON.stringify(active.correctionFields, null, 2)}</pre>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    const corrections: Record<string, string> = {};
                    for (const [k, v] of Object.entries(active.correctionFields ?? {})) corrections[k] = v.requested;
                    run(() => processCorrectionAction(active.id, corrections), 'Correction applied.');
                  }}
                  className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-50"
                >
                  {t('admin.apply_corrections')}
                </button>
              </div>
            )}

            {active.requestType === 'data_deletion' && (
              <div className="space-y-3 rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-xs text-surface/70">{t('admin.deletion_confirm')}</p>
                <input value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} placeholder='Type "DELETE"' className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white" />
                <button
                  type="button"
                  disabled={isPending || delConfirm !== 'DELETE'}
                  onClick={() => run(() => processDeletionAction(active.id), 'Citizen data deleted.')}
                  className="w-full rounded-lg bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/25 disabled:opacity-40"
                >
                  {t('admin.execute_deletion')}
                </button>
              </div>
            )}

            {/* Complete / Deny */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              {active.requestType !== 'data_deletion' && (
                <button type="button" disabled={isPending} onClick={() => run(() => completeRequestAction(active.id), 'Marked completed.')} className="w-full rounded-lg border border-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-50">{t('admin.complete')}</button>
              )}
              <div className="space-y-2">
                <input value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder={t('admin.deny_reason')} className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white" />
                <button type="button" disabled={isPending || !denyReason.trim()} onClick={() => run(() => denyRequestAction(active.id, denyReason), 'Request denied.')} className="w-full rounded-lg border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/10 disabled:opacity-50">{t('admin.deny')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
