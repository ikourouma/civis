'use client';

import { Eye, Plus, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { Link } from '@/i18n/navigation';
import { generateSurfaceScale } from '@/lib/branding/colors';
import type { CountryBrand } from '@/lib/services/branding/branding.service';
import { updateBrand, uploadBrandAsset, type BrandUpdateInput } from '@/lib/services/branding/branding.actions';
import { cn } from '@/lib/utils';

const SOURCE_BADGE: Record<string, string> = {
  bridge55: 'bg-blue-400/15 text-blue-300',
  liberia_asset: 'bg-gold/15 text-gold',
  manual: 'bg-white/5 text-surface/60',
};

interface Props {
  locale: 'en' | 'fr';
  brands: CountryBrand[];
}

interface EditState {
  displayNameEn: string;
  displayNameFr: string;
  officialNameEn: string;
  officialNameFr: string;
  mottoEn: string;
  mottoFr: string;
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;
  defaultLanguage: string;
  currencyCode: string;
  timeZone: string;
}

function toEditState(b: CountryBrand): EditState {
  return {
    displayNameEn: b.displayName.en,
    displayNameFr: b.displayName.fr,
    officialNameEn: b.officialName.en ?? '',
    officialNameFr: b.officialName.fr ?? '',
    mottoEn: b.motto?.en ?? '',
    mottoFr: b.motto?.fr ?? '',
    brandPrimary: b.palette.primary,
    brandSecondary: b.palette.secondary,
    brandAccent: b.palette.accent ?? '#FFFFFF',
    defaultLanguage: b.locale.defaultLanguage,
    currencyCode: b.locale.currencyCode ?? '',
    timeZone: b.locale.timeZone ?? '',
  };
}

export function BrandingPanel({ locale, brands }: Props) {
  const t = useTranslations('branding.admin');
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(brands[0]?.countryCode ?? '');
  const selected = brands.find((b) => b.countryCode === selectedCode) ?? brands[0];

  const [form, setForm] = useState<EditState>(selected ? toEditState(selected) : ({} as EditState));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const flagInput = useRef<HTMLInputElement>(null);
  const sealInput = useRef<HTMLInputElement>(null);

  // Reload form when the selected brand changes.
  useEffect(() => {
    if (selected) {
      setForm(toEditState(selected));
      setMessage(null);
    }
  }, [selectedCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live-preview palette on :root as the admin edits colors.
  const surface = useMemo(() => generateSurfaceScale(form.brandPrimary || '#2A3F62'), [form.brandPrimary]);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--civis-brand-primary', form.brandPrimary);
    root.style.setProperty('--civis-brand-secondary', form.brandSecondary);
    root.style.setProperty('--civis-brand-accent', form.brandAccent);
    root.style.setProperty('--civis-surface-50', surface.surface_primary_50);
    root.style.setProperty('--civis-surface-100', surface.surface_primary_100);
    root.style.setProperty('--civis-surface-500', surface.surface_primary_500);
    root.style.setProperty('--civis-surface-700', surface.surface_primary_700);
    root.style.setProperty('--civis-surface-900', surface.surface_primary_900);
  }, [form.brandPrimary, form.brandSecondary, form.brandAccent, surface]);

  function set<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!selected) return;
    setMessage(null);
    const updates: BrandUpdateInput = {
      displayNameEn: form.displayNameEn,
      displayNameFr: form.displayNameFr,
      officialNameEn: form.officialNameEn,
      officialNameFr: form.officialNameFr,
      mottoEn: form.mottoEn,
      mottoFr: form.mottoFr,
      brandPrimary: form.brandPrimary,
      brandSecondary: form.brandSecondary,
      brandAccent: form.brandAccent,
      defaultLanguage: form.defaultLanguage,
      currencyCode: form.currencyCode,
      timeZone: form.timeZone,
    };
    startTransition(async () => {
      const { success, error } = await updateBrand(selected.countryCode, updates);
      if (success) {
        setMessage({ kind: 'ok', text: t('saved') });
        router.refresh();
      } else {
        setMessage({ kind: 'err', text: error ?? 'Save failed' });
      }
    });
  }

  function handleUpload(assetType: 'flag' | 'seal', file: File | undefined) {
    if (!selected || !file) return;
    setMessage(null);
    const fd = new FormData();
    fd.set('countryCode', selected.countryCode);
    fd.set('assetType', assetType);
    fd.set('file', file);
    startTransition(async () => {
      const { error } = await uploadBrandAsset(fd);
      if (error) setMessage({ kind: 'err', text: error });
      else {
        setMessage({ kind: 'ok', text: t('uploaded') });
        router.refresh();
      }
    });
  }

  if (!selected) {
    return <p className="text-sm text-surface/50">No brands found. Run the branding seed script.</p>;
  }

  return (
    <div className="flex gap-6">
      {/* Country list */}
      <aside className="w-64 shrink-0">
        <ul className="space-y-1">
          {brands.map((b) => (
            <li key={b.countryCode}>
              <button
                type="button"
                onClick={() => setSelectedCode(b.countryCode)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  b.countryCode === selectedCode
                    ? 'border-gold/40 bg-gold/5'
                    : 'border-white/5 bg-navy-deep hover:border-white/10',
                )}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full border border-white/10"
                  style={{ backgroundColor: b.palette.primary }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">
                    {b.displayName[locale] ?? b.displayName.en}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-surface/40">
                    {b.countryCode}
                  </span>
                </span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                    SOURCE_BADGE[b.brandSource] ?? 'bg-white/5 text-surface/50',
                  )}
                >
                  {b.brandSource === 'liberia_asset' ? 'asset' : b.brandSource}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled
          title="Add a country brand via the seed script or a future release"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2.5 text-xs text-surface/40"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('add_country')}
        </button>
      </aside>

      {/* Detail */}
      <div className="min-w-0 flex-1 space-y-6">
        {message && (
          <div
            className={cn(
              'rounded-lg border px-4 py-3 text-sm',
              message.kind === 'ok'
                ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-400'
                : 'border-red-400/20 bg-red-400/5 text-red-400',
            )}
          >
            {message.text}
          </div>
        )}

        {/* Identity */}
        <Section title={t('section_identity')}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display Name (EN)" value={form.displayNameEn} onChange={(v) => set('displayNameEn', v)} />
            <Field label="Display Name (FR)" value={form.displayNameFr} onChange={(v) => set('displayNameFr', v)} />
            <Field label="Official Name (EN)" value={form.officialNameEn} onChange={(v) => set('officialNameEn', v)} />
            <Field label="Official Name (FR)" value={form.officialNameFr} onChange={(v) => set('officialNameFr', v)} />
            <Field label="Motto (EN)" value={form.mottoEn} onChange={(v) => set('mottoEn', v)} />
            <Field label="Motto (FR)" value={form.mottoFr} onChange={(v) => set('mottoFr', v)} />
          </div>
        </Section>

        {/* Palette */}
        <Section title={t('section_palette')}>
          <div className="grid grid-cols-3 gap-4">
            <ColorField label="Primary" value={form.brandPrimary} onChange={(v) => set('brandPrimary', v)} />
            <ColorField label="Secondary" value={form.brandSecondary} onChange={(v) => set('brandSecondary', v)} />
            <ColorField label="Accent" value={form.brandAccent} onChange={(v) => set('brandAccent', v)} />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
              Surface variants (auto-generated)
            </p>
            <div className="flex gap-2">
              {Object.entries(surface).map(([k, v]) => (
                <div key={k} className="flex-1">
                  <div className="h-10 rounded border border-white/10" style={{ backgroundColor: v }} />
                  <p className="mt-1 text-center text-[9px] text-surface/40">{k.replace('surface_primary_', '')}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Assets */}
        <Section title={t('section_assets')}>
          <div className="grid grid-cols-2 gap-4">
            <AssetSlot
              label="Flag"
              url={selected.assets.flagUrl}
              uploadLabel={t('upload_flag')}
              onPick={() => flagInput.current?.click()}
            />
            <AssetSlot
              label="Seal / Coat of Arms"
              url={selected.assets.sealUrl}
              uploadLabel={t('upload_seal')}
              onPick={() => sealInput.current?.click()}
            />
          </div>
          <input
            ref={flagInput}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleUpload('flag', e.target.files?.[0])}
          />
          <input
            ref={sealInput}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleUpload('seal', e.target.files?.[0])}
          />
        </Section>

        {/* Localization */}
        <Section title={t('section_localization')}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel>Default Language</FieldLabel>
              <select
                value={form.defaultLanguage}
                onChange={(e) => set('defaultLanguage', e.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-surface/80 focus:border-gold/40 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </div>
            <Field label="Currency" value={form.currencyCode} onChange={(v) => set('currencyCode', v)} />
            <Field label="Time Zone" value={form.timeZone} onChange={(v) => set('timeZone', v)} />
          </div>
          <p className="mt-3 text-xs text-surface/40">
            Supported languages: {selected.locale.supportedLanguages.join(', ')}
          </p>
        </Section>

        {/* Source */}
        <Section title={t('section_source')}>
          <div className="flex gap-8 text-sm">
            <div>
              <FieldLabel>Brand Source</FieldLabel>
              <p className="text-surface/80">{selected.brandSource}</p>
            </div>
            <div>
              <FieldLabel>Version</FieldLabel>
              <p className="text-surface/80">{selected.brandVersion}</p>
            </div>
          </div>
        </Section>

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-white/5 pt-5">
          <Link
            href={`/admin/branding/preview/${selected.countryCode}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/70 transition-colors hover:border-gold/30 hover:text-gold"
          >
            <Eye className="h-4 w-4" />
            {t('preview_as_tenant')}
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? '…' : t('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/5 bg-navy-deep p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">{children}</p>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-white/10 bg-navy"
          aria-label={`${label} color picker`}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-full rounded-lg border border-white/10 bg-navy px-3 font-mono text-xs text-white focus:border-gold/40 focus:outline-none"
        />
      </div>
    </div>
  );
}

function AssetSlot({
  label,
  url,
  uploadLabel,
  onPick,
}: {
  label: string;
  url?: string;
  uploadLabel: string;
  onPick: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-navy p-4">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex h-24 items-center justify-center rounded border border-white/5 bg-white/[0.02]">
        {url ? (
          <img src={url} alt={label} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-surface/30">No asset</span>
        )}
      </div>
      <button
        type="button"
        onClick={onPick}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-surface/70 transition-colors hover:border-gold/30 hover:text-gold"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploadLabel}
      </button>
    </div>
  );
}
