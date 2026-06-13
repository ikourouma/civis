'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CreateTenantModal } from '@/components/admin/CreateTenantModal';
import type { CivisTenant } from '@/lib/services/tenants';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-success-teal/15 text-success-teal',
  pilot: 'bg-gold/15 text-gold',
  suspended: 'bg-red-400/15 text-red-400',
  archived: 'bg-white/5 text-surface/50',
};

const TIER_BADGE: Record<string, string> = {
  cloud: 'bg-blue-400/15 text-blue-300',
  government: 'bg-gold/15 text-gold',
  sovereign: 'bg-navy/40 text-surface',
};

export function TenantsTable({ tenants }: { tenants: (CivisTenant & { userCount: number })[] }) {
  const t = useTranslations('Workspace.admin');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="mt-10 rounded-2xl border border-white/5 bg-navy-deep">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface/60">
          {t('tenants_table_title')}
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deepest transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('add_tenant')}
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-navy-deepest text-xs uppercase tracking-wider text-surface/40">
            <tr>
              <th className="px-6 py-3 font-medium">{t('cols.country')}</th>
              <th className="px-6 py-3 font-medium">{t('cols.tier')}</th>
              <th className="px-6 py-3 font-medium">{t('cols.status')}</th>
              <th className="px-6 py-3 font-medium">{t('cols.users')}</th>
              <th className="px-6 py-3 font-medium">{t('cols.created')}</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-surface/50">
                  {t('empty')}
                </td>
              </tr>
            )}
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <p className="font-medium text-white">{tenant.name}</p>
                  <p className="text-xs text-surface/40">
                    {tenant.countryCode} {tenant.region ? `· ${tenant.region}` : ''}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TIER_BADGE[tenant.deploymentTier] ?? ''}`}>
                    {tenant.deploymentTier}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[tenant.status] ?? ''}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-surface/80">{tenant.userCount}</td>
                <td className="px-6 py-4 text-surface/60">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <CreateTenantModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
