'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Check, Globe, Lock, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';

import { CivisLoader } from '@/components/ui/CivisLoader';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useToast } from '@/components/ui/Toast';
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

export function PortalAuthPanel({ tenantId, countryCode, displayName, brandPrimary }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const locale = useLocale() as 'en' | 'fr';
  const reduce = useReducedMotion();
  const { toast } = useToast();

  // Register is the default tab; ?mode=signin opens Sign In.
  const [tab, setTab] = useState<'signin' | 'register'>(search.get('mode') === 'signin' ? 'signin' : 'register');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      } else setError(res.error ?? 'Sign in failed.');
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
      setSuccess(true);
      const signInResult = await signIn({ email: regEmail.trim().toLowerCase(), password: result.sessionPassword });
      setTimeout(() => {
        if (signInResult.success) {
          router.push(`/${locale}/portal/dashboard`);
          router.refresh();
        } else {
          router.push(`/${locale}/auth/signin`);
        }
      }, 1000);
    });
  }

  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item: Variants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="w-full max-w-sm">
      {/* Tab bar */}
      <nav className="mb-6 flex rounded-lg border border-white/10 p-1" aria-label="Authentication">
        {(['register', 'signin'] as const).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => { setTab(tk); setError(null); }}
            aria-current={tab === tk}
            className={cn('flex-1 rounded-md py-2 text-sm font-medium transition-colors', tab === tk ? 'text-navy-deepest' : 'text-surface/60 hover:text-white')}
            style={tab === tk ? accent : undefined}
          >
            {tk === 'register' ? 'Register' : 'Sign In'}
          </button>
        ))}
      </nav>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-400">{error}</div>}

      {tab === 'register' ? (
        <motion.form
          key="register"
          variants={container}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); doRegister(); }}
        >
          <motion.div variants={item}>
            <h2 className="text-lg font-bold text-white">Register as a Citizen</h2>
            <p className="text-xs text-surface/50">Create your account with {displayName}</p>
          </motion.div>

          {/* Micro-value strip */}
          <motion.div variants={item} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] text-surface/60">
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" style={{ color: brandPrimary }} /> Secure</span>
            <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" style={{ color: brandPrimary }} /> Fast</span>
            <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" style={{ color: brandPrimary }} /> Free</span>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <FloatingInput id="firstName" label="First name" value={firstName} onChange={setFirstName} valid={firstName.trim().length > 1} primary={brandPrimary} />
            <FloatingInput id="lastName" label="Last name" value={lastName} onChange={setLastName} valid={lastName.trim().length > 1} primary={brandPrimary} />
          </motion.div>
          <motion.div variants={item}>
            <FloatingInput id="regEmail" type="email" label="Email" value={regEmail} onChange={setRegEmail} valid={EMAIL_RE.test(regEmail)} primary={brandPrimary} />
          </motion.div>
          <motion.div variants={item}>
            <PhoneInput defaultCountry={countryCode || 'US'} locale={locale} helperText="" onChange={(e164, valid) => { setPhone(e164); setPhoneValid(!!valid); }} />
          </motion.div>
          <motion.label variants={item} className="flex items-start gap-2 text-xs text-surface/70">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold" aria-describedby="consent-help" />
            <span id="consent-help">I consent to register with {displayName}.</span>
          </motion.label>
          <motion.button
            variants={item}
            type="submit"
            disabled={isPending || success}
            whileHover={reduce || isPending ? undefined : { scale: 1.02 }}
            className={cn('flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all disabled:opacity-80', success ? 'bg-emerald-500 text-white' : 'text-navy-deepest hover:shadow-lg')}
            style={success ? undefined : accent}
          >
            {success ? '✓ Account Created' : isPending ? <CivisLoader size="sm" /> : 'Create My Account →'}
          </motion.button>
          <motion.p variants={item} className="text-center text-xs text-surface/40">
            Already registered? <button type="button" onClick={() => setTab('signin')} className="text-gold hover:underline">Switch to Sign In</button>.
          </motion.p>
          <TrustLine />
        </motion.form>
      ) : (
        <motion.form
          key="signin"
          variants={container}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); doSignIn(); }}
        >
          <motion.h2 variants={item} className="text-lg font-bold text-white">Welcome back</motion.h2>
          <motion.div variants={item}>
            <FloatingInput id="email" type="email" label="Email" value={email} onChange={setEmail} valid={EMAIL_RE.test(email)} primary={brandPrimary} />
          </motion.div>
          <motion.div variants={item}>
            <FloatingInput id="password" type="password" label="Password" value={password} onChange={setPassword} valid={password.length >= 6} primary={brandPrimary} />
          </motion.div>
          <motion.div variants={item} className="flex justify-end">
            <button type="button" onClick={() => toast({ type: 'info', title: 'Password help', description: 'Contact your embassy for password assistance.' })} className="text-xs text-surface/50 hover:text-gold">
              Forgot password?
            </button>
          </motion.div>
          <motion.button
            variants={item}
            type="submit"
            disabled={isPending}
            whileHover={reduce || isPending ? undefined : { scale: 1.02 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-navy-deepest transition-all hover:shadow-lg disabled:opacity-80"
            style={accent}
          >
            {isPending ? <CivisLoader size="sm" /> : 'Sign In'}
          </motion.button>
          <motion.div variants={item} className="flex items-center gap-3 py-1 text-[10px] uppercase tracking-widest text-surface/30">
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </motion.div>
          <motion.button variants={item} type="button" title="Coming soon" disabled className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-surface/40">
            Sign in with Magic Link
          </motion.button>
          <motion.p variants={item} className="text-center text-xs text-surface/40">Having trouble? Contact your embassy.</motion.p>
          <TrustLine />
        </motion.form>
      )}
    </div>
  );
}

function FloatingInput({
  id, label, value, onChange, valid, primary, type = 'text',
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  valid: boolean; primary: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className="peer h-12 w-full rounded-lg border border-white/10 bg-navy px-3 pt-3 text-sm text-white outline-none transition-colors"
        style={focused ? { borderColor: primary } : undefined}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1.5 text-[10px] uppercase tracking-wide text-surface/40 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wide"
      >
        {label}
      </label>
      {valid && value && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" aria-hidden="true" />}
    </div>
  );
}

function TrustLine() {
  return (
    <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-surface/30">
      <Lock className="h-3 w-3" aria-hidden="true" />
      256-bit encryption · GDPR compliant · Sovereign infrastructure
    </p>
  );
}
