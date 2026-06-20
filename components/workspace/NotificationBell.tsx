'use client';

import { Bell, Check } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';

import { useRouter } from '@/i18n/navigation';
import {
  loadNotificationsAction,
  markAllReadAction,
  markReadAction,
  unreadCountAction,
} from '@/lib/services/notifications/notification.actions';
import type { Notification } from '@/lib/services/notifications';
import { cn } from '@/lib/utils';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  // Initial unread count + periodic refresh.
  useEffect(() => {
    let active = true;
    const load = () => unreadCountAction().then((n) => { if (active) setUnread(n); });
    load();
    const id = setInterval(load, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadNotificationsAction(false).then(setItems);
  }

  function onItemClick(n: Notification) {
    if (!n.isRead) {
      startTransition(async () => { await markReadAction(n.id); });
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.linkUrl) router.push(n.linkUrl);
  }

  function markAll() {
    startTransition(async () => { await markAllReadAction(); });
    setItems((cur) => cur.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-surface/60 transition-colors hover:bg-white/[0.04] hover:text-gold"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-navy-deepest">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-white/10 bg-navy-deep shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-surface/50">No notifications yet. Activity alerts will appear here.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => onItemClick(n)} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5', !n.isRead && 'bg-gold/[0.04]')}>
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-gold')} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm', n.isRead ? 'text-surface/70' : 'font-semibold text-white')}>{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-surface/50">{n.body}</p>
                        <p className="mt-1 text-[10px] text-surface/30">{relativeTime(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" onClick={() => { setOpen(false); router.push('/workspace/notifications'); }} className="block w-full border-t border-white/5 px-4 py-3 text-center text-xs text-gold hover:bg-white/5">
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );
}
