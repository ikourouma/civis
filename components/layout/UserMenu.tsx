'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getDefaultRoute } from '@/lib/rbac/roles';
import type { CivisUser } from '@/lib/services/auth/auth.types';
import { cn } from '@/lib/utils';

function initialsOf(user: CivisUser): string {
  const name = user.fullName?.trim() || user.email;
  const parts = name.split(/[\s@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'C') + (parts[1]?.[0] ?? '')).toUpperCase();
}

// "First name + last initial" — e.g. "Jane Doe" → "Jane D."
function shortName(user: CivisUser): string {
  const full = user.fullName?.trim();
  if (!full) return user.email.split('@')[0] ?? user.email;
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0] ?? full;
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0];
  return lastInitial ? `${first} ${lastInitial}.` : (first ?? full);
}

export function UserMenu({ user }: { user: CivisUser }) {
  const t = useTranslations('Header.userMenu');
  const tRoles = useTranslations('Roles');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // i18n Link adds the locale prefix itself, so strip it from the resolved route.
  const dashboardHref = getDefaultRoute(user.role, locale).replace(`/${locale}`, '');

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('menuLabel')}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-sm font-medium transition-colors',
          open ? 'bg-white/[0.06] text-gold' : 'text-surface/80 hover:bg-white/[0.04] hover:text-white',
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-[11px] font-semibold text-gold"
        >
          {initialsOf(user)}
        </span>
        <span className="hidden max-w-[10rem] truncate xl:inline">{shortName(user)}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-gold/20 bg-navy-deepest shadow-2xl"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold"
            >
              {initialsOf(user)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.fullName ?? user.email}
              </p>
              <p className="truncate text-xs text-surface/60">{user.email}</p>
            </div>
          </div>

          {/* Account type */}
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">
              {t('accountTypeLabel')}
            </p>
            <p className="mt-1 inline-flex rounded bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
              {tRoles(user.role)}
            </p>
          </div>

          {/* Actions */}
          <nav className="py-1">
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface/80 transition-colors hover:bg-navy-deep hover:text-gold"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              {t('dashboard')}
            </Link>
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface/80 transition-colors hover:bg-navy-deep hover:text-gold"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              {t('account')}
            </Link>
          </nav>

          {/* Sign out */}
          <div className="border-t border-white/5 py-1">
            <form action={`/${locale}/auth/signout`} method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-surface/80 transition-colors hover:bg-navy-deep hover:text-gold"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t('signOut')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
