'use client';

import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';

import type { CivisUser } from '@/lib/services/auth/auth.types';
import { cn } from '@/lib/utils';
import { submitRegistrationAction } from '@/app/[locale]/portal/register/actions';
import type { RegistrationFormData } from '@/app/[locale]/portal/register/actions';

const CONSENT_TEXT_EN = `By registering with the Civis Diaspora Registry, I consent to the collection, storage, and processing of my personal information by the relevant government authority for the purpose of diaspora management, service delivery, and economic planning. I understand that my data will be handled in accordance with applicable data protection laws, that I may withdraw this consent at any time, and that my personal data will not be sold or shared with third parties without my explicit consent.`;

const CONSENT_TEXT_FR = `En m'inscrivant au Registre de la Diaspora Civis, je consens à la collecte, au stockage et au traitement de mes informations personnelles par l'autorité gouvernementale compétente aux fins de gestion de la diaspora, de prestation de services et de planification économique. Je comprends que mes données seront traitées conformément aux lois applicables en matière de protection des données, que je peux retirer ce consentement à tout moment et que mes données personnelles ne seront pas vendues ni partagées avec des tiers sans mon consentement explicite.`;

const STEPS = [
  { id: 1, label: 'Consent' },
  { id: 2, label: 'Personal' },
  { id: 3, label: 'Contact' },
  { id: 4, label: 'Professional' },
  { id: 5, label: 'Review' },
];

type FormData = Omit<RegistrationFormData, 'consentText' | 'consentLanguage'> & {
  consentAgreed: boolean;
};

const INITIAL: FormData = {
  consentAgreed: false,
  firstName: '',
  lastName: '',
  middleName: '',
  preferredName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  dualNationality: '',
  countryOfBirth: '',
  cityOfBirth: '',
  email: '',
  phonePrimary: '',
  preferredLanguage: 'en',
  countryOfResidence: '',
  cityOfResidence: '',
  yearsAbroad: undefined,
  entryYear: undefined,
  occupation: '',
  employer: '',
  industrySector: '',
  educationLevel: '',
  fieldOfStudy: '',
  generation: '',
  diasporaAssociation: '',
  returnInterest: false,
  investmentInterest: false,
};

interface Props {
  user: CivisUser;
  locale: string;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-surface/60">
      {children}
      {required && <span className="ml-1 text-red-400">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2.5 text-sm text-white placeholder-surface/30 transition-colors focus:border-gold/40 focus:outline-none"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2.5 text-sm text-surface/70 transition-colors focus:border-gold/40 focus:outline-none"
    >
      {children}
    </select>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs text-surface/50">{label}</dt>
      <dd className="text-right text-xs font-medium text-surface/80">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
      </dd>
    </div>
  );
}

