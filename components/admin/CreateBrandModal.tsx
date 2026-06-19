'use client';

import { X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { useToast } from '@/components/ui/Toast';
import {
  createCountryBrand,
  listBrandableCountriesAction,
} from '@/lib/services/branding/branding.actions';

interface BrandableCountry {
  code: string;
  nameEn: string;
  nameFr: string;
  currencyCode: string | null;
  region: string | null;
}

// Francophone-leaning African regions default to FR; otherwise EN.
function inferLanguage(region: string | null): string {
  if (region && /(West|Central) Africa/i.test(region)) return 'fr';
  return 'en';
}

export function CreateBrandModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [countries, setCountries] = useState<BrandableCountry[]>([]);
  const [code, setCode] = useState('');
  const [displayEn, setDisplayEn] = useState('');
  const [displayFr, setDisplayFr] = useState('');
  const [currency, setCurrency] = useState('');
  const [language, setLanguage] = useState('en');
  const [primary, setPrimary] = useState('#BF0A30');
  const [secondary, setSecondary] = useState('#002868');
  const [accent, setAccent] = useState('#C9A84C');

  useEffect(() => {
    listBrandableCountriesAction().then(setCountries);
  }, []);

  function onSelectCountry(value: string) {
    setCode(value);
    const c = countries.find((x) => x.code === value);
    if (c) {
      setDisplayEn(c.nameEn);
      setDisplayFr(c.nameFr);
      setCurrency(c.currencyCode ?? '');
      setLanguage(inferLanguage(c.region));
    }
  }

  function submit() {
    if (!code) {
      toast({ type: 'warning', title: 'Select a country' });
      return;
    }
    startTransition(async () => {
      const res = await createCountryBrand({
        countryCode: code,
        displayNameEn: displayEn,
        displayNameFr: displayFr,
        brandPrimary: primary,
        brandSecondary: secondary,
        brandAccent: accent,
        defaultLanguage: language,
        currencyCode: currency || undefined,
      });
      if (res.success) { toast({ type: 'success', title: 'Brand created', description: displayEn }); onCreated(); }
      else toast({ type: 'error', title: 'Could not create brand', description: res.error });
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-white/10 bg-navy-deep p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Create Country Brand</h3>
          <button type="button" onClick={onClose} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Country</span>
          <select value={code} onChange={(e) => onSelectCountry(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none">
            <option value="">— Select a country —</option>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.nameEn} ({c.code})</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Display Name (EN)" value={displayEn} onChange={setDisplayEn} />
          <Field label="Display Name (FR)" value={displayFr} onChange={setDisplayFr} />
          <Field label="Currency Code" value={currency} onChange={setCurrency} />
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Default Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:outline-none">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ColorField label="Primary" value={primary} onChange={setPrimary} />
          <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
          <ColorField label="Accent" value={accent} onChange={setAccent} />
        </div>

        <button type="button" disabled={isPending} onClick={submit} className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">
          {isPending ? 'Creating…' : 'Create Brand'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none" />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 shrink-0 rounded border border-white/10 bg-navy" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-navy px-2 py-2 text-xs text-white focus:outline-none" />
      </div>
    </label>
  );
}
