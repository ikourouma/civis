'use client';

import { KeyRound, Plus, UserCheck, UserCog, UserX, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import {
  deactivateStaffAction,
  provisionStaffAction,
  reactivateStaffAction,
  resetStaffPasswordAction,
  updateStaffRoleAction,
} from '@/lib/services/staff/staff.actions';
import type { StaffMember, StaffRole, StaffStats } from '@/lib/services/staff/staff.service';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
  embassy_admin: 'bg-gold/15 text-gold',
  consular_officer: 'bg-blue-400/15 text-blue-300',
  analyst: 'bg-purple-400/15 text-purple-300',
  executive_viewer: 'bg-emerald-400/15 text-emerald-400',
};

const ROLES: StaffRole[] = ['embassy_admin', 'consular_officer', 'analyst', 'executive_viewer'];

interface Embassy {
  id: string;
  name: string;
}

export function UserManagementClient({
  locale,
  staff,
  stats,
  embassies,
}: {
  locale: 'en' | 'fr';
  staff: StaffMember[];
  stats: StaffStats;
  embassies: Embassy[];
}) {
  const t = useTranslations('staff_management');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState('');
  const [embassyFilter, setEmbassyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return staff.filter((m) => {
      if (roleFilter && m.role !== roleFilter) return false;
      if (embassyFilter && m.embassyId !== embassyFilter) return false;
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'inactive' && m.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(m.fullName ?? '').toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [staff, roleFilter, embassyFilter, statusFilter, search]);

  function run(fn: () => Promise<{ success?: boolean; error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const tiles = [
    { label: t('tiles.total_users'), value: stats.total, Icon: Users },
    { label: t('tiles.embassy_admins'), value: stats.embassyAdmins, Icon: UserCog },
    { label: t('tiles.consular_officers'), value: stats.consularOfficers, Icon: UserCheck },
    { label: t('tiles.analysts'), value: stats.analysts, Icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-navy-deep p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
              <Icon className="h-4 w-4 text-gold/70" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="h-9 w-56 rounded-lg border border-white/10 bg-navy-deep px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={filterClass}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={embassyFilter} onChange={(e) => setEmbassyFilter(e.target.value)} className={filterClass}>
            <option value="">All embassies</option>
            {embassies.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterClass}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t('add_staff')}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-navy-deep text-[10px] uppercase tracking-widest text-surface/40">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Embassy</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-navy-deep">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-surface/50">No staff match the filters.</td></tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className={cn('border-b border-white/5 last:border-0', !m.isActive && 'opacity-50')}>
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{m.fullName ?? m.email}</p>
                  <p className="text-[10px] text-surface/40">{m.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={m.role}
                    disabled={isPending}
                    onChange={(e) => run(() => updateStaffRoleAction(m.id, e.target.value as StaffRole))}
                    className={cn('rounded px-2 py-1 text-[10px] font-semibold uppercase focus:outline-none', ROLE_BADGE[m.role] ?? 'bg-white/5 text-surface/60')}
                  >
                    {ROLES.map((r) => <option key={r} value={r} className="bg-navy-deepest normal-case text-white">{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-surface/60">{m.embassyName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', m.isActive ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/5 text-surface/40')}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn title={t('actions.reset_password')} disabled={isPending} onClick={() => run(() => resetStaffPasswordAction(m.id))}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </IconBtn>
                    {m.isActive ? (
                      <IconBtn title={t('actions.deactivate')} danger disabled={isPending} onClick={() => run(() => deactivateStaffAction(m.id, 'Deactivated by admin'))}>
                        <UserX className="h-3.5 w-3.5" />
                      </IconBtn>
                    ) : (
                      <IconBtn title={t('actions.reactivate')} disabled={isPending} onClick={() => run(() => reactivateStaffAction(m.id))}>
                        <UserCheck className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddStaffModal
          embassies={embassies}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

const filterClass =
  'h-9 rounded-lg border border-white/10 bg-navy-deep px-3 text-sm text-surface/70 focus:border-gold/40 focus:outline-none';

function IconBtn({ children, title, onClick, disabled, danger }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-md p-1.5 text-surface/50 transition-colors disabled:opacity-50',
        danger ? 'hover:bg-red-400/10 hover:text-red-400' : 'hover:bg-white/[0.06] hover:text-gold',
      )}
    >
      {children}
    </button>
  );
}

function AddStaffModal({ embassies, onClose, onCreated }: { embassies: Embassy[]; onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('staff_management');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('consular_officer');
  const [embassyId, setEmbassyId] = useState('');
  const [welcome, setWelcome] = useState(true);

  const embassyRequired = role === 'embassy_admin' || role === 'consular_officer';

  function submit() {
    if (!fullName.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (embassyRequired && !embassyId) {
      setError('This role requires an embassy assignment.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await provisionStaffAction({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        embassyId: embassyId || undefined,
        sendWelcomeEmail: welcome,
      });
      if (res.error) setError(res.error);
      else onCreated();
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{t('add_staff')}</h3>
          <button type="button" onClick={onClose} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <ModalField label={t('fields.name_label')} helper={t('fields.name_helper')}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={modalInput} />
          </ModalField>
          <ModalField label={t('fields.email_label')} helper={t('fields.email_helper')}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={modalInput} />
          </ModalField>
          <ModalField label={t('fields.role_label')} helper={t(`roles.${role}` as 'roles.consular_officer')}>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={modalInput}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </ModalField>
          <ModalField label={t('fields.embassy_label')} helper={t('fields.embassy_helper')}>
            <select value={embassyId} onChange={(e) => setEmbassyId(e.target.value)} className={modalInput}>
              <option value="">{embassyRequired ? '— Required —' : '— National scope —'}</option>
              {embassies.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </ModalField>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-surface/70">
            <input type="checkbox" checked={welcome} onChange={(e) => setWelcome(e.target.checked)} className="h-4 w-4 accent-gold" />
            {t('fields.send_welcome')}
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-surface/70 hover:text-white">Cancel</button>
            <button type="button" onClick={submit} disabled={isPending} className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50">
              {isPending ? '…' : t('add_staff')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const modalInput =
  'h-10 w-full rounded-lg border border-white/10 bg-navy px-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none';

function ModalField({ label, helper, children }: { label: string; helper: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white">{label}</label>
      <p className="mb-1.5 text-[11px] text-surface/40">{helper}</p>
      {children}
    </div>
  );
}
