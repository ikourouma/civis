'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import {
  createTenantWithAdminAction,
  getCountryDefaultsAction,
  listAssignableUsersAction,
  listBrandsForSelectAction,
} from '@/app/[locale]/admin/dashboard/actions';
import { cn } from '@/lib/utils';

type Brand = { id: string; countryCode: string; displayName: string; flag: string };
type AssignableUser = { id: string; email: string; fullName: string | null };

export function CreateTenantModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Workspace.admin.create');
  const tc = useTranslations('tenant_create');
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [adminMode, setAdminMode] = React.useState<'provision_new' | 'assign_existing'>('provision_new');
  const [countryCode, setCountryCode] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [officialName, setOfficialName] = React.useState('');
  const [dataResidency, setDataResidency] = React.useState('');
  const [brandId, setBrandId] = React.useState('');
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [users, setUsers] = React.useState<AssignableUser[]>([]);

  React.useEffect(() => {
    listBrandsForSelectAction().then(setBrands);
    listAssignableUsersAction().then(setUsers);
  }, []);

  // Auto-suggest a brand whose country code matches the entered code.
  React.useEffect(() => {
    if (!countryCode || brands.length === 0) return;
    const match = brands.find((b) => b.countryCode.toUpperCase() === countryCode.toUpperCase());
    if (match) setBrandId(match.id);
  }, [countryCode, brands]);

  // Auto-fill country fields from civis_countries when a 2-letter code is entered (D11).
  React.useEffect(() => {
    if (countryCode.length !== 2) return;
    let active = true;
    getCountryDefaultsAction(countryCode).then((d) => {
      if (!active || !d) return;
      if (d.officialName) setOfficialName(d.officialName);
      if (d.region) setRegion(d.region);
      if (d.dataResidencyRegion) setDataResidency(d.dataResidencyRegion);
    });
    return () => { active = false; };
  }, [countryCode]);

  const matchedBrand = brands.find((b) => b.id === brandId);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    formData.set('adminMode', adminMode);
    formData.set('brandingId', brandId);
    const result = await createTenantWithAdminAction(formData);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/20 bg-navy-deepest p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{t('title')}</h2>
            <p className="mt-1 text-xs text-surface/60">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-surface/60 hover:bg-white/[0.04] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-5">
          {/* Tenant details */}
          <div className="space-y-4">
            <Field name="name" label={t('name')} placeholder="Republic of Senegal" required />
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="countryCode"
                label={t('countryCode')}
                placeholder="SN"
                maxLength={2}
                required
                value={countryCode}
                onChange={setCountryCode}
              />
              <Field name="region" label={t('region')} placeholder="West Africa" value={region} onChange={setRegion} />
            </div>
            <Field name="officialCountryName" label={t('officialCountryName')} placeholder="République du Sénégal" value={officialName} onChange={setOfficialName} />
            <div className="grid grid-cols-2 gap-3">
              <Select
                name="deploymentTier"
                label={t('deploymentTier')}
                options={[['cloud', 'Cloud'], ['government', 'Government'], ['sovereign', 'Sovereign']]}
              />
              <Select
                name="defaultLanguage"
                label={t('defaultLanguage')}
                options={[['en', 'English'], ['fr', 'Français']]}
              />
            </div>
            <Field name="dataResidencyRegion" label={t('dataResidencyRegion')} placeholder="af-south-1" required value={dataResidency} onChange={setDataResidency} />
            <Field name="primaryContactEmail" type="email" label={t('primaryContactEmail')} placeholder="contact@gov.sn" />
          </div>

          {/* Initial Tenant Administrator */}
          <div className="rounded-xl border border-white/5 bg-navy-deep p-4">
            <p className="mb-3 text-sm font-semibold text-white">{tc('section_admin')}</p>
            <div className="mb-4 flex gap-2">
              {(['provision_new', 'assign_existing'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAdminMode(mode)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    adminMode === mode
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-white/10 text-surface/60 hover:text-white',
                  )}
                >
                  {mode === 'provision_new' ? tc('provision_new') : tc('assign_existing')}
                </button>
              ))}
            </div>

            {adminMode === 'provision_new' ? (
              <div className="space-y-4">
                <Field name="adminEmail" type="email" label="Tenant Admin Email" placeholder="admin@gov.sn" required helper={tc('admin_email_helper')} />
                <Field name="adminFullName" label="Tenant Admin Full Name" placeholder="Aminata Diallo" required helper={tc('admin_name_helper')} />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-surface/70">
                  <input type="checkbox" name="sendWelcomeEmail" defaultChecked className="h-4 w-4 accent-gold" />
                  Send welcome email with sign-in instructions
                </label>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface/60">Select existing user</label>
                <select
                  name="existingUserId"
                  className="w-full rounded-lg border border-white/10 bg-navy-panel px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
                >
                  <option value="">—</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-navy-deepest">
                      {u.fullName ? `${u.fullName} (${u.email})` : u.email}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-surface/40">{tc('admin_email_helper')}</p>
              </div>
            )}
          </div>

          {/* Country Branding */}
          <div className="rounded-xl border border-white/5 bg-navy-deep p-4">
            <p className="mb-3 text-sm font-semibold text-white">{tc('branding_section')}</p>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-navy-panel px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
            >
              <option value="">— {tc('branding_helper')} —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id} className="bg-navy-deepest">
                  {b.displayName} ({b.countryCode})
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px]">
              {matchedBrand ? (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <Check className="h-3 w-3" /> {tc('branding_found')}: {matchedBrand.displayName}
                </span>
              ) : (
                <span className="text-amber-400/80">⚠ {tc('branding_not_found')}</span>
              )}
            </p>
          </div>

          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-surface/70 transition-colors hover:bg-white/[0.04]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t('submitting') : tc('submit_with_admin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  placeholder,
  maxLength,
  helper,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  helper?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-surface/60">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        {...(onChange ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
        className="w-full rounded-lg border border-white/10 bg-navy-panel px-3 py-2 text-sm text-white outline-none placeholder:text-surface/30 focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
      />
      {helper && <p className="mt-1 text-[11px] text-surface/40">{helper}</p>}
    </div>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-surface/60">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="w-full rounded-lg border border-white/10 bg-navy-panel px-3 py-2 text-sm text-white outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
      >
        {options.map(([value, lbl]) => (
          <option key={value} value={value} className="bg-navy-deepest">
            {lbl}
          </option>
        ))}
      </select>
    </div>
  );
}
