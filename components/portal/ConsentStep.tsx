'use client';

import { ArrowRight, Database, FileCheck, Lock, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { buildConsentText } from '@/lib/services/consent/consent-text';
import { textOnColor } from '@/lib/branding/colors';
import { cn } from '@/lib/utils';

export function ConsentStep({
  locale,
  tenantId,
  governmentName,
  brandPrimary,
  sealUrl,
}: {
  locale: 'en' | 'fr';
  tenantId: string;
  governmentName: string;
  brandPrimary: string;
  sealUrl?: string;
}) {
  const t = useTranslations('registration.consent');
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const consentText = buildConsentText(governmentName, locale);
  const onPrimary = textOnColor(brandPrimary);

  const blocks = [
    { Icon: Database, title: t('block_collect_title'), body: t('block_collect_body') },
    { Icon: FileCheck, title: t('block_why_title'), body: t('block_why_body') },
    { Icon: ShieldCheck, title: t('block_protect_title'), body: t('block_protect_body') },
    { Icon: Lock, title: t('block_rights_title'), body: t('block_rights_body') },
  ];

  function handleContinue() {
    if (agreed) router.push(`/${locale}/portal/register/basic?tenant=${tenantId}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-navy-deepest px-6 py-16">
      <div className="w-full max-w-2xl">
        {/* Branded header */}
        <div
          className="flex items-center gap-4 rounded-2xl px-6 py-5"
          style={{ backgroundColor: brandPrimary, color: onPrimary }}
        >
          {sealUrl && <img src={sealUrl} alt={governmentName} className="h-12 w-12 object-contain" />}
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80">{t('eyebrow')}</p>
            <h1 className="text-xl font-bold">{governmentName}</h1>
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold text-white">
          {t('title', { government: governmentName })}
        </h2>
        <p className="mt-2 text-sm text-surface/60">{t('subtitle')}</p>

        {/* Four info blocks */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {blocks.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-white/5 bg-navy-deep p-4">
              <Icon className="mb-2 h-5 w-5 text-gold/70" />
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-surface/50">{body}</p>
            </div>
          ))}
        </div>

        {/* Consent statement */}
        <div className="mt-6 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-navy-deep p-4">
          <p className="text-sm leading-relaxed text-surface/80">{consentText}</p>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-gold"
          />
          <span className="text-sm text-surface/70">{t('agree', { government: governmentName })}</span>
        </label>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!agreed}
          className={cn(
            'mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-opacity',
            agreed ? 'bg-gold text-navy-deepest hover:opacity-90' : 'cursor-not-allowed bg-white/10 text-surface/40',
          )}
        >
          {t('continue')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
