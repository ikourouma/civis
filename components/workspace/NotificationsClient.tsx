'use client';

import { Bell, Check } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from '@/i18n/navigation';
import { markAllReadAction, markReadAction } from '@/lib/services/notifications/notification.actions';
import type { Notification } from '@/lib/services/notifications';
import { cn } from '@/lib/utils';

const GROUPS: { key: string; label: string; types: string[] }[] = [
  { key: 'all', label: 'All', types: [] },
  { key: 'registration', label: 'Registration', types: ['registration_submitted', 'registration_approved', 'registration_rejected', 'profile_updated'] },
  { key: 'documents', label: 'Documents', types: ['document_uploaded', 'document_verified', 'document_rejected'] },
  { key: 'gdpr', label: 'GDPR', types: ['gdpr_request_received', 'gdpr_request_completed'] },
  { key: 'staff', label: 'Staff', types: ['staff_provisioned', 'embassy_created', 'entitlement_changed'] },
  { key: 'system', label: 'System', types: ['system_announcement', 'welcome'] },
];

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function NotificationsClient({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [group, setGroup] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    return items.filter((n) => {
      if (unreadOnly && n.isRead) return false;
      if (g && g.types.length && !g.types.includes(n.type)) return false;
      return true;
    });
  }, [items, group, unreadOnly]);

  function open(n: Notification) {
    if (!n.isRead) {
      startTransition(async () => { await markReadAction(n.id); });
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.linkUrl) router.push(n.linkUrl);
  }

  function markAll() {
    startTransition(async () => { await markAllReadAction(); });
    setItems((cur) => cur.map((x) => ({ ...x, isRead: true })));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Activity</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Notifications</h1>
        </div>
        <button type="button" onClick={markAll} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 hover:text-white">
          <Check className="h-3.5 w-3.5" /> Mark all read
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {GROUPS.map((g) => (
          <button key={g.key} type="button" onClick={() => setGroup(g.key)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', group === g.key ? 'bg-gold text-navy-deepest' : 'bg-white/5 text-surface/60 hover:text-white')}>
            {g.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-surface/60">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-3.5 w-3.5 accent-gold" /> Unread only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-navy-deep">
          <EmptyState icon={Bell} title="No notifications" description="Activity alerts will appear here as you and your team work." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => open(n)} className={cn('flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-gold/30', n.isRead ? 'border-white/5 bg-navy-deep' : 'border-gold/20 bg-gold/[0.04]')}>
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-gold')} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', n.isRead ? 'text-surface/70' : 'font-semibold text-white')}>{n.title}</p>
                  <p className="mt-0.5 text-xs text-surface/50">{n.body}</p>
                  <p className="mt-1 text-[10px] text-surface/30">{fmt(n.createdAt)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
