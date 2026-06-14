'use client';

import { ArrowRight, ChevronDown, Globe, Lock, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import type { PublicTenant } from '@/lib/services/tenants/public-tenant.service';
import { cn } from '@/lib/utils';

const LANGUAGE_NAME: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  pt: 'Português',
  sw: 'Kiswahili',
};

export function TenantSelect({ tenants, locale }: { tenants: PublicTenant[]; locale: 'en' | 'fr' }) {
  const t = useTranslations('registration.tenant_select');
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('');
  const [open, setOpen] = useState(false);

  const selected = tenants.find((t) => t.id === selectedId) ?? null;
  const languages = selected
    ? selected.supportedLanguages.map((l) => LANGUAGE_NAME[l] ?? l.toUpperCase()).join(', ')
    : '';

  function handleContinue() {
    if (selectedId) router.push(`/${locale}/portal/register/consent?tenant=${selectedId}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-deepest px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-[0.2em] text-white">
            C<span className="text-gold">.</span>
          </span>
          <h1 className="mt-6 text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-surface/60">{t('subtitle')}</p>
        </div>

        {/* Selector */}
        <div className="rounded-2xl border border-white/10 bg-navy-deep p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-surface/50">
            {t('country_label')}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={cn(
                'flex h-12 w-full items-center justify-between rounded-lg border bg-navy px-4 text-left text-sm transition-colors',
                open ? 'border-gold/60' : 'border-white/10 hover:border-white/20',
              )}
            >
              {selected ? (
                <span className="flex items-center gap-2.5 text-white">
                  <span className="text-lg leading-none">{selected.flagEmoji}</span>
                  {selected.displayName[locale] ?? selected.displayName.en}
                </span>
              ) : (
                <span className="text-surface/40">{t('country_placeholder')}</span>
              )}
              <ChevronDown className={cn('h-4 w-4 text-surface/40 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
              <ul className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-white/10 bg-navy-deep py-1 shadow-xl">
                {tenants.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-surface/40">
                    No governments are currently accepting registrations.
                  </li>
                )}
                {tenants.map((tenant) => (
                  <li key={tenant.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(tenant.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06]',
                        tenant.id === selectedId ? 'border-l-2 border-gold' : 'border-l-2 border-transparent',
                      )}
                    >
                      <span className="text-lg leading-none">{tenant.flagEmoji}</span>
                      <span className="flex-1 truncate text-white">
                        {tenant.displayName[locale] ?? tenant.displayName.en}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-surface/30">
                        {tenant.countryCode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedId && (
            <button
              type="button"
              onClick={handleContinue}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90"
            >
              {t('continue')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Trust blocks */}
        <div className="mt-8 space-y-3">
          {[
            { Icon: Shield, text: t('trust_sovereign') },
            { Icon: Lock, text: t('trust_consent') },
            ...(selected ? [{ Icon: Globe, text: t('trust_languages', { languages }) }] : []),
          ].map(({ Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-surface/50">
              <Icon className="h-4 w-4 shrink-0 text-gold/60" />
              {text}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-surface/50">
          {t('already_registered')}{' '}
          <Link href="/auth/signin" className="font-semibold text-gold hover:underline">
            {t('sign_in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