export function RegistrationWizard({ user, locale }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [consentLang, setConsentLang] = useState<'en' | 'fr'>('en');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const consentText = consentLang === 'fr' ? CONSENT_TEXT_FR : CONSENT_TEXT_EN;

  function canProceed(): boolean {
    if (step === 1) return form.consentAgreed;
    if (step === 2) return !!form.firstName && !!form.lastName && !!form.nationality;
    if (step === 3) return !!form.countryOfResidence && !!form.cityOfResidence;
    return true;
  }

  function handleNext() {
    if (canProceed() && step < 5) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);

    const payload: RegistrationFormData = {
      ...form,
      consentText,
      consentLanguage: consentLang,
      yearsAbroad: form.yearsAbroad ? Number(form.yearsAbroad) : undefined,
      entryYear: form.entryYear ? Number(form.entryYear) : undefined,
    };

    startTransition(async () => {
      const { success, error } = await submitRegistrationAction(payload);
      setSubmitting(false);
      if (success) {
        setDone(true);
        setTimeout(() => router.push(`/${locale}/portal/dashboard`), 2000);
      } else {
        setSubmitError(error ?? 'Submission failed. Please try again.');
      }
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">Registration Submitted</h2>
        <p className="mt-2 text-sm text-surface/60">
          Redirecting to your portal dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          Diaspora Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Register with Civis</h1>
        <p className="mt-1 text-sm text-surface/60">
          Complete all steps to join the official diaspora registry.
        </p>
      </header>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map(({ id, label }, idx) => (
          <div key={id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  id < step
                    ? 'bg-emerald-400/20 text-emerald-400'
                    : id === step
                    ? 'bg-gold text-navy-deepest'
                    : 'bg-white/5 text-surface/30',
                )}
              >
                {id < step ? <CheckCircle2 className="h-4 w-4" /> : id}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-[10px] font-semibold uppercase tracking-wider',
                  id === step ? 'text-gold' : 'text-surface/30',
                )}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-4 h-px flex-1 transition-colors',
                  id < step ? 'bg-emerald-400/30' : 'bg-white/10',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-white/5 bg-navy-deep p-6">
        {/* Step 1 — Consent */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Data Consent</h2>
            <p className="text-sm text-surface/60">
              Please read the consent statement carefully before proceeding.
            </p>

            <div className="flex gap-2">
              {(['en', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setConsentLang(lang)}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-semibold transition-colors',
                    consentLang === lang
                      ? 'bg-gold text-navy-deepest'
                      : 'bg-white/5 text-surface/60 hover:text-surface/80',
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-navy p-4">
              <p className="text-sm leading-relaxed text-surface/80">{consentText}</p>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consentAgreed}
                onChange={(e) => set('consentAgreed', e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-gold"
              />
              <span className="text-sm text-surface/70">
                I have read and I agree to the data consent statement above.
              </span>
            </label>
          </div>
        )}

        {/* Step 2 — Personal */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <Input value={form.firstName} onChange={(v) => set('firstName', v)} required />
              </div>
              <div>
                <Label required>Last Name</Label>
                <Input value={form.lastName} onChange={(v) => set('lastName', v)} required />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input value={form.middleName ?? ''} onChange={(v) => set('middleName', v)} />
              </div>
              <div>
                <Label>Preferred Name</Label>
                <Input value={form.preferredName ?? ''} onChange={(v) => set('preferredName', v)} />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth ?? ''} onChange={(v) => set('dateOfBirth', v)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender ?? ''} onChange={(v) => set('gender', v)}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </div>
              <div>
                <Label required>Nationality</Label>
                <Input value={form.nationality} onChange={(v) => set('nationality', v)} placeholder="e.g. Senegalese" required />
              </div>
              <div>
                <Label>Dual Nationality</Label>
                <Input value={form.dualNationality ?? ''} onChange={(v) => set('dualNationality', v)} />
              </div>
              <div>
                <Label>Country of Birth</Label>
                <Input value={form.countryOfBirth ?? ''} onChange={(v) => set('countryOfBirth', v)} />
              </div>
              <div>
                <Label>City of Birth</Label>
                <Input value={form.cityOfBirth ?? ''} onChange={(v) => set('cityOfBirth', v)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Contact & Residence</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={(v) => set('email', v)} placeholder={user.email} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={form.phonePrimary ?? ''} onChange={(v) => set('phonePrimary', v)} placeholder="+1 234 567 8900" />
              </div>
              <div>
                <Label required>Country of Residence</Label>
                <Input value={form.countryOfResidence} onChange={(v) => set('countryOfResidence', v)} placeholder="e.g. France" required />
              </div>
              <div>
                <Label required>City of Residence</Label>
                <Input value={form.cityOfResidence} onChange={(v) => set('cityOfResidence', v)} placeholder="e.g. Paris" required />
              </div>
              <div>
                <Label>Years Abroad</Label>
                <Input type="number" value={String(form.yearsAbroad ?? '')} onChange={(v) => set('yearsAbroad', v ? Number(v) : undefined)} placeholder="e.g. 5" />
              </div>
              <div>
                <Label>Year of Arrival</Label>
                <Input type="number" value={String(form.entryYear ?? '')} onChange={(v) => set('entryYear', v ? Number(v) : undefined)} placeholder="e.g. 2018" />
              </div>
              <div className="col-span-2">
                <Label>Preferred Language</Label>
                <Select value={form.preferredLanguage ?? 'en'} onChange={(v) => set('preferredLanguage', v)}>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                  <option value="pt">Portuguese</option>
                  <option value="sw">Swahili</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Professional */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Professional Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Occupation</Label>
                <Input value={form.occupation ?? ''} onChange={(v) => set('occupation', v)} />
              </div>
              <div>
                <Label>Employer</Label>
                <Input value={form.employer ?? ''} onChange={(v) => set('employer', v)} />
              </div>
              <div>
                <Label>Industry Sector</Label>
                <Select value={form.industrySector ?? ''} onChange={(v) => set('industrySector', v)}>
                  <option value="">Select…</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="energy">Energy</option>
                  <option value="government">Government</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label>Education Level</Label>
                <Select value={form.educationLevel ?? ''} onChange={(v) => set('educationLevel', v)}>
                  <option value="">Select…</option>
                  <option value="secondary">Secondary</option>
                  <option value="bachelor">Bachelor&apos;s</option>
                  <option value="master">Master&apos;s</option>
                  <option value="doctorate">Doctorate</option>
                  <option value="vocational">Vocational</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label>Field of Study</Label>
                <Input value={form.fieldOfStudy ?? ''} onChange={(v) => set('fieldOfStudy', v)} />
              </div>
              <div>
                <Label>Generation</Label>
                <Select value={form.generation ?? ''} onChange={(v) => set('generation', v)}>
                  <option value="">Select…</option>
                  <option value="first">First generation</option>
                  <option value="second">Second generation</option>
                  <option value="third">Third generation+</option>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Diaspora Association</Label>
                <Input value={form.diasporaAssociation ?? ''} onChange={(v) => set('diasporaAssociation', v)} placeholder="e.g. African Professionals Network" />
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.returnInterest}
                  onChange={(e) => set('returnInterest', e.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-sm text-surface/70">I am interested in returning to my home country</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.investmentInterest}
                  onChange={(e) => set('investmentInterest', e.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-sm text-surface/70">I am interested in investing in my home country</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Review & Submit</h2>
            <p className="text-sm text-surface/60">
              Please review your information before submitting.
            </p>

            <dl className="divide-y divide-white/5 rounded-lg border border-white/10 bg-navy px-4">
              <div className="py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">Personal</p>
                <ReviewRow label="Full Name" value={[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')} />
                <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
                <ReviewRow label="Nationality" value={form.nationality} />
                <ReviewRow label="Country of Birth" value={form.countryOfBirth} />
              </div>
              <div className="py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">Contact</p>
                <ReviewRow label="Email" value={form.email || user.email} />
                <ReviewRow label="Phone" value={form.phonePrimary} />
                <ReviewRow label="Country of Residence" value={form.countryOfResidence} />
                <ReviewRow label="City" value={form.cityOfResidence} />
                <ReviewRow label="Years Abroad" value={form.yearsAbroad} />
              </div>
              <div className="py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">Professional</p>
                <ReviewRow label="Occupation" value={form.occupation} />
                <ReviewRow label="Industry" value={form.industrySector} />
                <ReviewRow label="Education" value={form.educationLevel} />
                <ReviewRow label="Return Interest" value={form.returnInterest} />
                <ReviewRow label="Investment Interest" value={form.investmentInterest} />
              </div>
              <div className="py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">Consent</p>
                <ReviewRow label="Language" value={consentLang === 'en' ? 'English' : 'French'} />
                <ReviewRow label="Agreed" value={form.consentAgreed} />
              </div>
            </dl>

            {submitError && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}

            <p className="text-xs text-surface/40">
              By submitting, you confirm that all information provided is accurate and that you have
              read and agreed to the data consent statement.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-surface/60 transition-colors hover:text-surface/80 disabled:opacity-30"
        >
          Back
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Registration'}
          </button>
        )}
      </div>
    </div>
  );
}
