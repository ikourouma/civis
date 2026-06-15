'use client';

import { Building2, Plus, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Link } from '@/i18n/navigation';
import {
  createEmbassyAction,
  deactivateEmbassyAction,
  reactivateEmbassyAction,
} from '@/lib/services/embassies/embassy.actions';
import type { EmbassyWithCounts, MissionType } from '@/lib/services/embassies/embassy.service';
import { cn } from '@/lib/utils';

const MISSION_TYPES: [MissionType, string][] = [
  ['embassy', 'Embassy'],
  ['consulate', 'Consulate'],
  ['high_commission', 'High Commission'],
  ['permanent_mission', 'Permanent Mission'],
  ['honorary_consulate', 'Honorary Consulate'],
];

export function EmbassyManageClient({
  locale,
  embassies,
}: {
  locale: 'en' | 'fr';
  embassies: EmbassyWithCounts[];
}) {
  const t = useTranslations('embassy_management');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStatus(e: EmbassyWithCounts) {
    setError(null);
    startTransition(async () => {
      const res =
        e.status === 'active'
          ? await deactivateEmbassyAction(e.id, 'Deactivated by tenant admin')
          : await reactivateEmbassyAction(e.id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t('create_embassy')}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {embassies.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-navy-deep p-12 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-surface/30" />
          <p className="text-sm text-surface/50">No embassies yet. Create your first diplomatic mission.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {embassies.map((e) => (
            <div key={e.id} className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{e.name}</h3>
                  <p className="mt-0.5 text-xs text-surface/50">
                    {e.hostCity}, {e.hostCountry}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase',
                    e.status === 'active' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/5 text-surface/40',
                  )}
                >
                  {e.status}
                </span>
              </div>

              <div className="mt-4 flex gap-4 text-xs text-surface/60">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {e.staffCount} staff
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {e.registrantCount} registrants
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                <Link
                  href={`/workspace/embassy/${e.id}`}
                  className="text-xs font-semibold text-gold hover:underline"
                >
                  View &amp; Edit →
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleStatus(e)}
                  className="ml-auto text-xs text-surface/50 transition-colors hover:text-surface/80 disabled:opacity-50"
                >
                  {e.status === 'active' ? t('deactivate') : t('reactivate')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateEmbassyModal
          locale={locale}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false);
            router.push(`/${locale}/workspace/embassy/${id}`);
          }}
        />
      )}
    </div>
  );
}

function CreateEmbassyModal({
  locale,
  onClose,
  onCreated,
}: {
  locale: 'en' | 'fr';
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const t = useTranslations('embassy_management');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [missionType, setMissionType] = useState<MissionType>('embassy');
  const [hostCountry, setHostCountry] = useState('');
  const [hostCountryCode, setHostCountryCode] = useState('');
  const [hostCity, setHostCity] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [headOfMission, setHeadOfMission] = useState('');
  const [jurisdictionDesc, setJurisdictionDesc] = useState('');
  const [jurisdictions, setJurisdictions] = useState<{ code: string; name: string }[]>([]);

  function addJurisdiction(code: string, name: string) {
    setJurisdictions((prev) => (prev.some((j) => j.code === code) ? prev : [...prev, { code, name }]));
  }

  function submit() {
    if (!name.trim() || !hostCountryCode || !hostCity.trim()) {
      setError('Name, host country, and host city are required.');
      return;
    }
    setError(null);
    const all = jurisdictions.length > 0 ? jurisdictions : [{ code: hostCountryCode, name: hostCountry }];
    startTransition(async () => {
      const res = await createEmbassyAction({
        name: name.trim(),
        missionType,
        hostCountry,
        hostCountryCode,
        hostCity: hostCity.trim(),
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone || undefined,
        website: website.trim() || undefined,
        headOfMission: headOfMission.trim() || undefined,
        jurisdictionDescription: jurisdictionDesc.trim() || undefined,
        jurisdictionCountries: all,
      });
      if (res.error || !res.embassyId) setError(res.error ?? 'Failed to create embassy');
      else onCreated(res.embassyId);
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{t('create_embassy')}</h3>
          <button type="button" onClick={onClose} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <F label={t('fields.name_label')} helper={t('fields.name_helper')}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fields.name_placeholder')} className={inp} />
          </F>
          <F label={t('fields.mission_type_label')} helper={t('fields.mission_type_helper')}>
            <select value={missionType} onChange={(e) => setMissionType(e.target.value as MissionType)} className={inp}>
              {MISSION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label={t('fields.host_country_label')} helper={t('fields.host_country_helper')}>
              <CountrySelector locale={locale} onChange={(code, c) => { setHostCountryCode(code); setHostCountry(c.nameEn); }} placeholder="Select" />
            </F>
            <F label={t('fields.host_city_label')} helper={t('fields.host_city_helper')}>
              <CityAutocomplete countryCode={hostCountryCode || undefined} onChange={(c) => setHostCity(c.name)} />
            </F>
          </div>
          <F label={t('fields.address_label')} helper={t('fields.address_helper')}>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inp} />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label={t('fields.email_label')} helper="">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
            </F>
            <F label={t('fields.phone_label')} helper="">
              <PhoneInput defaultCountry={hostCountryCode || 'US'} locale={locale} helperText="" onChange={(e164) => setPhone(e164)} />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label={t('fields.website_label')} helper="">
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inp} />
            </F>
            <F label={t('fields.head_of_mission_label')} helper={t('fields.head_of_mission_helper')}>
              <input value={headOfMission} onChange={(e) => setHeadOfMission(e.target.value)} className={inp} />
            </F>
          </div>

          {/* Jurisdiction */}
          <div className="rounded-lg border border-white/5 bg-navy p-3">
            <F label={t('fields.jurisdiction_label')} helper={t('fields.jurisdiction_helper')}>
              <CountrySelector locale={locale} onChange={(code, c) => addJurisdiction(code, c.nameEn)} placeholder="Add a country" />
            </F>
            {jurisdictions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {jurisdictions.map((j) => (
                  <span key={j.code} className="inline-flex items-center gap-1 rounded bg-gold/10 px-2 py-1 text-[11px] text-gold">
                    {j.name}
                    <button type="button" onClick={() => setJurisdictions((p) => p.filter((x) => x.code !== j.code))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3">
              <textarea
                value={jurisdictionDesc}
                onChange={(e) => setJurisdictionDesc(e.target.value)}
                rows={2}
                placeholder={t('fields.jurisdiction_desc_placeholder')}
                className={inp}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-surface/70 hover:text-white">Cancel</button>
            <button type="button" onClick={submit} disabled={isPending} className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50">
              {isPending ? '…' : t('create_embassy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp =
  'w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none';

function F({ label, helper, children }: { label: string; helper: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white">{label}</label>
      {helper && <p className="mb-1.5 text-[11px] text-surface/40">{helper}</p>}
      {children}
    </div>
  );
}
