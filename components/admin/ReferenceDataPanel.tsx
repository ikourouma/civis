'use client';

import { Plus, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import {
  addCanonicalEntry,
  approveSuggestion,
  deleteCanonicalEntry,
  getCanonicalList,
  getPendingSuggestions,
  mergeSuggestion,
  rejectSuggestion,
} from '@/lib/services/admin/reference-management.service';
import type {
  CanonicalEntry,
  CanonicalTab,
  RegistrySuggestion,
  SuggestionCategory,
} from '@/lib/services/admin/reference-management.types';
import { cn } from '@/lib/utils';

type Tab = 'pending' | CanonicalTab;

const TABS: Tab[] = [
  'pending',
  'countries',
  'occupations',
  'industries',
  'fields',
  'education',
  'associations',
];

const TAB_LABEL_KEY: Record<Tab, string> = {
  pending: 'tab_pending',
  countries: 'tab_countries',
  occupations: 'tab_occupations',
  industries: 'tab_industries',
  fields: 'tab_fields',
  education: 'tab_education',
  associations: 'tab_associations',
};

const CATEGORY_BADGE: Record<SuggestionCategory, string> = {
  occupation: 'bg-blue-400/15 text-blue-300',
  industry: 'bg-emerald-400/15 text-emerald-400',
  field_of_study: 'bg-purple-400/15 text-purple-300',
  diaspora_association: 'bg-gold/15 text-gold',
  employer: 'bg-white/5 text-surface/60',
};

// suggestion category -> canonical tab for the merge picker
const CATEGORY_TO_TAB: Record<SuggestionCategory, CanonicalTab | null> = {
  occupation: 'occupations',
  industry: 'industries',
  field_of_study: 'fields',
  diaspora_association: 'associations',
  employer: null,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  locale: 'en' | 'fr';
  initialPending: RegistrySuggestion[];
  pendingCount: number;
}

export function ReferenceDataPanel({ locale, initialPending, pendingCount }: Props) {
  const t = useTranslations('reference_data');
  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<RegistrySuggestion[]>(initialPending);
  const [count, setCount] = useState(pendingCount);
  const [canonical, setCanonical] = useState<CanonicalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [rejectTarget, setRejectTarget] = useState<RegistrySuggestion | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [mergeTarget, setMergeTarget] = useState<RegistrySuggestion | null>(null);
  const [mergeOptions, setMergeOptions] = useState<CanonicalEntry[]>([]);
  const [mergeSelection, setMergeSelection] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isCanonicalTab = tab !== 'pending';

  // Load canonical list when switching to a canonical tab or changing query
  useEffect(() => {
    if (tab === 'pending') return;
    setLoading(true);
    getCanonicalList(tab, query || undefined)
      .then(setCanonical)
      .finally(() => setLoading(false));
  }, [tab, query]);

  // Reset search when switching tabs
  useEffect(() => {
    setQuery('');
    setError(null);
  }, [tab]);

  function refreshPending() {
    getPendingSuggestions({ status: 'pending_review' }).then((rows) => {
      setPending(rows);
      setCount(rows.length);
    });
  }

  function handleApprove(s: RegistrySuggestion) {
    setError(null);
    startTransition(async () => {
      const { error: err } = await approveSuggestion(s.id);
      if (err) setError(err);
      else refreshPending();
    });
  }

  function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setError(null);
    startTransition(async () => {
      const { error: err } = await rejectSuggestion(rejectTarget.id, rejectReason);
      if (err) setError(err);
      else {
        setRejectTarget(null);
        setRejectReason('');
        refreshPending();
      }
    });
  }

  function openMerge(s: RegistrySuggestion) {
    const targetTab = CATEGORY_TO_TAB[s.category];
    if (!targetTab) return;
    setMergeTarget(s);
    setMergeSelection('');
    getCanonicalList(targetTab).then(setMergeOptions);
  }

  function handleMerge() {
    if (!mergeTarget || !mergeSelection) return;
    setError(null);
    startTransition(async () => {
      const { error: err } = await mergeSuggestion(mergeTarget.id, mergeSelection);
      if (err) setError(err);
      else {
        setMergeTarget(null);
        setMergeOptions([]);
        refreshPending();
      }
    });
  }

  function handleAdd() {
    if (tab === 'pending' || !addName.trim()) return;
    setError(null);
    startTransition(async () => {
      const { error: err } = await addCanonicalEntry(tab, { nameEn: addName });
      if (err) setError(err);
      else {
        setAddOpen(false);
        setAddName('');
        getCanonicalList(tab, query || undefined).then(setCanonical);
      }
    });
  }

  function handleDelete(entry: CanonicalEntry) {
    if (tab === 'pending') return;
    setError(null);
    startTransition(async () => {
      const { error: err } = await deleteCanonicalEntry(tab, entry.id);
      if (err) setError(err);
      else setCanonical((prev) => prev.filter((e) => e.id !== entry.id));
    });
  }

  const canAdd = isCanonicalTab && tab !== 'countries' && tab !== 'education';
  const canDelete = isCanonicalTab && tab !== 'countries' && tab !== 'education';

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-white/5">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === tb
                ? 'border-b-2 border-gold text-gold'
                : 'text-surface/60 hover:text-surface/90',
            )}
          >
            {t(TAB_LABEL_KEY[tb])}
            {tb === 'pending' && count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy-deepest">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between gap-4">
        {isCanonicalTab ? (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="h-10 w-72 rounded-lg border border-white/10 bg-navy-deep px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
        ) : (
          <p className="text-sm text-surface/60">
            {pending.length} {t('tab_pending').toLowerCase()}
          </p>
        )}

        {canAdd && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-navy-deepest transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('actions.add_new')}
          </button>
        )}
      </div>

      {/* PENDING TAB */}
      {tab === 'pending' && (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/5 bg-navy-deep text-[10px] uppercase tracking-widest text-surface/40">
              <tr>
                <th className="px-5 py-3 font-medium">{t('suggestion.category')}</th>
                <th className="px-5 py-3 font-medium">{t('suggestion.value')}</th>
                <th className="px-5 py-3 font-medium">{t('suggestion.submitted_by')}</th>
                <th className="px-5 py-3 font-medium">{t('suggestion.submitted_at')}</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-navy-deep">
              {pending.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-surface/50">
                    {t('empty_pending')}
                  </td>
                </tr>
              )}
              {pending.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        CATEGORY_BADGE[s.category],
                      )}
                    >
                      {s.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{s.suggestedValue}</p>
                    {s.tenantName && <p className="text-[10px] text-surface/40">{s.tenantName}</p>}
                  </td>
                  <td className="px-5 py-4 text-surface/70">{s.suggestedByEmail ?? '—'}</td>
                  <td className="px-5 py-4 text-surface/50">{formatDate(s.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApprove(s)}
                        className="rounded-md bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
                      >
                        {t('actions.approve')}
                      </button>
                      {CATEGORY_TO_TAB[s.category] && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => openMerge(s)}
                          className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-semibold text-surface/70 transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                          {t('actions.merge')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setRejectTarget(s);
                          setRejectReason('');
                        }}
                        className="rounded-md bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                      >
                        {t('actions.reject')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CANONICAL TABS */}
      {isCanonicalTab && (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/5 bg-navy-deep text-[10px] uppercase tracking-widest text-surface/40">
              <tr>
                <th className="px-5 py-3 font-medium">Name (EN)</th>
                <th className="px-5 py-3 font-medium">Name (FR)</th>
                {tab === 'countries' && <th className="px-5 py-3 font-medium">Region</th>}
                {(tab === 'occupations' || tab === 'fields') && (
                  <th className="px-5 py-3 font-medium">Category</th>
                )}
                {tab === 'industries' && <th className="px-5 py-3 font-medium">NAICS</th>}
                {tab !== 'countries' && tab !== 'education' && (
                  <th className="px-5 py-3 font-medium">Usage</th>
                )}
                {canDelete && <th className="px-5 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-navy-deep">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-surface/40">
                    …
                  </td>
                </tr>
              )}
              {!loading && canonical.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-surface/50">
                    {t('empty_canonical')}
                  </td>
                </tr>
              )}
              {!loading &&
                canonical.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 text-white">
                        {e.flagEmoji && <span className="text-base leading-none">{e.flagEmoji}</span>}
                        {e.nameEn}
                        {e.isAUMember && (
                          <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gold">
                            AU
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-surface/60">{e.nameFr ?? '—'}</td>
                    {tab === 'countries' && (
                      <td className="px-5 py-3 text-surface/60">{e.category ?? '—'}</td>
                    )}
                    {(tab === 'occupations' || tab === 'fields') && (
                      <td className="px-5 py-3 text-surface/60">{e.category ?? '—'}</td>
                    )}
                    {tab === 'industries' && (
                      <td className="px-5 py-3 text-surface/60">{e.naicsCode ?? '—'}</td>
                    )}
                    {tab !== 'countries' && tab !== 'education' && (
                      <td className="px-5 py-3 text-surface/60">{e.usageCount}</td>
                    )}
                    {canDelete && (
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(e)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-surface/40 transition-colors hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <Modal onClose={() => setRejectTarget(null)}>
          <h3 className="text-base font-semibold text-white">{t('actions.reject')}</h3>
          <p className="mt-1 text-sm text-surface/60">
            “{rejectTarget.suggestedValue}”
          </p>
          <label className="mt-4 block text-xs font-semibold text-surface/60">
            {t('suggestion.reject_reason')}
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-white placeholder-surface/30 focus:border-red-400/50 focus:outline-none"
          />
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={isPending || !rejectReason.trim()}
              onClick={handleReject}
              className="flex-1 rounded-lg bg-red-400/15 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-400/25 disabled:opacity-50"
            >
              {t('actions.reject')}
            </button>
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-surface/70 hover:text-white"
            >
              {t('actions.cancel')}
            </button>
          </div>
        </Modal>
      )}

      {/* Merge modal */}
      {mergeTarget && (
        <Modal onClose={() => setMergeTarget(null)}>
          <h3 className="text-base font-semibold text-white">{t('actions.merge')}</h3>
          <p className="mt-1 text-sm text-surface/60">
            {t('suggestion.merge_into')} — “{mergeTarget.suggestedValue}”
          </p>
          <select
            value={mergeSelection}
            onChange={(e) => setMergeSelection(e.target.value)}
            className="mt-4 w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-surface/80 focus:border-gold/40 focus:outline-none"
          >
            <option value="">—</option>
            {mergeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nameEn}
              </option>
            ))}
          </select>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={isPending || !mergeSelection}
              onClick={handleMerge}
              className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('actions.merge')}
            </button>
            <button
              type="button"
              onClick={() => setMergeTarget(null)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-surface/70 hover:text-white"
            >
              {t('actions.cancel')}
            </button>
          </div>
        </Modal>
      )}

      {/* Add new modal */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)}>
          <h3 className="text-base font-semibold text-white">{t('actions.add_new')}</h3>
          <label className="mt-4 block text-xs font-semibold text-surface/60">Name (EN)</label>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={isPending || !addName.trim()}
              onClick={handleAdd}
              className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('actions.add_new')}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-surface/70 hover:text-white"
            >
              {t('actions.cancel')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-2 rounded-md p-1 text-surface/40 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
