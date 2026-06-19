'use client';

import { BarChart3, Download, FileText, FolderClock, Users } from 'lucide-react';
import { useState, useTransition } from 'react';

import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
  generateEmbassyReportAction,
  type EmbassyReportType,
} from '@/lib/services/reports/embassy-reports.actions';

const REPORTS: { type: EmbassyReportType; title: string; description: string; Icon: typeof FileText }[] = [
  { type: 'registration_summary', title: 'Embassy Registration Summary', description: 'All registrants for your embassy with status and completeness.', Icon: Users },
  { type: 'registration_trends', title: 'Registration Trends', description: 'Monthly registration counts for your embassy.', Icon: BarChart3 },
  { type: 'pending_cases', title: 'Pending Cases Report', description: 'Registrants awaiting verification.', Icon: FolderClock },
  { type: 'staff_activity', title: 'Staff Activity Report', description: 'Recent actions by your embassy staff.', Icon: FileText },
];

export function EmbassyReportsClient({ embassyName }: { embassyName: string | null }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<EmbassyReportType | null>(null);

  function generate(type: EmbassyReportType) {
    setBusy(type);
    startTransition(async () => {
      const res = await generateEmbassyReportAction(type);
      setBusy(null);
      if (res.error || !res.csv) {
        toast({ type: 'error', title: 'Report failed', description: res.error });
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename ?? `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ type: 'success', title: 'Report generated' });
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Embassy Operations</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Embassy Reports</h1>
        <p className="mt-1 text-sm text-surface/60">
          Generate and download reports{embassyName ? ` for ${embassyName}` : ''}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <div key={r.type} className="flex flex-col rounded-xl border border-white/5 bg-navy-deep p-5">
            <r.Icon className="h-5 w-5 text-gold" />
            <h3 className="mt-3 text-sm font-semibold text-white">{r.title}</h3>
            <p className="mt-1 flex-1 text-xs text-surface/50">{r.description}</p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => generate(r.type)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> {busy === r.type ? 'Generating…' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Recent Reports</h2>
        <div className="rounded-xl border border-white/5 bg-navy-deep">
          <EmptyState icon={FileText} title="No reports generated yet" description="Generated reports download immediately. A history log will appear here in a future release." />
        </div>
      </section>
    </div>
  );
}
