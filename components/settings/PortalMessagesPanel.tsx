'use client';

import { ChevronDown, ChevronUp, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { PortalCarousel } from '@/components/portal/PortalCarousel';
import { useToast } from '@/components/ui/Toast';
import {
  createPortalMessageAction,
  deletePortalMessageAction,
  loadPortalMessagesAction,
  reorderPortalMessagesAction,
  updatePortalMessageAction,
} from '@/lib/services/portal/portal-messages.actions';
import type { PortalMessage } from '@/lib/services/portal/portal-messages.service';

const MAX = 5;

interface Draft {
  id?: string;
  headlineEn: string;
  headlineFr: string;
  subtitleEn: string;
  subtitleFr: string;
}

const EMPTY: Draft = { headlineEn: '', headlineFr: '', subtitleEn: '', subtitleFr: '' };

export function PortalMessagesPanel({ primary }: { primary: string }) {
  const t = useTranslations('portal_messages');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function reload() {
    startTransition(async () => {
      const all = await loadPortalMessagesAction();
      setMessages(all.filter((m) => m.isActive));
    });
  }
  useEffect(reload, []);

  function save(draft: Draft) {
    if (!draft.headlineEn.trim()) { toast({ type: 'warning', title: t('headline_en') }); return; }
    startTransition(async () => {
      const payload = {
        headlineEn: draft.headlineEn.trim(),
        headlineFr: draft.headlineFr.trim() || undefined,
        subtitleEn: draft.subtitleEn.trim() || undefined,
        subtitleFr: draft.subtitleFr.trim() || undefined,
      };
      const res = draft.id
        ? await updatePortalMessageAction(draft.id, payload)
        : await createPortalMessageAction(payload);
      if (res.success) { toast({ type: 'success', title: 'Saved' }); setEditing(null); reload(); }
      else toast({ type: 'error', title: 'Save failed', description: res.error });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deletePortalMessageAction(id);
      if (res.success) { toast({ type: 'success', title: t('remove_message') }); reload(); }
      else toast({ type: 'error', title: 'Remove failed', description: res.error });
    });
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...messages];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setMessages(next);
    startTransition(async () => {
      await reorderPortalMessagesAction(next.map((m) => m.id));
    });
  }

  const previewSlides = messages.map((m) => ({ id: m.id, headline: m.headlineEn, subtitle: m.subtitleEn }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white">{t('settings_title')}</h2>
        <p className="mt-1 text-xs text-surface/50">{t('settings_subtitle')}</p>
      </div>

      <ul className="space-y-2">
        {messages.length === 0 && <li className="rounded-lg border border-white/5 bg-navy px-4 py-6 text-center text-sm text-surface/40">No messages yet.</li>}
        {messages.map((m, i) => (
          <li key={m.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-navy p-3">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-surface/40 hover:text-gold disabled:opacity-20"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === messages.length - 1} className="text-surface/40 hover:text-gold disabled:opacity-20"><ChevronDown className="h-4 w-4" /></button>
            </div>
            <p className="min-w-0 flex-1 text-sm text-surface/80">{m.headlineEn}</p>
            <button type="button" onClick={() => setEditing({ id: m.id, headlineEn: m.headlineEn, headlineFr: m.headlineFr ?? '', subtitleEn: m.subtitleEn ?? '', subtitleFr: m.subtitleFr ?? '' })} className="rounded p-1 text-surface/60 hover:text-gold" title={t('edit_message')}><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => remove(m.id)} className="rounded p-1 text-surface/60 hover:text-red-400" title={t('remove_message')}><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={messages.length >= MAX}
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20 disabled:opacity-40"
          title={messages.length >= MAX ? t('max_reached') : undefined}
        >
          <Plus className="h-3.5 w-3.5" /> {t('add_message')}
        </button>
        {messages.length > 0 && (
          <button type="button" onClick={() => setShowPreview((s) => !s)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 hover:text-white">
            <Eye className="h-3.5 w-3.5" /> {t('preview')}
          </button>
        )}
      </div>

      {showPreview && previewSlides.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-deepest p-8">
          <PortalCarousel slides={previewSlides} registrantCount={0} primary={primary} countLabel="" />
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg space-y-3 rounded-xl border border-white/10 bg-navy-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing.id ? t('edit_message') : t('add_message')}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <Field label={t('headline_en')} value={editing.headlineEn} onChange={(v) => setEditing({ ...editing, headlineEn: v })} />
            <Field label={t('headline_fr')} value={editing.headlineFr} onChange={(v) => setEditing({ ...editing, headlineFr: v })} />
            <Field label={t('subtitle_en')} value={editing.subtitleEn} onChange={(v) => setEditing({ ...editing, subtitleEn: v })} />
            <Field label={t('subtitle_fr')} value={editing.subtitleFr} onChange={(v) => setEditing({ ...editing, subtitleFr: v })} />
            <button type="button" disabled={isPending} onClick={() => save(editing)} className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none" />
    </label>
  );
}
