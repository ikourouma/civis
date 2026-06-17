'use client';

import { Copy, Lock, RotateCcw, Save, Star, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';

import { CAPABILITY_DOMAINS, FUTURE_DOMAINS, type CapabilityCode, type CapabilityDomain } from '@/lib/entitlements/capabilities';
import {
  copyEntitlementsAction,
  getEffectiveEntitlementsAction,
  resetEntitlementsAction,
  saveEntitlementsAction,
} from '@/lib/services/entitlements/entitlement.actions';
import type { EffectiveEntitlement } from '@/lib/services/entitlements/entitlement.service';
import type { PlatformRole } from '@/lib/services/auth/auth.types';
import { cn } from '@/lib/utils';

type Tenant = { id: string; name: string; countryCode: string };
type Lang = 'en' | 'fr';

const ROLES: PlatformRole[] = ['tenant_admin', 'embassy_admin', 'consular_officer', 'analyst', 'executive_viewer', 'registrant'];
const ROLE_LABEL: Record<string, string> = {
  tenant_admin: 'Tenant Admin', embassy_admin: 'Embassy Admin', consular_officer: 'Consular Officer',
  analyst: 'Analyst', executive_viewer: 'Executive Viewer', registrant: 'Registrant',
};

export function EntitlementsPanel({
  locale,
  tenants,
  initialTenantId,
  initialRole,
  initialEntitlements,
}: {
  locale: Lang;
  tenants: Tenant[];
  initialTenantId: string;
  initialRole: PlatformRole;
  initialEntitlements: EffectiveEntitlement[];
}) {
  const t = useTranslations('entitlements');
  const [isPending, startTransition] = useTransition();
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [role, setRole] = useState<PlatformRole>(initialRole);
  const [items, setItems] = useState<EffectiveEntitlement[]>(initialEntitlements);
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(initialEntitlements.map((e) => [e.code, e.isEnabled])),
  );
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  function loadFor(nextTenant: string, nextRole: PlatformRole) {
    setMsg(null);
    startTransition(async () => {
      const eff = await getEffectiveEntitlementsAction(nextTenant, nextRole);
      setItems(eff);
      setToggles(Object.fromEntries(eff.map((e) => [e.code, e.isEnabled])));
      setDirty(false);
    });
  }

  function selectTenant(id: string) {
    setTenantId(id);
    loadFor(id, role);
  }
  function selectRole(r: PlatformRole) {
    setRole(r);
    loadFor(tenantId, r);
  }

  function toggle(code: CapabilityCode) {
    setToggles((prev) => ({ ...prev, [code]: !prev[code] }));
    setDirty(true);
  }

  function save() {
    setMsg(null);
    const desired = items
      .filter((i) => i.isConfigurable)
      .map((i) => ({ code: i.code, isEnabled: !!toggles[i.code] }));
    startTransition(async () => {
      const res = await saveEntitlementsAction(tenantId, role, desired);
      if (res.error) setMsg(res.error);
      else {
        setMsg(t('actions.saved_success'));
        loadFor(tenantId, role);
      }
    });
  }

  function reset() {
    if (!confirm(t('actions.reset_confirm'))) return;
    startTransition(async () => {
      await resetEntitlementsAction(tenantId, role);
      loadFor(tenantId, role);
    });
  }

  function copyFrom(sourceId: string) {
    setCopyOpen(false);
    startTransition(async () => {
      await copyEntitlementsAction(sourceId, tenantId);
      loadFor(tenantId, role);
    });
  }

  const overrideCount = useMemo(
    () => items.filter((i) => i.isConfigurable && !!toggles[i.code] !== i.defaultValue).length,
    [items, toggles],
  );
  const defaultCount = items.filter((i) => i.isConfigurable).length - overrideCount;

  const byDomain = useMemo(() => {
    const m = new Map<CapabilityDomain, EffectiveEntitlement[]>();
    for (const d of CAPABILITY_DOMAINS) {
      const inDomain = items.filter((i) => i.domain === d);
      if (inDomain.length) m.set(d, inDomain);
    }
    return m;
  }, [items]);

  return (
    <div>
      {/* Tenant selector + status */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-navy-deep p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-surface/60">{t('select_tenant')}</label>
          <select
            value={tenantId}
            onChange={(e) => selectTenant(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-navy px-3 text-sm text-white focus:border-gold/40 focus:outline-none"
          >
            {tenants.map((tn) => (
              <option key={tn.id} value={tn.id}>{tn.name} ({tn.countryCode})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded bg-gold/10 px-2 py-1 font-semibold text-gold">{t('active_overrides')}: {overrideCount}</span>
          <span className="rounded bg-white/5 px-2 py-1 text-surface/60">{t('using_defaults')}: {defaultCount}</span>
        </div>
      </div>

      {/* Role tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-white/5">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => selectRole(r)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              role === r ? 'border-b-2 border-gold text-gold' : 'text-surface/60 hover:text-white',
            )}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">{msg}</div>}

      {/* Domain-grouped toggles */}
      <div className={cn('space-y-6 pb-24', isPending && 'opacity-60')}>
        {Array.from(byDomain.entries()).map(([domain, caps]) => (
          <section key={domain}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-surface/50">
              {t(`domains.${domain}` as 'domains.registry')}
              {FUTURE_DOMAINS.includes(domain) && <Lock className="h-3 w-3 text-surface/30" />}
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/5">
              {caps.map((c, i) => {
                const on = !!toggles[c.code];
                const isOverride = c.isConfigurable && on !== c.defaultValue;
                const isFuture = FUTURE_DOMAINS.includes(domain);
                return (
                  <div key={c.code} className={cn('flex items-start gap-4 bg-navy-deep p-4', i > 0 && 'border-t border-white/5')}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isOverride && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" title="Override" />}
                        <p className="text-sm font-medium text-white">{locale === 'fr' ? c.nameFr : c.nameEn}</p>
                        {c.isPremium && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-gold/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gold">
                            <Star className="h-2.5 w-2.5" /> {t('labels.premium')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-surface/50">{locale === 'fr' ? c.descriptionFr : c.descriptionEn}</p>
                      <p className="mt-1 text-[10px] text-surface/30">
                        {t('labels.default')}: {c.defaultValue ? t('labels.on') : t('labels.off')}
                        {isOverride && ` · ${t('labels.override')}: ${on ? t('labels.on') : t('labels.off')}`}
                        {isFuture && ` · ${t('labels.coming_soon')}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={!c.isConfigurable || isPending}
                      onClick={() => toggle(c.code)}
                      className={cn(
                        'relative mt-1 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40',
                        on ? 'bg-gold' : 'bg-white/10',
                      )}
                    >
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', on ? 'left-[18px]' : 'left-0.5')} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-navy-deepest/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex gap-2">
            <button type="button" onClick={reset} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 hover:text-white disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" /> {t('actions.reset_defaults')}
            </button>
            <button type="button" onClick={() => setCopyOpen(true)} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 hover:text-white disabled:opacity-50">
              <Copy className="h-3.5 w-3.5" /> {t('actions.copy_from_tenant')}
            </button>
          </div>
          <button type="button" onClick={save} disabled={isPending || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-40">
            <Save className="h-4 w-4" /> {t('actions.save_changes')}
          </button>
        </div>
      </div>

      {/* Copy modal */}
      {copyOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{t('actions.copy_from_tenant')}</h3>
              <button type="button" onClick={() => setCopyOpen(false)} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-xs text-surface/50">Copy all entitlement overrides from another tenant into this one.</p>
            <div className="space-y-1">
              {tenants.filter((tn) => tn.id !== tenantId).map((tn) => (
                <button
                  key={tn.id}
                  type="button"
                  onClick={() => copyFrom(tn.id)}
                  className="block w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-surface/80 transition-colors hover:border-gold/30 hover:text-white"
                >
                  {tn.name} ({tn.countryCode})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
