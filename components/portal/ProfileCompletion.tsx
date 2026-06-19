'use client';

import { CheckCircle2, Circle, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { AutocompleteWithCapture } from '@/components/ui/AutocompleteWithCapture';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { CivisLoader } from '@/components/ui/CivisLoader';
import { useToast } from '@/components/ui/Toast';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { ProfilePhotoUpload } from '@/components/portal/ProfilePhotoUpload';
import type { Registrant } from '@/lib/services/registrants';
import { uploadRegistrantDocument } from '@/lib/services/documents/document.actions';
import {
  completeProfileSectionAction,
  submitForVerificationAction,
} from '@/app/[locale]/portal/profile/complete/actions';
import { cn } from '@/lib/utils';

type Section = 'personal' | 'residence' | 'professional' | 'documents';

const EDUCATION_LEVELS = [
  'No formal education',
  'Primary school',
  'Secondary school / High school',
  'Technical / Vocational training',
  'Some college / University (no degree)',
  'Associate degree / Diploma',
  "Bachelor's degree",
  "Master's degree",
  'Doctorate / PhD',
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const GENERATIONS = ['First', 'Second', 'Third', 'Returnee'];
const DOC_TYPES = ['passport', 'national_id', 'birth_certificate', 'proof_of_residence', 'visa'];

const YEARS = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);

const inputClass =
  'h-11 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none';

export function ProfileCompletion({
  locale,
  registrant,
  initialPhotoUrl,
}: {
  locale: 'en' | 'fr';
  registrant: Registrant;
  initialPhotoUrl: string | null;
}) {
  const t = useTranslations('registration.phase2');
  const router = useRouter();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>('personal');
  const [completeness, setCompleteness] = useState(registrant.profileCompletenessScore);
  const [status, setStatus] = useState(registrant.registrationStatus);
  const [isPending, startTransition] = useTransition();
  const [sectionMsg, setSectionMsg] = useState<string | null>(null);

  // Form state seeded from the existing record
  const [form, setForm] = useState({
    dateOfBirth: registrant.dateOfBirth ?? '',
    gender: registrant.gender ?? '',
    middleName: registrant.middleName ?? '',
    preferredName: registrant.preferredName ?? '',
    nationality: registrant.nationality ?? '',
    nationalityCode: '',
    hasDual: !!registrant.dualNationality,
    secondNationality: registrant.dualNationality ?? '',
    countryOfBirth: registrant.countryOfBirth ?? '',
    countryOfBirthCode: '',
    cityOfBirth: registrant.cityOfBirth ?? '',
    phoneSecondary: registrant.phoneSecondary ?? '',
    countryOfResidence: registrant.countryOfResidence ?? '',
    countryOfResidenceCode: '',
    cityOfResidence: registrant.cityOfResidence ?? '',
    departureYear: '',
    entryYear: registrant.entryYear ? String(registrant.entryYear) : '',
    occupation: registrant.occupation ?? '',
    employer: registrant.employer ?? '',
    industrySector: registrant.industrySector ?? '',
    educationLevel: registrant.educationLevel ?? '',
    fieldOfStudy: registrant.fieldOfStudy ?? '',
    generation: registrant.generation ?? '',
    hasAssociation: !!registrant.diasporaAssociation,
    diasporaAssociation: registrant.diasporaAssociation ?? '',
    returnInterest: registrant.returnInterest,
    investmentInterest: registrant.investmentInterest,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Required for submission — enable when ALL required fields are present (B9).
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!registrant.firstName) missing.push('First Name');
    if (!registrant.lastName) missing.push('Last Name');
    if (!registrant.email) missing.push('Email');
    if (!registrant.phonePrimary) missing.push('Phone');
    if (!form.dateOfBirth) missing.push('Date of Birth');
    if (!form.gender) missing.push('Gender');
    if (!form.nationality) missing.push('Nationality');
    if (!form.countryOfBirth) missing.push('Country of Birth');
    if (!form.countryOfResidence) missing.push('Country of Residence');
    if (!form.cityOfResidence) missing.push('City of Residence');
    return missing;
  }, [form, registrant]);
  const requiredComplete = missingFields.length === 0;

  // Per-section completion status for the step indicators (D16).
  function sectionStatus(s: Section): 'complete' | 'in_progress' | 'not_started' {
    if (s === 'personal') {
      const filled = [form.dateOfBirth, form.gender, form.nationality, form.countryOfBirth, form.cityOfBirth].filter(Boolean).length;
      return filled === 5 ? 'complete' : filled > 0 ? 'in_progress' : 'not_started';
    }
    if (s === 'residence') {
      const filled = [form.countryOfResidence, form.cityOfResidence].filter(Boolean).length;
      return filled === 2 ? 'complete' : filled > 0 ? 'in_progress' : 'not_started';
    }
    if (s === 'professional') {
      const filled = [form.occupation, form.educationLevel, form.industrySector].filter(Boolean).length;
      return filled >= 2 ? 'complete' : filled > 0 ? 'in_progress' : 'not_started';
    }
    return initialPhotoUrl ? 'complete' : 'not_started';
  }

  const NEXT_SECTION: Record<Section, Section | null> = {
    personal: 'residence',
    residence: 'professional',
    professional: 'documents',
    documents: null,
  };

  function saveSection(s: Section) {
    setSectionMsg(null);
    const payload: Record<string, unknown> =
      s === 'personal'
        ? {
            dateOfBirth: form.dateOfBirth || undefined,
            gender: form.gender || undefined,
            middleName: form.middleName || undefined,
            preferredName: form.preferredName || undefined,
            nationality: form.nationality || undefined,
            secondNationality: form.hasDual ? form.secondNationality || undefined : undefined,
            countryOfBirth: form.countryOfBirth || undefined,
            cityOfBirth: form.cityOfBirth || undefined,
          }
        : s === 'residence'
        ? {
            phoneSecondary: form.phoneSecondary || undefined,
            countryOfResidence: form.countryOfResidence || undefined,
            cityOfResidence: form.cityOfResidence || undefined,
            departureYear: form.departureYear ? Number(form.departureYear) : undefined,
            entryYear: form.entryYear ? Number(form.entryYear) : undefined,
          }
        : s === 'professional'
        ? {
            occupation: form.occupation || undefined,
            employer: form.employer || undefined,
            industrySector: form.industrySector || undefined,
            educationLevel: form.educationLevel || undefined,
            fieldOfStudy: form.fieldOfStudy || undefined,
            generation: form.generation || undefined,
            diasporaAssociation: form.hasAssociation ? form.diasporaAssociation || undefined : undefined,
            returnInterest: form.returnInterest,
            investmentInterest: form.investmentInterest,
          }
        : {};

    startTransition(async () => {
      const res = await completeProfileSectionAction(s, payload);
      if (res.error) {
        setSectionMsg(res.error);
        toast({ type: 'error', title: 'Could not save', description: res.error });
      } else {
        setCompleteness(res.newCompletenessScore);
        if (res.status) setStatus(res.status as typeof status);
        setSectionMsg(t('section_saved'));
        const next = NEXT_SECTION[s];
        const nextLabel = next ? SECTIONS.find((x) => x.key === next)?.label : null;
        toast({
          type: 'success',
          title: `${SECTIONS.find((x) => x.key === s)?.label ?? 'Section'} saved`,
          description: nextLabel ? `Continue to ${nextLabel} →` : undefined,
        });
        if (next) setSection(next);
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitForVerificationAction();
      if (res.success) {
        setStatus('submitted');
        router.push(`/${locale}/portal/dashboard`);
        router.refresh();
      } else {
        setSectionMsg(res.error ?? 'Submission failed.');
      }
    });
  }

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'personal', label: t('section_personal') },
    { key: 'residence', label: t('section_residence') },
    { key: 'professional', label: t('section_professional') },
    { key: 'documents', label: t('section_documents') },
  ];

  const dash = 2 * Math.PI * 42;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero progress */}
      <div className="flex items-center gap-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.08] to-transparent p-6">
        <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - completeness / 100)}
            className="transition-all duration-500"
          />
          <text x="50" y="50" dy="0.35em" textAnchor="middle" className="rotate-90" fill="#fff" fontSize="22" fontWeight="700" transform="rotate(90 50 50)">
            {completeness}%
          </text>
        </svg>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('welcome_title', { percent: completeness })}</h1>
          <p className="mt-1 text-sm text-surface/60">{t('welcome_subtitle')}</p>
        </div>
      </div>

      {/* Section steps — horizontal row on desktop, with status indicators (D16) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s) => {
          const st = sectionStatus(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                section === s.key ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-surface/60 hover:text-white',
              )}
            >
              {st === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : st === 'in_progress' ? (
                <Circle className="h-4 w-4 shrink-0 fill-gold/30 text-gold" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-surface/30" />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/5 bg-navy-deep p-6">
        {/* PERSONAL */}
        {section === 'personal' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('fields.dob_label')} helper={t('fields.dob_helper')} required>
                <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('fields.gender_label')} helper={t('fields.gender_helper')} required>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Middle Name" helper="If you have one, as shown on your passport.">
                <input value={form.middleName} onChange={(e) => set('middleName', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Preferred Name" helper="What you'd like to be called in correspondence.">
                <input value={form.preferredName} onChange={(e) => set('preferredName', e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label={t('fields.nationality_label')} helper={t('fields.nationality_helper')} required>
              <CountrySelector locale={locale} value={form.nationalityCode || undefined} onChange={(code, c) => { set('nationalityCode', code); set('nationality', c.nameEn); }} placeholder={form.nationality || 'Select a country'} />
            </Field>
            <Field label={t('fields.dual_nationality_toggle')} helper={t('fields.dual_nationality_helper')} required>
              <Toggle value={form.hasDual} onChange={(v) => set('hasDual', v)} />
            </Field>
            {form.hasDual && (
              <Field label={t('fields.second_nationality_label')} helper={t('fields.second_nationality_helper')} required>
                <CountrySelector locale={locale} onChange={(_, c) => set('secondNationality', c.nameEn)} placeholder={form.secondNationality || 'Select a country'} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('fields.country_of_birth_label')} helper={t('fields.country_of_birth_helper')} required>
                <CountrySelector locale={locale} value={form.countryOfBirthCode || undefined} onChange={(code, c) => { set('countryOfBirthCode', code); set('countryOfBirth', c.nameEn); }} placeholder={form.countryOfBirth || 'Select a country'} />
              </Field>
              <Field label={t('fields.city_of_birth_label')} helper={t('fields.city_of_birth_helper')} required>
                <CityAutocomplete countryCode={form.countryOfBirthCode || undefined} value={form.cityOfBirth} onChange={(c) => set('cityOfBirth', c.name)} />
              </Field>
            </div>
            <SaveBar onSave={() => saveSection('personal')} pending={isPending} msg={sectionMsg} label={t('save_section')} />
          </div>
        )}

        {/* RESIDENCE */}
        {section === 'residence' && (
          <div className="space-y-5">
            <Field label="Phone (Secondary)" helper="Optional. An alternative way to reach you.">
              <PhoneInput defaultCountry={form.countryOfResidenceCode || 'US'} locale={locale} helperText="" onChange={(e164) => set('phoneSecondary', e164)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('fields.country_of_residence_label')} helper={t('fields.country_of_residence_helper')} required>
                <CountrySelector locale={locale} value={form.countryOfResidenceCode || undefined} onChange={(code, c) => { set('countryOfResidenceCode', code); set('countryOfResidence', c.nameEn); }} placeholder={form.countryOfResidence || 'Select a country'} />
              </Field>
              <Field label={t('fields.city_of_residence_label')} helper={t('fields.city_of_residence_helper')} required>
                <CityAutocomplete countryCode={form.countryOfResidenceCode || undefined} value={form.cityOfResidence} onChange={(c) => set('cityOfResidence', c.name)} />
              </Field>
              <Field label={t('fields.year_left_home_label', { home_country: registrant.nationality || 'home' })} helper={t('fields.year_left_home_helper')}>
                <select value={form.departureYear} onChange={(e) => set('departureYear', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label={t('fields.year_arrived_label', { current_country: form.countryOfResidence || 'current country' })} helper={t('fields.year_arrived_helper')}>
                <select value={form.entryYear} onChange={(e) => set('entryYear', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
            </div>
            <SaveBar onSave={() => saveSection('residence')} pending={isPending} msg={sectionMsg} label={t('save_section')} />
          </div>
        )}

        {/* PROFESSIONAL */}
        {section === 'professional' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('fields.occupation_label')} helper={t('fields.occupation_helper')}>
                <AutocompleteWithCapture category="occupation" locale={locale} value={form.occupation} placeholder="Start typing…" onChange={(s) => set('occupation', s.value)} />
              </Field>
              <Field label="Employer / Organization" helper="The name of your employer or organization (if employed).">
                <input value={form.employer} onChange={(e) => set('employer', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('fields.industry_label')} helper={t('fields.industry_helper')}>
                <AutocompleteWithCapture category="industry" locale={locale} value={form.industrySector} placeholder="Start typing…" onChange={(s) => set('industrySector', s.value)} />
              </Field>
              <Field label={t('fields.education_label')} helper={t('fields.education_helper')}>
                <select value={form.educationLevel} onChange={(e) => set('educationLevel', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label={t('fields.field_of_study_label')} helper={t('fields.field_of_study_helper')}>
                <AutocompleteWithCapture category="field_of_study" locale={locale} value={form.fieldOfStudy} placeholder="Start typing…" onChange={(s) => set('fieldOfStudy', s.value)} />
              </Field>
              <Field label={t('fields.generation_label')} helper={t('fields.generation_helper')}>
                <select value={form.generation} onChange={(e) => set('generation', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {GENERATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
            </div>
            <Field label={t('fields.association_toggle')} helper={t('fields.association_helper')}>
              <Toggle value={form.hasAssociation} onChange={(v) => set('hasAssociation', v)} />
            </Field>
            {form.hasAssociation && (
              <Field label={t('fields.association_name_label')} helper="">
                <AutocompleteWithCapture category="diaspora_association" locale={locale} value={form.diasporaAssociation} placeholder="Start typing…" onChange={(s) => set('diasporaAssociation', s.value)} />
              </Field>
            )}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={form.returnInterest} onChange={(e) => set('returnInterest', e.target.checked)} className="h-4 w-4 accent-gold" />
                <span className="text-sm text-surface/70">{t('fields.return_interest_label', { home_country: registrant.nationality || 'your home country' })}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={form.investmentInterest} onChange={(e) => set('investmentInterest', e.target.checked)} className="h-4 w-4 accent-gold" />
                <span className="text-sm text-surface/70">{t('fields.investment_interest_label', { home_country: registrant.nationality || 'your home country' })}</span>
              </label>
            </div>
            <SaveBar onSave={() => saveSection('professional')} pending={isPending} msg={sectionMsg} label={t('save_section')} />
          </div>
        )}

        {/* DOCUMENTS */}
        {section === 'documents' && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-white">{t('fields.profile_photo_label')}</p>
              <ProfilePhotoUpload initialUrl={initialPhotoUrl ?? undefined} helper={t('fields.profile_photo_helper')} />
            </div>
            <div className="border-t border-white/5 pt-5">
              <p className="text-sm font-medium text-white">{t('fields.documents_label')}</p>
              <p className="mt-1 text-xs text-surface/40">{t('fields.documents_helper')}</p>
              <DocumentUpload />
            </div>
          </div>
        )}
      </div>

      {/* Submit for verification */}
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-navy-deep p-5">
        <div>
          <p className="text-sm font-semibold text-white">{t('submit_for_verification')}</p>
          <p className="mt-1 text-xs text-surface/40">Complete all required fields to submit for verification. Optional fields improve your profile score.</p>
          {!requiredComplete && (
            <p className="mt-1 text-xs text-amber-400">Complete these fields to submit: {missingFields.join(', ')}</p>
          )}
          {status === 'submitted' && <p className="mt-1 text-xs text-emerald-400">{t('already_submitted')}</p>}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !requiredComplete || status === 'submitted'}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? <CivisLoader size="sm" /> : t('submit_for_verification')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, helper, required, children }: { label: string; helper: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white">
        {label}
        {required && <span className="ml-1 text-gold">*</span>}
      </label>
      {helper && <p className="mb-1.5 text-xs text-surface/40">{helper}</p>}
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm transition-colors',
            value === v ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-surface/60 hover:text-white',
          )}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

function SaveBar({ onSave, pending, msg, label }: { onSave: () => void; pending: boolean; msg: string | null; label: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-white/5 pt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? <CivisLoader size="sm" /> : label}
      </button>
      {msg && <span className="text-xs text-surface/50">{msg}</span>}
    </div>
  );
}

function DocumentUpload() {
  const [docType, setDocType] = useState('passport');
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    const fd = new FormData();
    fd.set('documentType', docType);
    fd.set('file', file);
    startTransition(async () => {
      const { error } = await uploadRegistrantDocument(fd);
      setMsg(error ?? `Uploaded ${file.name}`);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <select value={docType} onChange={(e) => setDocType(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-navy px-3 text-sm text-surface/80 focus:border-gold/40 focus:outline-none">
        {DOC_TYPES.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
      </select>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/70 transition-colors hover:border-gold/30 hover:text-gold">
        <Upload className="h-4 w-4" />
        {isPending ? 'Uploading…' : 'Choose file'}
        <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {msg && <span className="text-xs text-surface/50">{msg}</span>}
    </div>
  );
}
