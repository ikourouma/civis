'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';

import { CivisLoader } from '@/components/ui/CivisLoader';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { signIn } from '@/lib/services/auth/auth.client.service';
import { submitBasicRegistrationAction } from '@/app/[locale]/portal/register/basic/actions';
import { cn } from '@/lib/utils';

const LANGUAGE_NAME: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  pt: 'Português',
  sw: 'Kiswahili',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BasicRegistrationForm({
  locale,
  tenantId,
  defaultCountry,
  supportedLanguages,
}: {
  locale: 'en' | 'fr';
  tenantId: string;
  defaultCountry: string;
  supportedLanguages: string[];
}) {
  const t = useTranslations('registration.phase1');
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [language, setLanguage] = useState(supportedLanguages[0] ?? 'en');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    firstName.trim() && lastName.trim() && EMAIL_RE.test(email) && phone && phoneValid;

  function handleSubmit() {
    if (!canSubmit) {
      setError(t('validation_error'));
      return;
    }
    setError(null);
    setSubmitting(true);

    startTransition(async () => {
      const result = await submitBasicRegistrationAction({
        tenantId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneCountryCode: defaultCountry,
        phoneNumber: phone,
        preferredLanguage: language,
        consentLanguage: locale,
      });

      if (result.error || !result.sessionPassword) {
        setSubmitting(false);
        setError(result.error ?? 'Registration failed. Please try again.');
        return;
      }

      // Auto-login with the transient session password, then enter the portal.
      const signInResult = await signIn({
        email: email.trim().toLowerCase(),
        password: result.sessionPassword,
      });

      setDone(true);
      setTimeout(() => {
        if (signInResult.success) {
          router.push(`/${locale}/portal/dashboard`);
          router.refresh();
        } else {
          // Account created but auto-login failed — send to sign-in.
          router.push(`/${locale}/auth/signin`);
        }
      }, 1500);
    });
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-navy-deepest px-6">
        <CheckCircle2 className="mb-6 h-16 w-16 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">{t('success_title')}</h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-surface/60">
          <CivisLoader size="sm" /> {t('success_redirecting')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-navy-deepest px-6 py-16">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
            {t('step_label')}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-2 text-sm text-surface/60">{t('subtitle')}</p>
        </header>

        <div className="space-y-5">
          <Field label={t('first_name_label')} helper={t('first_name_helper')} required>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              autoComplete="given-name"
            />
          </Field>

          <Field label={t('last_name_label')} helper={t('last_name_helper')} required>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              autoComplete="family-name"
            />
          </Field>

          <Field label={t('email_label')} helper={t('email_helper')} required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </Field>

          <Field label={t('phone_label')} helper={t('phone_helper')} required>
            <PhoneInput
              defaultCountry={defaultCountry}
              locale={locale}
              helperText=""
              onChange={(e164, valid) => {
                setPhone(e164);
                setPhoneValid(valid);
              }}
            />
          </Field>

          <Field label={t('language_label')} helper={t('language_helper')} required>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
              {supportedLanguages.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_NAME[l] ?? l.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>

          {/* Consent confirmed banner */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-xs text-emerald-400">{t('consent_confirmed')}</span>
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-opacity',
              canSubmit && !submitting
                ? 'bg-gold text-navy-deepest hover:opacity-90'
                : 'cursor-not-allowed bg-white/10 text-surface/40',
            )}
          >
            {submitting ? <CivisLoader size="sm" /> : <>{t('submit')} <ArrowRight className="h-4 w-4" /></>}
          </button>

          <div className="text-center">
            <p className="text-xs text-surface/40">{t('estimated_time')}</p>
            <p className="mt-1 text-xs text-surface/40">{t('next_steps_note')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-white placeholder-surface/30 transition-colors focus:border-gold/40 focus:outline-none';

function Field({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white">
        {label}
        {required && <span className="ml-1 text-gold">*</span>}
      </label>
      <p className="mb-1.5 text-xs text-surface/40">{helper}</p>
      {children}
    </div>
  );
}
