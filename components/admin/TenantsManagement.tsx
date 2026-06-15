'use client';

import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { CreateTenantModal } from '@/components/admin/CreateTenantModal';
import { setTenantStatusAction } from '@/app/[locale]/admin/dashboard/actions';
import type { TenantAdminView, TenantStatus } from '@/lib/services/tenants';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-400/15 text-emerald-400',
  pilot: 'bg-gold/15 text-gold',
  suspended: 'bg-red-400/15 text-red-400',
  archived: 'bg-white/5 text-surface/50',
};
const TIER_BADGE: Record<string, string> = {
  cloud: 'bg-blue-400/15 text-blue-300',
  government: 'bg-gold/15 text-gold',
  sovereign: 'bg-navy/40 text-surface',
};

export function TenantsManagement({ tenants }: { tenants: TenantAdminView[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<TenantAdminView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tenants.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (tierFilter && t.deploymentTier !== tierFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!t.name.toLowerCase().includes(q) && !t.countryCode.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [tenants, search, statusFilter, tierFilter],
  );

  function changeStatus(tenantId: string, status: TenantStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setTenantStatusAction(tenantId, status);
      if (res.error) setError(res.error);
      else {
        setDetail(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country or code…"
            className="h-9 w-56 rounded-lg border border-white/10 bg-navy-deep px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={fc}>
            <option value="">All statuses</option>
            {['active', 'pilot', 'suspended', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className={fc}>
            <option value="">All tiers</option>
            {['cloud', 'government', 'sovereign'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Tenant
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-navy-deep text-[10px] uppercase tracking-widest text-surface/40">
            <tr>
              <th className="px-5 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tenant Admin</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Embassies</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-navy-deep">
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-surface/50">No tenants match the filters.</td></tr>}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{t.name}</p>
                  <p className="text-[10px] text-surface/40">{t.countryCode}{t.region ? ` · ${t.region}` : ''}</p>
                </td>
                <td className="px-4 py-3"><span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', TIER_BADGE[t.deploymentTier])}>{t.deploymentTier}</span></td>
                <td className="px-4 py-3"><span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', STATUS_BADGE[t.status])}>{t.status}</span></td>
                <td className="px-4 py-3 text-surface/70">{t.adminEmail ?? '—'}</td>
                <td className="px-4 py-3 text-surface/70">{t.userCount}</td>
                <td className="px-4 py-3 text-surface/70">{t.embassyCount}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setDetail(t)} className="text-xs font-semibold text-gold hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && <CreateTenantModal onClose={() => setCreateOpen(false)} />}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-navy-deepest p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{detail.name}</h2>
                <div className="mt-2 flex gap-2">
                  <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', TIER_BADGE[detail.deploymentTier])}>{detail.deploymentTier}</span>
                  <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', STATUS_BADGE[detail.status])}>{detail.status}</span>
                </div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <Section title="Tenant Information">
              <Row label="Official Name" value={detail.officialCountryName ?? detail.name} />
              <Row label="Country Code" value={detail.countryCode} />
              <Row label="Region" value={detail.region ?? '—'} />
              <Row label="Data Residency" value={detail.dataResidencyRegion} />
              <Row label="Default Language" value={detail.defaultLanguage.toUpperCase()} />
              <Row label="Created" value={new Date(detail.createdAt).toLocaleDateString()} />
            </Section>

            <Section title="Tenant Administrator">
              <Row label="Name" value={detail.adminName ?? '—'} />
              <Row label="Email" value={detail.adminEmail ?? '—'} />
            </Section>

            <Section title="Platform Statistics">
              <Row label="Total Users" value={String(detail.userCount)} />
              <Row label="Embassies" value={String(detail.embassyCount)} />
            </Section>

            <div className="mt-6 space-y-2 border-t border-white/5 pt-5">
              {detail.status !== 'suspended' ? (
                <button type="button" disabled={isPending} onClick={() => changeStatus(detail.id, 'suspended')} className="w-full rounded-lg bg-red-400/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-400/20 disabled:opacity-50">
                  Suspend Tenant
                </button>
              ) : (
                <button type="button" disabled={isPending} onClick={() => changeStatus(detail.id, 'active')} className="w-full rounded-lg bg-emerald-400/10 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-50">
                  Reactivate Tenant
                </button>
              )}
              {detail.status !== 'archived' && (
                <button type="button" disabled={isPending} onClick={() => { if (confirm('Archive this tenant? This is irreversible.')) changeStatus(detail.id, 'archived'); }} className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-surface/60 hover:text-white disabled:opacity-50">
                  Archive Tenant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const fc = 'h-9 rounded-lg border border-white/10 bg-navy-deep px-3 text-sm text-surface/70 focus:border-gold/40 focus:outline-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gold/70">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-surface/40">{label}</span>
      <span className="text-right text-surface/80">{value}</span>
    </div>
  );
}
