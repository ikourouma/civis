'use client';

import { Download, FileEdit, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { EntitlementGate } from '@/components/entitlements/EntitlementGate';
import type { ConsentRecord } from '@/lib/services/consent/consent.service';
import {
  submitMyGDPRRequestAction,
  withdrawMyConsentAction,
} from '@/lib/services/gdpr/gdpr.actions';
import type { GDPRRequest } from '@/lib/services/gdpr';
import { cn } from '@/lib/utils';

interface Props {
  consent: ConsentRecord | null;
  requests: GDPRRequest[];
  retentionDays: number;
  contactEmail: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-400/15 text-amber-400',
  in_progress: 'bg-blue-400/15 text-blue-400',
  completed: 'bg-emerald-400/15 text-emerald-400',
  denied: 'bg-red-400/15 text-red-400',
};

const CORRECTABLE_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone_primary', label: 'Phone' },
  { key: 'country_of_residence', label: 'Country of Residence' },
  { key: 'city_of_residence', label: 'City of Residence' },
  { key: 'occupation', label: 'Occupation' },
];

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PrivacyRightsView({ consent, requests, retentionDays, contactEmail }: Props) {
  const t = useTranslations('gdpr');
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showConsentText, setShowConsentText] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [corField, setCorField] = useState(CORRECTABLE_FIELDS[0]!.key);
  const [corValue, setCorValue] = useState('');
  const [corReason, setCorReason] = useState('');

  function flash(m: string) {
    setErr(null);
    setMsg(m);
    setTimeout(() => setMsg(null), 5000);
  }

  function submit(type: 'data_export' | 'data_correction' | 'data_deletion', details?: string, fields?: Record<string, { current: string; requested: string }>) {
    startTransition(async () => {
      const res = await submitMyGDPRRequestAction(type, details, fields);
      if (res.success) {
        flash(t('request_export.success'));
        setCorrectionOpen(false);
        setDeletionOpen(false);
        setDeleteConfirm('');
      } else {
        setErr(res.error ?? 'Could not submit request.');
      }
    });
  }

  function withdraw() {
    startTransition(async () => {
      const res = await withdrawMyConsentAction(withdrawReason);
      if (res.success) {
        setWithdrawOpen(false);
        flash('Consent withdrawn. Your registration has been deactivated.');
      } else setErr(res.error ?? 'Could not withdraw consent.');
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Data Rights</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
        <p className="mt-1 text-sm text-surface/60">{t('page_subtitle')}</p>
      </header>

      {msg && <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">{err}</div>}

      {/* Section 1 — Consent record */}
      <EntitlementGate capability="GDPR_VIEW_CONSENT">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-gold" /> {t('consent_section')}</h2>
          <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
            {!consent ? (
              <p className="text-sm text-surface/50">No consent record on file.</p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div><dt className="text-[10px] uppercase tracking-widest text-surface/40">Type</dt><dd className="mt-1 text-sm text-surface/80 capitalize">{consent.consentType}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-widest text-surface/40">Version</dt><dd className="mt-1 text-sm text-surface/80">{consent.consentVersion}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-widest text-surface/40">Language</dt><dd className="mt-1 text-sm text-surface/80 uppercase">{consent.consentLanguage}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-widest text-surface/40">Date</dt><dd className="mt-1 text-sm text-surface/80">{fmt(consent.capturedAt)}</dd></div>
                </dl>
                <button type="button" onClick={() => setShowConsentText((s) => !s)} className="mt-4 text-xs text-gold hover:underline">View Full Consent Text →</button>
                {showConsentText && (
                  <p className="mt-3 rounded-lg border border-white/5 bg-navy p-3 text-xs leading-relaxed text-surface/70">{consent.consentTextSnapshot}</p>
                )}
                {!consent.withdrawnAt && (
                  <div className="mt-4">
                    {!withdrawOpen ? (
                      <button type="button" onClick={() => setWithdrawOpen(true)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-400/10">{t('withdraw_consent.button')}</button>
                    ) : (
                      <div className="space-y-3 rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                        <p className="text-xs text-surface/70">{t('withdraw_consent.confirm')}</p>
                        <textarea value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} rows={2} placeholder="Reason (optional)" className="w-full rounded-lg border border-white/10 bg-navy p-2 text-sm text-white focus:border-red-400/40 focus:outline-none" />
                        <div className="flex gap-2">
                          <button type="button" disabled={isPending} onClick={withdraw} className="rounded-lg bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/25 disabled:opacity-50">Confirm Withdrawal</button>
                          <button type="button" onClick={() => setWithdrawOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/60">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {consent.withdrawnAt && (
                  <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-400">Consent withdrawn on {fmt(consent.withdrawnAt)}.</p>
                )}
              </>
            )}
          </div>
        </section>
      </EntitlementGate>

      {/* Section 2 — Data rights */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">{t('rights_section')}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <EntitlementGate capability="GDPR_REQUEST_EXPORT">
            <RightCard Icon={Download} title={t('request_export.title')} desc={t('request_export.description')} button={t('request_export.button')} onClick={() => submit('data_export')} disabled={isPending} />
          </EntitlementGate>
          <EntitlementGate capability="GDPR_REQUEST_CORRECTION">
            <RightCard Icon={FileEdit} title={t('request_correction.title')} desc={t('request_correction.description')} button={t('request_correction.button')} onClick={() => setCorrectionOpen(true)} disabled={isPending} />
          </EntitlementGate>
          <EntitlementGate capability="GDPR_REQUEST_DELETION">
            <RightCard Icon={Trash2} title={t('request_deletion.title')} desc={t('request_deletion.description')} button={t('request_deletion.button')} onClick={() => setDeletionOpen(true)} disabled={isPending} danger />
          </EntitlementGate>
        </div>
      </section>

      {/* Correction modal */}
      {correctionOpen && (
        <Modal onClose={() => setCorrectionOpen(false)} title={t('request_correction.title')}>
          <label className="block text-sm">
            <span className="text-xs text-surface/60">{t('request_correction.which_fields')}</span>
            <select value={corField} onChange={(e) => setCorField(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white">
              {CORRECTABLE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs text-surface/60">{t('request_correction.correct_info')}</span>
            <input value={corValue} onChange={(e) => setCorValue(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white" />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-surface/60">{t('request_correction.reason')}</span>
            <textarea value={corReason} onChange={(e) => setCorReason(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white" />
          </label>
          <button
            type="button"
            disabled={isPending || !corValue.trim()}
            onClick={() => submit('data_correction', corReason, { [corField]: { current: '', requested: corValue } })}
            className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40"
          >
            {t('request_correction.button')}
          </button>
        </Modal>
      )}

      {/* Deletion modal */}
      {deletionOpen && (
        <Modal onClose={() => setDeletionOpen(false)} title={t('request_deletion.title')}>
          <p className="text-sm text-surface/70">{t('request_deletion.confirm')}</p>
          <label className="block text-sm">
            <span className="text-xs text-surface/60">{t('request_deletion.type_delete')}</span>
            <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white" />
          </label>
          <button
            type="button"
            disabled={isPending || deleteConfirm !== 'DELETE'}
            onClick={() => submit('data_deletion')}
            className="w-full rounded-lg bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/25 disabled:opacity-40"
          >
            {t('request_deletion.button')}
          </button>
        </Modal>
      )}

      {/* Section 3 — Request history */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">{t('history_section')}</h2>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          {requests.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-surface/50">No requests submitted yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                  <th className="px-4 py-3 text-left">Request Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Deadline</th>
                  <th className="px-4 py-3 text-left">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 capitalize text-surface/80">{r.requestType.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded px-2 py-0.5 text-xs', STATUS_BADGE[r.status])}>{t(`statuses.${r.status}` as 'statuses.pending')}</span>
                      {r.status === 'denied' && r.denialReason && <p className="mt-1 text-[10px] text-red-400/80">{r.denialReason}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface/50">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-surface/50">{fmt(r.deadlineAt)}</td>
                    <td className="px-4 py-3 text-xs text-surface/50">{fmt(r.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Section 4 — Retention info */}
      <section className="rounded-xl border border-white/5 bg-navy-deep p-5 text-sm text-surface/60">
        <h2 className="mb-2 text-sm font-semibold text-white">{t('retention_section')}</h2>
        <p>
          Your government retains your registration data for {retentionDays} days after account closure or consent withdrawal,
          then securely deletes it.
        </p>
        {contactEmail && <p className="mt-2">For questions about your data, contact: <span className="text-gold">{contactEmail}</span></p>}
      </section>
    </div>
  );
}

function RightCard({
  Icon, title, desc, button, onClick, disabled, danger,
}: {
  Icon: typeof Download; title: string; desc: string; button: string;
  onClick: () => void; disabled: boolean; danger?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-navy-deep p-5">
      <Icon className={cn('h-5 w-5', danger ? 'text-red-400' : 'text-gold')} />
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 flex-1 text-xs text-surface/50">{desc}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn('mt-4 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50', danger ? 'border border-red-400/20 text-red-400 hover:bg-red-400/10' : 'bg-gold/10 text-gold hover:bg-gold/20')}
      >
        {button} →
      </button>
    </div>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-navy-deep p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}
