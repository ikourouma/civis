import { Bell } from 'lucide-react';

import type { CivisUser } from '@/lib/services/auth/auth.types';

function initialsOf(user: CivisUser): string {
  const name = user.fullName?.trim() || user.email;
  const parts = name.split(/[\s@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'C') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function WorkspaceHeader({ user, title }: { user: CivisUser; title?: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-navy-deep px-6">
      <p className="text-sm font-semibold text-white">{title ?? ''}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-md p-2 text-surface/60 transition-colors hover:bg-white/[0.04] hover:text-gold"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-[11px] font-semibold text-gold"
          >
            {initialsOf(user)}
          </span>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-white">{user.fullName ?? user.email}</p>
            <p className="text-[10px] uppercase tracking-widest text-surface/40">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
