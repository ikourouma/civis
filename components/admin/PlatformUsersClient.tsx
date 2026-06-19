'use client';

import { KeyRound, Pencil, Search, UserCheck, UserX, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { DIPLOMATIC_TITLES, diplomaticTitleLabel } from '@/lib/constants/diplomatic-titles';
import type { PlatformRole } from '@/lib/services/auth/auth.types';
import {
  changeUserTenantAction,
  loadUserActivityAction,
  resetPlatformUserPasswordAction,
  setPlatformUserActiveAction,
  updatePlatformUserAction,
} from '@/lib/services/admin/platform-users.actions';
import type { PlatformUser, PlatformUserStats } from '@/lib/services/admin/platform-users.service';
import { cn } from '@/lib/utils';

const ROLES: PlatformRole[] = ['super_admin', 'tenant_admin', 'embassy_admin', 'consular_officer', 'analyst', 'executive_viewer', 'registrant', 'economic_planner'];

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-gold/15 text-gold',
  tenant_admin: 'bg-blue-400/15 text-blue-300',
  embassy_admin: 'bg-emerald-400/15 text-emerald-400',
  consular_officer: 'bg-cyan-400/15 text-cyan-300',
  analyst: 'bg-purple-400/15 text-purple-300',
  executive_viewer: 'bg-amber-400/15 text-amber-300',
  registrant: 'bg-white/5 text-surface/60',
};

