'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { exportRegistrantsCSVAction, type ExportHistoryEntry } from '@/lib/services/export/export.actions';
import { cn } from '@/lib/utils';

const STATUSES = ['draft', 'basic_registered', 'submitted', 'active'];

export function ExportClient({
  locale,
  history,
  canIncludePhone,
}: {
  locale: 'en' | 'fr';
  history: ExportHistoryEntry[];
  canIncludePhone: boolean;
}) {
  const t = useTranslations('intelligence.export');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [scope, setScope] = useState('all');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [minCompleteness, setMinCompleteness] = useState(0);
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [includeNames, setIncludeNames] = useState(true);
  const [includeEmail, setIncludeEmail] = useState(false);
  const [includePhone, setIncludePhone] = useState(false);

  function toggleStatus(s: string) {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function handleExport() {
    setError(null);
    setDone(null);

    if (format === 'pdf') {
      window.location.href = `/api/briefing?locale=${locale}`;
      return;
    }

    const scopeStatuses =
      scope === 'active' ? ['active'] : scope === 'submitted' ? ['submitted'] : statuses;

    startTransition(async () => {
      const res = await exportRegistrantsCSVAction(
        { status: scopeStatuses.length > 0 ? scopeStatuses : undefined, minCompleteness: minCompleteness || undefined },
        { includeNames, includeEmail, includePhone },
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setDone(`${res.rowCount} rows exported.`);
    });
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('subtitle')}</p>
      </header>

      <div className="space-y-6 rounded-xl border border-white/5 bg-navy-deep p-6">
        {/* Scope */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface/60">Data Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={inp}>
            <option value="all">{t('scope_all')}</option>
            <option value="active">{t('scope_active')}</option>
            <option value="submitted">{t('scope_submitted')}</option>
          </select>
        </div>

        {/* Status filter */}
        {scope === 'all' && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-surface/60">Registration Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                    statuses.includes(s) ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-surface/60 hover:text-white',
                  )}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Min completeness */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface/60">
            Minimum Completeness: {minCompleteness}%
          </label>
          <input type="range" min={0} max={100} step={10} value={minCompleteness} onChange={(e) => setMinCompleteness(Number(e.target.value))} className="w-full accent-gold" />
        </div>

        {/* Format */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface/60">Output Format</label>
          <div className="flex gap-2">
            {(['csv', 'pdf'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn('flex-1 rounded-lg border px-3 py-2 text-sm transition-colors', format === f ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-surface/60 hover:text-white')}
              >
                {f === 'csv' ? t('format_csv') : t('format_pdf')}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy controls */}
        {format === 'csv' && (
          <div className="rounded-lg border border-white/5 bg-navy p-4">
            <p className="mb-3 text-xs font-semibold text-surface/60">Privacy Controls</p>
            <div className="space-y-2">
              <Checkbox label={t('privacy_names')} checked={includeNames} onChange={setIncludeNames} />
              <Checkbox label={t('privacy_email')} checked={includeEmail} onChange={setIncludeEmail} />
              <Checkbox label={t('privacy_phone')} checked={includePhone} onChange={setIncludePhone} disabled={!canIncludePhone} />
            </div>
            <p className="mt-3 text-[11px] text-amber-400/80">⚠ {t('audit_warning')}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {done && <p className="text-sm text-emerald-400">{done}</p>}

        <button
          type="button"
          onClick={handleExport}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isPending ? '…' : t('export_button')}
        </button>
      </div>

      {/* History */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">{t('history')}</h2>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          {history.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-surface/40">No exports yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-[10px] uppercase tracking-widest text-surface/40">
                <tr><th className="px-5 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Rows</th></tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3 text-surface/70">{new Date(h.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 uppercase text-surface/60">{h.type}</td>
                    <td className="px-4 py-3 text-surface/60">{h.rowCount || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

const inp = 'h-10 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-surface/80 focus:border-gold/40 focus:outline-none';

function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-xs', disabled ? 'cursor-not-allowed text-surface/30' : 'text-surface/70')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-gold" />
      {label}
    </label>
  );
}
