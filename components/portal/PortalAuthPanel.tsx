'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';

import { PhoneInput } from '@/components/ui/PhoneInput';
import { signIn } from '@/lib/services/auth/auth.client.service';
import { submitBasicRegistrationAction } from '@/app/[locale]/portal/register/basic/actions';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  tenantId: string;
  countryCode: string;
  displayName: string;
  brandPrimary: string;
  supportedLanguages: string[];
}

export function PortalAuthPanel({ tenantId, countryCode, displayName, brandPrimary, supportedLanguages }: Props) {
  const router = useRouter();
  const locale = useLocale() as 'en' | 'fr';
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sign in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [consent, setConsent] = useState(false);

  const accent = { backgroundColor: brandPrimary };

  function doSignIn() {
    setError(null);
    startTransition(async () => {
      const res = await signIn({ email: email.trim().toLowerCase(), password });
      if (res.success) {
        router.push(`/${locale}/portal/dashboard`);
        router.refresh();
      } else {
        setError(res.error ?? 'Sign in failed.');
      }
    });
  }

  function doRegister() {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !EMAIL_RE.test(regEmail) || !phone || !phoneValid) {
      setError('Please complete all fields with a valid email and phone.');
      return;
    }
    if (!consent) {
      setError('You must consent to register.');
      return;
    }
    startTransition(async () => {
      const result = await submitBasicRegistrationAction({
        tenantId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: regEmail.trim().toLowerCase(),
        phoneCountryCode: countryCode,
        phoneNumber: phone,
        preferredLanguage: locale,
        consentLanguage: locale,
      });
      if (result.error || !result.sessionPassword) {
        setError(result.error ?? 'Registration failed.');
        return;
      }
      const signInResult = await signIn({ email: regEmail.trim().toLowerCase(), password: result.sessionPassword });
      if (signInResult.success) {
        router.push(`/${locale}/portal/dashboard`);
        router.refresh();
      } else {
        router.push(`/${locale}/auth/signin`);
      }
    });
  }

  const inputClass = 'h-11 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none';

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex rounded-lg border border-white/10 p-1">
        {(['signin', 'register'] as const).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => { setTab(tk); setError(null); }}
            className={cn('flex-1 rounded-md py-2 text-sm font-medium transition-colors', tab === tk ? 'text-navy-deepest' : 'text-surface/60 hover:text-white')}
            style={tab === tk ? accent : undefined}
          >
            {tk === 'signin' ? 'Sign In' : 'Register'}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-400">{error}</div>}

      {tab === 'signin' ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Welcome Back</h3>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputClass} onKeyDown={(e) => e.key === 'Enter' && doSignIn()} />
          <button type="button" disabled={isPending} onClick={doSignIn} className="w-full rounded-lg py-2.5 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50" style={accent}>
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
          <div className="flex items-center gap-3 py-1 text-[10px] uppercase tracking-widest text-surface/30">
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </div>
          <button type="button" title="Coming soon" disabled className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-surface/40">
            Sign in with Magic Link
          </button>
          <p className="pt-1 text-center text-xs text-surface/40">Having trouble? Contact your embassy.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Register as a Citizen</h3>
          <p className="text-xs text-surface/50">Create your account with {displayName}</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputClass} />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputClass} />
          </div>
          <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email" className={inputClass} />
          <PhoneInput defaultCountry={countryCode || 'US'} locale={locale} helperText="" onChange={(e164, valid) => { setPhone(e164); setPhoneValid(!!valid); }} />
          <label className="flex items-start gap-2 text-xs text-surface/70">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold" />
            <span>I consent to register with {displayName}.</span>
          </label>
          <button type="button" disabled={isPending} onClick={doRegister} className="w-full rounded-lg py-2.5 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50" style={accent}>
            {isPending ? 'Registering…' : 'Register'}
          </button>
          <p className="pt-1 text-center text-xs text-surface/40">Already registered? <button type="button" onClick={() => setTab('signin')} className="text-gold hover:underline">Switch to Sign In</button>.</p>
          {/* supportedLanguages reserved for future locale switcher */}
          <span className="hidden">{supportedLanguages.join(',')}</span>
        </div>
      )}
    </div>
  );
}
