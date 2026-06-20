'use client';

import { ShieldAlert } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

import { clearTenantContextAction } from '@/lib/services/auth/context.actions';

export function TenantContextBanner({ tenantName, tier }: { tenantName: string; tier: string }) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="sticky top-0 z-[80] flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gold/30 bg-gold/15 px-6 py-2 text-xs text-gold">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span className="font-semibold uppercase tracking-wide">Admin View</span>
      <span className="text-gold/90">
        You are viewing as {tenantName} ({tier} tier). All actions are audit-logged under your super admin account.
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => clearTenantContextAction(locale))}
        className="ml-auto rounded-md border border-gold/40 px-3 py-1 font-semibold hover:bg-gold/20 disabled:opacity-50"
      >
        Exit Admin View →
      </button>
    </div>
  );
}
