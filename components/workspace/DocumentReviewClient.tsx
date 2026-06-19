'use client';

import { Check, Download, Eye, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { getSignedDocUrl } from '@/lib/services/documents/document.actions';
import type { ReviewDocument } from '@/lib/services/documents/document-review.service';
import { reviewDocumentAction } from '@/lib/services/registrants/registrant.actions';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  uploaded: 'bg-blue-400/15 text-blue-400',
  under_review: 'bg-amber-400/15 text-amber-400',
  verified: 'bg-emerald-400/15 text-emerald-400',
  rejected: 'bg-red-400/15 text-red-400',
  expired: 'bg-white/5 text-surface/50',
};

const DOC_TYPES = ['passport', 'national_id', 'birth_certificate', 'proof_of_residence', 'visa', 'other'];

interface Props {
  documents: ReviewDocument[];
  filters: { status?: string; type?: string; q?: string };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DocumentReviewClient({ documents, filters }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  function applyFilter(patch: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...patch };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v as string); });
    router.push(`?${params.toString()}`);
  }

  function review(doc: ReviewDocument, decision: 'verified' | 'rejected') {
    startTransition(async () => {
      const res = await reviewDocumentAction(doc.id, doc.registrantId, decision, decision === 'rejected' ? 'Rejected by reviewer' : undefined);
      if (res.success) toast({ type: 'success', title: decision === 'verified' ? 'Document verified' : 'Document rejected' });
      else toast({ type: 'error', title: 'Action failed', description: res.error });
    });
  }

  async function openPreview(doc: ReviewDocument) {
    const url = await getSignedDocUrl(doc.storagePath);
    if (url) { setPreviewUrl(url); setPreviewName(doc.fileName); }
    else toast({ type: 'error', title: 'Could not load document' });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Consular Services</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Document Review</h1>
        <p className="mt-1 text-sm text-surface/60">Review uploaded identity documents for your embassy&apos;s registrants.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          defaultValue={filters.q}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter({ q: (e.target as HTMLInputElement).value })}
          placeholder="Search by registrant name…"
          className="flex-1 min-w-[220px] rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
        />
        <select value={filters.status ?? ''} onChange={(e) => applyFilter({ status: e.target.value })} className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:outline-none">
          <option value="">All statuses</option>
          {['uploaded', 'under_review', 'verified', 'rejected', 'expired'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={filters.type ?? ''} onChange={(e) => applyFilter({ type: e.target.value })} className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:outline-none">
          <option value="">All types</option>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      <section className="overflow-hidden rounded-xl border border-white/5">
        {documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents to review" description="Documents will appear here when registrants upload them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-navy-deep text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                  <th className="px-4 py-3 text-left">Registrant</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-surface/80">{d.registrantName}</td>
                    <td className="px-4 py-3 capitalize text-surface/70">{d.documentType.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-surface/60">{d.fileName}</td>
                    <td className="px-4 py-3"><span className={cn('rounded px-2 py-0.5 text-xs capitalize', STATUS_BADGE[d.status] ?? 'bg-white/5 text-surface/50')}>{d.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-surface/50">{fmtDate(d.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openPreview(d)} title="Preview" className="rounded p-1.5 text-surface/60 hover:text-gold"><Eye className="h-4 w-4" /></button>
                        <button type="button" disabled={isPending || d.status === 'verified'} onClick={() => review(d, 'verified')} title="Verify" className="rounded p-1.5 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-30"><Check className="h-4 w-4" /></button>
                        <button type="button" disabled={isPending || d.status === 'rejected'} onClick={() => review(d, 'rejected')} title="Reject" className="rounded p-1.5 text-red-400 hover:bg-red-400/10 disabled:opacity-30"><X className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-white/10 bg-navy-deep" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{previewName}</p>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download className="rounded p-1 text-surface/60 hover:text-gold"><Download className="h-4 w-4" /></a>
                <button type="button" onClick={() => setPreviewUrl(null)} className="rounded p-1 text-surface/60 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {/\.pdf($|\?)/i.test(previewUrl) ? (
                <iframe src={previewUrl} title={previewName} className="h-[70vh] w-full rounded" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={previewName} className="mx-auto max-h-[70vh] rounded object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
