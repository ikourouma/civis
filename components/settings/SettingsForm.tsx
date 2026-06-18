'use client';

import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { saveTenantSettingsAction } from '@/lib/services/settings/settings.actions';
import type { TenantSettings } from '@/lib/services/settings';
import { cn } from '@/lib/utils';

type TabKey = 'general' | 'security' | 'retention' | 'consent' | 'notifications';

interface Props {
  settings: TenantSettings;
  flags: { canEdit: boolean; canRetention: boolean; canConsent: boolean };
}

const ROLES = ['tenant_admin', 'embassy_admin', 'consular_officer', 'analyst', 'executive_viewer'];

export function SettingsForm({ settings, flags }: Props) {
  const t = useTranslations('settings');
  const [tab, setTab] = useState<TabKey>('general');
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Editable state
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(settings.supportedLanguages);
  const [contactEmail, setContactEmail] = useState(settings.primaryContactEmail ?? '');
  const [timezone, setTimezone] = useState(settings.timezone ?? '');
  const [security, setSecurity] = useState(settings.security);
  const [retention, setRetention] = useState(settings.retention);
  const [consentEn, setConsentEn] = useState(settings.consent.textEn);
  const [consentFr, setConsentFr] = useState(settings.consent.textFr);
  const [notifications, setNotifications] = useState(settings.notifications);

  const { canEdit, canRetention, canConsent } = flags;
  const disabled = !canEdit;

  function save() {
    setErr(null);
    startTransition(async () => {
      const res = await saveTenantSettingsAction({
        defaultLanguage,
        supportedLanguages,
        primaryContactEmail: contactEmail || null,
        timezone: timezone || null,
        security,
        retention: canRetention ? retention : undefined,
        consent: canConsent ? { textEn: consentEn, textFr: consentFr } : undefined,
        notifications,
      });
      if (res.success) setMsg('Settings saved.');
      else setErr(res.error ?? 'Save failed.');
    });
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'general', label: t('tabs.general') },
    { key: 'security', label: t('tabs.security') },
    { key: 'retention', label: t('tabs.retention') },
    { key: 'consent', label: t('tabs.consent') },
    { key: 'notifications', label: t('tabs.notifications') },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Configuration</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('page_title')}</h1>
        <p className="mt-1 text-sm text-surface/60">{t('page_subtitle')} — {settings.tenantName}</p>
      </header>

      {msg && <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">{err}</div>}

      <div className="flex flex-wrap gap-1 border-b border-white/5">
        {tabs.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={cn('px-4 py-2.5 text-sm font-medium transition-colors', tab === key ? 'border-b-2 border-gold text-gold' : 'text-surface/60 hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-navy-deep p-6">
        {tab === 'general' && (
          <div className="grid grid-cols-2 gap-4">
            <ReadOnly label={t('general.tenant_name')} value={settings.tenantName} />
            <ReadOnly label={t('general.country_code')} value={settings.countryCode} />
            <ReadOnly label={t('general.deployment_tier')} value={settings.deploymentTier} />
            <ReadOnly label="Currency" value={settings.currencyCode ?? '—'} />
            <Field label={t('general.default_language')} value={defaultLanguage} onChange={setDefaultLanguage} disabled={disabled} />
            <Field label={t('general.contact_email')} value={contactEmail} onChange={setContactEmail} disabled={disabled} />
            <Field label={t('general.timezone')} value={timezone} onChange={setTimezone} disabled={disabled} />
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t('general.supported_languages')}</span>
              <div className="mt-2 flex gap-3">
                {['en', 'fr'].map((l) => (
                  <label key={l} className="flex items-center gap-1.5 text-sm text-surface/70">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={supportedLanguages.includes(l)}
                      onChange={(e) => setSupportedLanguages((cur) => (e.target.checked ? [...cur, l] : cur.filter((x) => x !== l)))}
                      className="h-4 w-4 rounded border-white/20 bg-navy"
                    />
                    {l.toUpperCase()}
                  </label>
                ))}
              </div>
            </label>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-5">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t('security.mfa_roles')}</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-1.5 text-sm text-surface/70">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={security.mfaRoles.includes(r)}
                      onChange={(e) => setSecurity((s) => ({ ...s, mfaRoles: e.target.checked ? [...s.mfaRoles, r] : s.mfaRoles.filter((x) => x !== r) }))}
                      className="h-4 w-4 rounded border-white/20 bg-navy"
                    />
                    {r.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </label>
            <div className="grid grid-cols-3 gap-4">
              <NumField label={t('security.password_max_age')} value={security.passwordMaxAgeDays} onChange={(v) => setSecurity((s) => ({ ...s, passwordMaxAgeDays: v }))} disabled={disabled} />
              <NumField label={t('security.session_timeout')} value={security.sessionTimeoutMinutes} onChange={(v) => setSecurity((s) => ({ ...s, sessionTimeoutMinutes: v }))} disabled={disabled} />
              <NumField label={t('security.max_login_attempts')} value={security.maxLoginAttempts} onChange={(v) => setSecurity((s) => ({ ...s, maxLoginAttempts: v }))} disabled={disabled} />
            </div>
            <p className="text-xs text-surface/40">{t('security.mfa_note')}</p>
          </div>
        )}

        {tab === 'retention' && (
          !canRetention ? (
            <p className="text-sm text-surface/50">Data retention configuration is not enabled for your role.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <NumField label={t('retention.period')} value={retention.retentionDays} onChange={(v) => setRetention((r) => ({ ...r, retentionDays: v }))} disabled={disabled} />
                <p className="mt-1 text-xs text-surface/40">{t('retention.period_helper')}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-surface/80">
                <input type="checkbox" disabled={disabled} checked={retention.autoDelete} onChange={(e) => setRetention((r) => ({ ...r, autoDelete: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-navy" />
                {t('retention.auto_delete')}
              </label>
              <p className="text-xs text-surface/40">{t('retention.auto_delete_helper')}</p>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t('retention.policy_description')}</span>
                <textarea disabled={disabled} value={retention.policyDescription} onChange={(e) => setRetention((r) => ({ ...r, policyDescription: e.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none disabled:opacity-60" />
                <span className="mt-1 block text-xs text-surface/40">{t('retention.policy_helper')}</span>
              </label>
            </div>
          )
        )}

        {tab === 'consent' && (
          !canConsent ? (
            <p className="text-sm text-surface/50">Consent text configuration is not enabled for your role.</p>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-surface/40">{t('consent.version_note')} (current: v{settings.consent.version})</p>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t('consent.text_en')}</span>
                <textarea disabled={disabled} value={consentEn} onChange={(e) => setConsentEn(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none disabled:opacity-60" />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t('consent.text_fr')}</span>
                <textarea disabled={disabled} value={consentFr} onChange={(e) => setConsentFr(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none disabled:opacity-60" />
              </label>
            </div>
          )
        )}

        {tab === 'notifications' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-surface/80">
              <input type="checkbox" disabled={disabled} checked={notifications.emailEnabled} onChange={(e) => setNotifications((n) => ({ ...n, emailEnabled: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-navy" />
              {t('notifications.email_toggle')}
            </label>
            <div className="space-y-2 border-t border-white/5 pt-4">
              {([
                ['newRegistration', t('notifications.new_registration')],
                ['registrationApproved', t('notifications.registration_approved')],
                ['gdprRequest', t('notifications.gdpr_request')],
                ['staffProvisioned', t('notifications.staff_provisioned')],
                ['embassyCreated', t('notifications.embassy_created')],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-surface/70">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={notifications[key]}
                    onChange={(e) => setNotifications((n) => ({ ...n, [key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-navy"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-surface/40">{t('notifications.future_note')}</p>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-navy-deepest/95 backdrop-blur lg:left-60">
          <div className="mx-auto flex max-w-3xl items-center justify-end px-6 py-3">
            <button type="button" onClick={save} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">
              <Save className="h-4 w-4" /> {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <p className="mt-1 rounded-lg border border-white/5 bg-navy px-3 py-2 text-sm capitalize text-surface/60">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none disabled:opacity-60" />
    </label>
  );
}

function NumField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none disabled:opacity-60" />
    </label>
  );
}
