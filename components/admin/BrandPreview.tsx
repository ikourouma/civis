'use client';

import { useState } from 'react';

import { textOnColor } from '@/lib/branding/colors';
import type { CountryBrand } from '@/lib/services/branding/branding.service';
import { getBrandingRules, type DeploymentTier } from '@/lib/branding/tier-rules';
import { cn } from '@/lib/utils';

const TIERS: { key: DeploymentTier; label: string }[] = [
  { key: 'cloud', label: 'Cloud' },
  { key: 'government', label: 'Government' },
  { key: 'sovereign', label: 'Sovereign' },
];

export function BrandPreview({ brand, locale }: { brand: CountryBrand; locale: 'en' | 'fr' }) {
  const [tier, setTier] = useState<DeploymentTier>('government');
  const rules = getBrandingRules(tier);

  const primary = brand.palette.primary;
  const secondary = brand.palette.secondary;
  const accent = brand.palette.accent ?? '#FFFFFF';
  const onPrimary = textOnColor(primary);
  const name = brand.displayName[locale] ?? brand.displayName.en;
  const official = brand.officialName?.[locale] ?? brand.officialName?.en ?? name;
  const seal = brand.assets.sealUrl;

  return (
    <div className="space-y-6">
      {/* Tier toggle */}
      <div className="flex gap-2">
        {TIERS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTier(tb.key)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              tier === tb.key
                ? 'bg-gold text-navy-deepest'
                : 'border border-white/10 text-surface/60 hover:text-white',
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Sample chrome rendered with the brand */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
        {/* Sample header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: primary }}>
          <div className="flex items-center gap-3" style={{ color: onPrimary }}>
            {rules.headerLockup === 'civis-only' && (
              <span className="text-base font-bold tracking-[0.2em]">CIVIS.</span>
            )}
            {rules.headerLockup === 'civis-with-country-accent' && (
              <>
                <span className="text-base font-bold tracking-[0.2em]">CIVIS.</span>
                {seal && <img src={seal} alt={official} className="h-7 w-7 object-contain" />}
                <span className="text-sm opacity-80">{name}</span>
              </>
            )}
            {rules.headerLockup === 'civis-and-country' && (
              <>
                <span className="text-base font-bold tracking-[0.2em]">CIVIS.</span>
                <span className="mx-1 h-6 w-px opacity-40" style={{ backgroundColor: onPrimary }} />
                {seal && <img src={seal} alt={official} className="h-7 w-7 object-contain" />}
                <span className="text-sm font-medium">{name}</span>
              </>
            )}
            {rules.headerLockup === 'country-only' && (
              <>
                {seal && <img src={seal} alt={official} className="h-9 w-9 object-contain" />}
                <span className="text-sm font-semibold">{official}</span>
              </>
            )}
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: accent, color: textOnColor(accent) }}
          >
            {name}
          </span>
        </div>

        {/* Sample body */}
        <div className="space-y-5 p-6">
          {/* Dashboard tile */}
          <div className="grid grid-cols-3 gap-4">
            {['Registrants', 'Verified', 'Pending'].map((label, i) => (
              <div
                key={label}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: i === 0 ? brand.palette.surface[50] ?? '#F5F8FC' : '#F8FAFC',
                  border: `1px solid ${brand.palette.surface[100] ?? '#EAF2FA'}`,
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold" style={{ color: primary }}>
                  {(i + 1) * 1234}
                </p>
              </div>
            ))}
          </div>

          {/* Sample form + buttons */}
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">Full name</label>
            <input
              disabled
              placeholder="Jane Doe"
              className="h-10 w-full rounded-lg border px-3 text-sm"
              style={{ borderColor: brand.palette.surface[100] ?? '#EAF2FA' }}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: primary, color: onPrimary }}
              >
                Primary action
              </button>
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: primary, color: primary }}
              >
                Secondary
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: secondary, color: textOnColor(secondary) }}
              >
                Accent
              </button>
            </div>
          </div>

          {/* Attribution per tier */}
          <p className="text-center text-xs text-gray-400">
            {rules.showCivisAttribution
              ? `Civis attribution: ${rules.civisAttributionPlacement}`
              : 'Civis attribution hidden (white-label)'}
            {' · '}
            Primary identity: {rules.primaryIdentity}
          </p>
        </div>
      </div>
    </div>
  );
}
