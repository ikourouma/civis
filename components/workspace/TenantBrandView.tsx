'use client';

import { CheckCircle2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { textOnColor } from '@/lib/branding/colors';
import { submitCustomizationRequest } from '@/lib/services/branding/branding.actions';
import type { CountryBrand } from '@/lib/services/branding/branding.service';
import type { DeploymentTier } from '@/lib/branding/tier-rules';

export function TenantBrandView({
  brand,
  tier,
  locale,
}: {
  brand: CountryBrand | null;
  tier: DeploymentTier;
  locale: 'en' | 'fr';
}) {
  const t = useTranslations('branding.tenant');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!message.trim()) return;
    setError(null);
    startTransition(async () => {
      const { success, error: err } = await submitCustomizationRequest(message);
      if (success) {
        setSent(true);
        setMessage('');
      } else {
        setError(err ?? 'Request failed');
      }
    });
  }

  if (!brand) {
    return (
      <div className="rounded-xl border border-white/5 bg-navy-deep p-10 text-center text-sm text-surface/50">
        No brand assigned to your tenant yet.
      </div>
    );
  }

  const primary = brand.palette.primary;
  const secondary = brand.palette.secondary;
  const accent = brand.palette.accent ?? '#FFFFFF';
  const name = brand.displayName[locale] ?? brand.displayName.en;
  const official = brand.officialName?.[locale] ?? brand.officialName?.en ?? name;

  return (
    <div className="space-y-6">
      {/* Brand preview card */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
        <div className="flex items-center gap-4 px-6 py-5" style={{ backgroundColor: primary }}>
          {brand.assets.sealUrl && (
            <img src={brand.assets.sealUrl} alt={official} className="h-12 w-12 object-contain" />
          )}
          <div style={{ color: textOnColor(primary) }}>
            <p className="text-lg font-bold">{name}</p>
            <p className="text-xs opacity-80">{official}</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {brand.motto?.[locale] || brand.motto?.en ? (
            <p className="text-sm italic text-surface/60">“{brand.motto[locale] ?? brand.motto.en}”</p>
          ) : null}

          {/* Palette */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
              Palette
            </p>
            <div className="flex gap-3">
              {[
                { label: 'Primary', color: primary },
                { label: 'Secondary', color: secondary },
                { label: 'Accent', color: accent },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span
                    className="h-8 w-8 rounded border border-white/10"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <p className="text-xs text-white">{c.label}</p>
                    <p className="font-mono text-[10px] text-surface/40">{c.color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locale + tier */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Language</p>
              <p className="text-surface/80">{brand.locale.defaultLanguage.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Currency</p>
              <p className="text-surface/80">{brand.locale.currencyCode ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Tier</p>
              <p className="capitalize text-surface/80">{tier}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customization request */}
      <div className="rounded-xl border border-white/5 bg-navy-deep p-6">
        {sent ? (
          <div className="flex items-center gap-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            {t('request_sent')}
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-white">{t('request_customization')}</h2>
            <p className="mt-1 text-xs text-surface/50">{t('customization_help')}</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={t('request_placeholder')}
              className="mt-3 w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !message.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {t('request_customization')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
