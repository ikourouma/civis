'use client';

import { Bell } from 'lucide-react';
import { useLocale } from 'next-intl';

import { useBrand } from '@/components/providers/BrandProvider';
import { getBrandingRules } from '@/lib/branding/tier-rules';
import type { CivisUser } from '@/lib/services/auth/auth.types';

function initialsOf(user: CivisUser): string {
  const name = user.fullName?.trim() || user.email;
  const parts = name.split(/[\s@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'C') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function CivisWordmark() {
  return (
    <span className="whitespace-nowrap text-base font-bold tracking-[0.2em] text-white">
      CIVIS<span className="text-gold">.</span>
    </span>
  );
}

// Tier-dependent identity lockup (Cloud / Government / Sovereign). See lib/branding/tier-rules.ts.
function BrandLockup() {
  const { brand, tier } = useBrand();
  const locale = useLocale() as 'en' | 'fr';
  const rules = getBrandingRules(tier);

  const countryName = brand ? brand.displayName[locale] ?? brand.displayName.en : '';
  const officialName = brand?.officialName?.[locale] ?? brand?.officialName?.en ?? countryName;
  const seal = brand?.assets.sealUrl;

  if (rules.headerLockup === 'civis-only' || !brand) {
    return <CivisWordmark />;
  }

  if (rules.headerLockup === 'civis-with-country-accent') {
    return (
      <div className="flex items-center gap-3">
        <CivisWordmark />
        {seal && (
          <img src={seal} alt={officialName} className="ml-1 h-7 w-7 object-contain opacity-80" />
        )}
        <span className="hidden text-xs text-surface/50 sm:inline">{countryName}</span>
      </div>
    );
  }

  if (rules.headerLockup === 'civis-and-country') {
    return (
      <div className="flex items-center gap-3">
        <CivisWordmark />
        <span className="mx-1 h-7 w-px bg-white/20" aria-hidden="true" />
        {seal && <img src={seal} alt={officialName} className="h-7 w-7 object-contain" />}
        <span className="text-sm font-medium text-white">{countryName}</span>
      </div>
    );
  }

  // country-only (sovereign)
  return (
    <div className="flex items-center gap-3">
      {seal && <img src={seal} alt={officialName} className="h-9 w-9 object-contain" />}
      <h1 className="text-sm font-semibold text-white">{officialName}</h1>
    </div>
  );
}

export function WorkspaceHeader({ user, title }: { user: CivisUser; title?: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-navy-deep px-6">
      <div className="flex items-center gap-4">
        <BrandLockup />
        {title && <p className="text-sm font-semibold text-white">{title}</p>}
      </div>
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
