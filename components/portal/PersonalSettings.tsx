'use client';

import { KeyRound, Monitor } from 'lucide-react';
import { useState, useTransition } from 'react';

import { useToast } from '@/components/ui/Toast';
import { DIPLOMATIC_TITLES } from '@/lib/constants/diplomatic-titles';
import {
  sendPasswordResetAction,
  signOutOtherSessionsAction,
  updateMyProfileAction,
} from '@/lib/services/auth/account.actions';

interface Props {
  fullName: string;
  email: string;
  role: string;
  diplomaticTitle: string | null;
  isStaff: boolean;
}

export function PersonalSettings({ fullName, email, role, diplomaticTitle, isStaff }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(fullName);
  const [title, setTitle] = useState(diplomaticTitle ?? '');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('');

  function saveProfile() {
    startTransition(async () => {
      const res = await updateMyProfileAction({ fullName: name, diplomaticTitle: isStaff ? title || null : undefined });
      if (res.success) toast({ type: 'success', title: 'Profile updated' });
      else toast({ type: 'error', title: 'Update failed', description: res.error });
    });
  }

  function changePassword() {
    startTransition(async () => {
      const res = await sendPasswordResetAction();
      if (res.success) toast({ type: 'success', title: 'Password reset email sent', description: email });
      else toast({ type: 'error', title: 'Could not send reset email', description: res.error });
    });
  }

  function signOutOthers() {
    startTransition(async () => {
      const res = await signOutOtherSessionsAction();
      if (res.success) toast({ type: 'success', title: 'Other sessions signed out' });
      else toast({ type: 'error', title: 'Action failed', description: res.error });
    });
  }

  const input = 'mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Account</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Settings</h1>
      </header>

      <Section title="Personal Information">
        <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Full Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
        <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Email</span>
          <input value={email} disabled className={`${input} opacity-60`} /></label>
        {isStaff && (
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Diplomatic Title</span>
            <select value={title} onChange={(e) => setTitle(e.target.value)} className={input}>
              <option value="">— None —</option>
              {DIPLOMATIC_TITLES.map((d) => <option key={d.value} value={d.value}>{d.labelEn}</option>)}
            </select></label>
        )}
        <p className="text-[10px] text-surface/40">Role: {role.replace('_', ' ')}</p>
        <button type="button" disabled={isPending} onClick={saveProfile} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">Save</button>
      </Section>

      <Section title="Preferences">
        <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={input}>
            <option value="en">English</option><option value="fr">Français</option>
          </select></label>
        <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Timezone</span>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. America/New_York" className={input} /></label>
        <p className="text-[10px] text-surface/40">Preference storage arrives in a future release.</p>
      </Section>

      <Section title="Security">
        <button type="button" disabled={isPending} onClick={changePassword} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/70 hover:text-white disabled:opacity-50">
          <KeyRound className="h-4 w-4" /> Change Password (email link)
        </button>
        <div className="rounded-lg border border-white/5 bg-navy p-3">
          <p className="flex items-center gap-2 text-sm text-white"><Monitor className="h-4 w-4 text-emerald-400" /> Current session <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] text-emerald-400">Active</span></p>
          <p className="mt-1 text-[10px] text-surface/40">This device, signed in now.</p>
        </div>
        <button type="button" disabled={isPending} onClick={signOutOthers} className="rounded-lg border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/10 disabled:opacity-50">
          Sign Out All Other Sessions
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-white/5 bg-navy-deep p-6">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}
