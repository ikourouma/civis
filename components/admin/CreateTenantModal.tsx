'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { createTenantAction } from '@/app/[locale]/admin/dashboard/actions';

export function CreateTenantModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Workspace.admin.create');
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await createTenantAction(formData);
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
        className="w-full max-w-lg rounded-2xl border border-gold/20 bg-navy-deepest p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
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

        <form action={handleSubmit} className="space-y-4">
          <Field name="name" label={t('name')} placeholder="Republic of Senegal" required />
          <div className="grid grid-cols-2 gap-3">
            <Field name="countryCode" label={t('countryCode')} placeholder="SN" maxLength={2} required />
            <Field name="region" label={t('region')} placeholder="West Africa" />
          </div>
          <Field name="officialCountryName" label={t('officialCountryName')} placeholder="République du Sénégal" />
          <div className="grid grid-cols-2 gap-3">
            <Select
              name="deploymentTier"
              label={t('deploymentTier')}
              options={[
                ['cloud', 'Cloud'],
                ['government', 'Government'],
                ['sovereign', 'Sovereign'],
              ]}
            />
            <Select
              name="defaultLanguage"
              label={t('defaultLanguage')}
              options={[
                ['en', 'English'],
                ['fr', 'Français'],
              ]}
            />
          </div>
          <Field name="dataResidencyRegion" label={t('dataResidencyRegion')} placeholder="af-south-1" required />
          <Field name="primaryContactEmail" type="email" label={t('primaryContactEmail')} placeholder="contact@gov.sn" />

          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
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
              {submitting ? t('submitting') : t('submit')}
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
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
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
        className="w-full rounded-lg border border-white/10 bg-navy-panel px-3 py-2 text-sm text-white outline-none placeholder:text-surface/30 focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
      />
    </div>
  );
}

function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: [string, string][];
}) {
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
