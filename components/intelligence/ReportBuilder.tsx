'use client';

import { BarChart3, FileText, Globe2, Shield, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Link } from '@/i18n/navigation';
import { exportRegistrantsCSVAction, type ExportHistoryEntry } from '@/lib/services/export/export.actions';

type ReportKey = 'overview' | 'country' | 'embassy' | 'campaign' | 'quality';

const REPORTS: { key: ReportKey; Icon: typeof FileText; csvStatus?: string[] }[] = [
  { key: 'overview', Icon: FileText },
  { key: 'country', Icon: Globe2 },
  { key: 'embassy', Icon: BarChart3 },
  { key: 'campaign', Icon: TrendingUp, csvStatus: ['active', 'submitted', 'basic_registered'] },
  { key: 'quality', Icon: Shield },
];

export function ReportBuilder({ locale, history }: { locale: 'en' | 'fr'; history: ExportHistoryEntry[] }) {
  const t = useTranslations('intelligence.reports');
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function generateCsv(key: ReportKey, status?: string[]) {
    setBusy(key);
    setMsg(null);
    startTransition(async () => {
      const res = await exportRegistrantsCSVAction(
        { status },
        { includeNames: true, includeEmail: false, includePhone: false },
      );
      setBusy(null);
      if (res.error) {
        setMsg(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(`${key} report: ${res.rowCount} rows exported.`);
    });
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-sm text-surface/60">{t('subtitle')}</p>
      </header>

      {msg && <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">{msg}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map(({ key, Icon, csvStatus }) => (
          <div key={key} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <Icon className="h-5 w-5 text-gold/70" />
            <h3 className="mt-3 text-base font-semibold text-white">{t(`types.${key}`)}</h3>
            <p className="mt-1 text-xs text-surface/50">{t(`types.${key}_desc`)}</p>
            <div className="mt-4 flex gap-2">
              {key === 'country' ? (
                <Link href="/intelligence/export" className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deepest transition-opacity hover:opacity-90">
                  {t('generate')} (CSV) →
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => generateCsv(key, csvStatus)}
                  className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy === key ? '…' : `${t('generate')} (CSV)`}
                </button>
              )}
              {key === 'overview' && (
                <a href={`/api/briefing?locale=${locale}`} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-surface/70 transition-colors hover:border-gold/30 hover:text-gold">
                  {t('generate')} (PDF)
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">{t('recent')}</h2>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          {history.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-surface/40">No reports generated yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-[10px] uppercase tracking-widest text-surface/40">
                <tr><th className="px-5 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Format</th><th className="px-4 py-3 font-medium">Rows</th></tr>
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
