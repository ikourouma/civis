'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Link } from '@/i18n/navigation';
import { StaffAssignmentPanel, type AssignableOption } from '@/components/workspace/StaffAssignmentPanel';
import { updateEmbassyAction } from '@/lib/services/embassies/embassy.actions';
import type { EmbassyDetail, MissionType } from '@/lib/services/embassies/embassy.service';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'staff' | 'registrants' | 'activity';

const MISSION_TYPES: [MissionType, string][] = [
  ['embassy', 'Embassy'],
  ['consulate', 'Consulate'],
  ['high_commission', 'High Commission'],
  ['permanent_mission', 'Permanent Mission'],
  ['honorary_consulate', 'Honorary Consulate'],
];

interface Props {
  locale: 'en' | 'fr';
  detail: EmbassyDetail;
  assignable: AssignableOption[];
  registrants: { id: string; name: string; country: string; status: string }[];
  registrantTotal: number;
  activity: { action: string; createdAt: string }[];
}

export function EmbassyDetailClient({ locale, detail, assignable, registrants, registrantTotal, activity }: Props) {
  const t = useTranslations('embassy_management');
  const router = useRouter();
  const { embassy, staff, stats } = detail;
  const [tab, setTab] = useState<Tab>('profile');
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  // editable profile state
  const [form, setForm] = useState({
    missionType: embassy.missionType,
    address: embassy.address ?? '',
    email: embassy.email ?? '',
    phone: embassy.phone ?? '',
    website: embassy.website ?? '',
    headOfMission: embassy.headOfMission ?? '',
    timezone: embassy.timezone ?? '',
    jurisdictionDescription: embassy.jurisdictionDescription ?? '',
  });

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateEmbassyAction(embassy.id, {
        missionType: form.missionType,
        address: form.address,
        email: form.email,
        phone: form.phone,
        website: form.website,
        headOfMission: form.headOfMission,
        timezone: form.timezone,
        jurisdictionDescription: form.jurisdictionDescription,
      });
      if (res.error) setMsg(res.error);
      else {
        setMsg('Saved.');
        router.refresh();
      }
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: t('tabs.profile') },
    { key: 'staff', label: `${t('tabs.staff')} (${staff.length})` },
    { key: 'registrants', label: `${t('tabs.registrants')} (${registrantTotal})` },
    { key: 'activity', label: t('tabs.activity') },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/workspace/embassy/manage" className="inline-flex items-center gap-2 text-sm text-surface/60 hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Embassy Management
      </Link>

      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-bold text-white">{embassy.name}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-surface/60">
          <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', embassy.status === 'active' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/5 text-surface/40')}>
            {embassy.status}
          </span>
          {embassy.hostCity}, {embassy.hostCountry}
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/5">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              tab === tb.key ? 'border-b-2 border-gold text-gold' : 'text-surface/60 hover:text-white',
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4 rounded-xl border border-white/5 bg-navy-deep p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('fields.mission_type_label')}>
              <select value={form.missionType} onChange={(e) => setForm({ ...form, missionType: e.target.value as MissionType })} className={inp}>
                {MISSION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label={t('fields.head_of_mission_label')}>
              <input value={form.headOfMission} onChange={(e) => setForm({ ...form, headOfMission: e.target.value })} className={inp} />
            </Field>
            <Field label={t('fields.email_label')}>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
            </Field>
            <Field label={t('fields.phone_label')}>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} />
            </Field>
            <Field label={t('fields.website_label')}>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inp} />
            </Field>
            <Field label={t('fields.timezone_label')}>
              <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={inp} placeholder="America/New_York" />
            </Field>
          </div>
          <Field label={t('fields.address_label')}>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inp} />
          </Field>
          <Field label={t('fields.jurisdiction_desc_label')}>
            <textarea value={form.jurisdictionDescription} onChange={(e) => setForm({ ...form, jurisdictionDescription: e.target.value })} rows={2} className={inp} />
          </Field>
          <div className="flex items-center gap-3 border-t border-white/5 pt-4">
            <button type="button" onClick={save} disabled={isPending} className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50">
              {isPending ? '…' : 'Save Changes'}
            </button>
            {msg && <span className="text-xs text-surface/50">{msg}</span>}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <StaffAssignmentPanel embassyId={embassy.id} embassyName={embassy.name} staff={staff} assignable={assignable} mode="tenant_admin" />
      )}

      {tab === 'registrants' && (
        <div className="overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/5 bg-navy-deep text-[10px] uppercase tracking-widest text-surface/40">
              <tr><th className="px-5 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Country</th><th className="px-4 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody className="bg-navy-deep">
              {registrants.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-surface/50">No registrants for this embassy.</td></tr>}
              {registrants.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-white">{r.name}</td>
                  <td className="px-4 py-3 text-surface/60">{r.country}</td>
                  <td className="px-4 py-3 capitalize text-surface/50">{r.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {registrantTotal > registrants.length && (
            <p className="bg-navy-deep px-5 py-3 text-center text-[11px] text-surface/40">Showing {registrants.length} of {registrantTotal}</p>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          {activity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-surface/50">No activity recorded.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm capitalize text-surface/70">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="text-xs text-surface/40">{new Date(a.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* stats footer */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[
          ['Total', stats.total],
          ['Pending', stats.pending],
          ['Verified', stats.verified],
          ['This month', stats.thisMonth],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-white/5 bg-navy-deep p-3 text-center">
            <p className="text-xl font-bold text-white">{value as number}</p>
            <p className="text-[10px] uppercase tracking-widest text-surface/40">{label as string}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp =
  'w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-surface/60">{label}</label>
      {children}
    </div>
  );
}