interface Props {
  users: PlatformUser[];
  stats: PlatformUserStats;
  tenants: { id: string; name: string }[];
  filters: { tenant?: string; role?: string; status?: string; q?: string };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PlatformUsersClient({ users, stats, tenants, filters }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  const [detail, setDetail] = useState<PlatformUser | null>(null);
  const [activity, setActivity] = useState<{ action: string; createdAt: string }[]>([]);
  const [confirmDeactivate, setConfirmDeactivate] = useState<PlatformUser | null>(null);

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<PlatformRole>('registrant');
  const [tenantId, setTenantId] = useState<string>('');
  const [diploTitle, setDiploTitle] = useState<string>('');

  function applyFilter(patch: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...patch };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v as string); });
    router.push(`?${params.toString()}`);
  }

  function openEdit(u: PlatformUser) {
    setEditing(u);
    setFullName(u.fullName ?? '');
    setRole(u.role);
    setTenantId(u.tenantId ?? '');
    setDiploTitle(u.diplomaticTitle ?? '');
  }

  function openDetail(u: PlatformUser) {
    setDetail(u);
    setActivity([]);
    startTransition(async () => {
      const a = await loadUserActivityAction(u.id);
      setActivity(a);
    });
  }

  function saveEdit() {
    if (!editing) return;
    startTransition(async () => {
      const res = await updatePlatformUserAction(editing.id, {
        fullName,
        role,
        tenantId: tenantId || null,
        diplomaticTitle: diploTitle || null,
      });
      if (res.success) { toast({ type: 'success', title: 'User updated' }); setEditing(null); }
      else toast({ type: 'error', title: 'Update failed', description: res.error });
    });
  }

  function resetPw(u: PlatformUser) {
    startTransition(async () => {
      const res = await resetPlatformUserPasswordAction(u.id, u.email);
      if (res.success) toast({ type: 'success', title: 'Reset email sent', description: u.email });
      else toast({ type: 'error', title: 'Reset failed', description: res.error });
    });
  }

  function toggleActive(u: PlatformUser) {
    startTransition(async () => {
      const res = await setPlatformUserActiveAction(u.id, !u.isActive);
      if (res.success) { toast({ type: 'success', title: u.isActive ? 'User deactivated' : 'User reactivated' }); setConfirmDeactivate(null); }
      else toast({ type: 'error', title: 'Action failed', description: res.error });
    });
  }

  function changeTenant(u: PlatformUser, newTenantId: string) {
    startTransition(async () => {
      const res = await changeUserTenantAction(u.id, newTenantId || null);
      if (res.success) toast({ type: 'success', title: 'Tenant reassigned' });
      else toast({ type: 'error', title: 'Reassign failed', description: res.error });
    });
  }

  const tiles = [
    { label: 'Total Users', value: stats.total },
    { label: 'Super Admins', value: stats.superAdmins },
    { label: 'Tenant Admins', value: stats.tenantAdmins },
    { label: 'Staff', value: stats.staff },
    { label: 'Registrants', value: stats.registrants },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Platform Administration</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Platform User Management</h1>
        <p className="mt-1 text-sm text-surface/60">Manage all users across all tenants.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{t.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface/30" />
          <input
            defaultValue={filters.q}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter({ q: (e.target as HTMLInputElement).value })}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-white/10 bg-navy-deep py-2 pl-9 pr-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
        </div>
        <select value={filters.tenant ?? ''} onChange={(e) => applyFilter({ tenant: e.target.value })} className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:outline-none">
          <option value="">All tenants</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filters.role ?? ''} onChange={(e) => applyFilter({ role: e.target.value })} className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:outline-none">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
        <select value={filters.status ?? ''} onChange={(e) => applyFilter({ status: e.target.value })} className="rounded-lg border border-white/10 bg-navy-deep px-3 py-2 text-sm text-surface/70 focus:outline-none">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full bg-navy-deep text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Tenant</th>
                <th className="px-4 py-3 text-left">Embassy</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-surface/50">No users match these filters.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openDetail(u)} className="text-left">
                        <p className="font-medium text-white">{u.fullName ?? '—'}</p>
                        <p className="text-[10px] text-surface/40">{u.email}</p>
                        {u.diplomaticTitle && <p className="text-[10px] text-gold/70">{diplomaticTitleLabel(u.diplomaticTitle)}</p>}
                      </button>
                    </td>
                    <td className="px-4 py-3"><span className={cn('rounded px-2 py-0.5 text-[10px] uppercase', ROLE_BADGE[u.role] ?? 'bg-white/5 text-surface/50')}>{u.role.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-surface/60">{u.tenantName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-surface/60">{u.embassyNames.join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded px-2 py-0.5 text-[10px]', u.isActive ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400')}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openEdit(u)} title="Edit" className="rounded p-1.5 text-surface/60 hover:text-gold"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => resetPw(u)} title="Reset password" className="rounded p-1.5 text-surface/60 hover:text-gold"><KeyRound className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => (u.isActive ? setConfirmDeactivate(u) : toggleActive(u))} title={u.isActive ? 'Deactivate' : 'Reactivate'} className={cn('rounded p-1.5', u.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-emerald-400 hover:bg-emerald-400/10')}>
                          {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-navy-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Edit User</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <Field label="Full Name" value={fullName} onChange={setFullName} />
            <SelectField label="Role" value={role} onChange={(v) => setRole(v as PlatformRole)} options={ROLES.map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
            <SelectField label="Tenant" value={tenantId} onChange={setTenantId} options={[{ value: '', label: '— None —' }, ...tenants.map((t) => ({ value: t.id, label: t.name }))]} />
            <SelectField label="Diplomatic Title" value={diploTitle} onChange={setDiploTitle} options={[{ value: '', label: '— None —' }, ...DIPLOMATIC_TITLES.map((d) => ({ value: d.value, label: d.labelEn }))]} />
            <button type="button" disabled={isPending} onClick={saveEdit} className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">Save Changes</button>
          </div>
        </div>
      )}

      {/* Detail slide-over */}
      {detail && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-navy-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /><h3 className="text-base font-semibold text-white">{detail.fullName ?? detail.email}</h3></div>
              <button type="button" onClick={() => setDetail(null)} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <Detail label="Email" value={detail.email} />
              <Detail label="Role" value={detail.role.replace('_', ' ')} />
              <Detail label="Tenant" value={detail.tenantName ?? '—'} />
              <Detail label="Embassies" value={detail.embassyNames.join(', ') || '—'} />
              <Detail label="Diplomatic Title" value={diplomaticTitleLabel(detail.diplomaticTitle) ?? '—'} />
              <Detail label="Status" value={detail.isActive ? 'Active' : 'Inactive'} />
              <Detail label="Joined" value={fmtDate(detail.createdAt)} />
            </dl>
            <div className="mt-4">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">Change Tenant</label>
              <select defaultValue={detail.tenantId ?? ''} onChange={(e) => changeTenant(detail, e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white">
                <option value="">— None —</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface/40">Recent Activity</p>
              {activity.length === 0 ? (
                <p className="text-xs text-surface/40">No recent activity.</p>
              ) : (
                <ul className="space-y-1.5">
                  {activity.map((a, i) => (
                    <li key={i} className="flex justify-between text-xs text-surface/60">
                      <span>{a.action.replace(/_/g, ' ')}</span>
                      <span className="text-surface/30">{fmtDate(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeactivate}
        title="Deactivate user"
        description={`${confirmDeactivate?.fullName ?? confirmDeactivate?.email} will no longer be able to sign in.`}
        variant="danger"
        confirmLabel="Deactivate"
        isLoading={isPending}
        onCancel={() => setConfirmDeactivate(null)}
        onConfirm={() => confirmDeactivate && toggleActive(confirmDeactivate)}
      />
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

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm capitalize text-white focus:border-gold/40 focus:outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-surface/40">{label}</dt>
      <dd className="text-right capitalize text-surface/80">{value}</dd>
    </div>
  );
}
