'use client';

import { Plus, UserMinus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { EmbassyStaffMember } from '@/lib/services/embassies/embassy.service';
import { assignStaffAction, unassignStaffAction, updateStaffRoleAction } from '@/lib/services/staff/staff.actions';
import type { StaffRole } from '@/lib/services/staff/staff.service';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
  embassy_admin: 'bg-gold/15 text-gold',
  consular_officer: 'bg-blue-400/15 text-blue-300',
  analyst: 'bg-purple-400/15 text-purple-300',
  executive_viewer: 'bg-emerald-400/15 text-emerald-400',
};

export interface AssignableOption {
  id: string;
  email: string;
  fullName: string | null;
}

interface Props {
  embassyId: string;
  embassyName: string;
  staff: EmbassyStaffMember[];
  assignable: AssignableOption[];
  // 'tenant_admin' can assign any role; 'embassy_admin' is restricted to consular_officer
  mode: 'tenant_admin' | 'embassy_admin';
}

const TENANT_ROLES: StaffRole[] = ['embassy_admin', 'consular_officer', 'analyst', 'executive_viewer'];

export function StaffAssignmentPanel({ embassyId, embassyName, staff, assignable, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pickUser, setPickUser] = useState('');
  const [pickRole, setPickRole] = useState<StaffRole>(mode === 'embassy_admin' ? 'consular_officer' : 'consular_officer');

  const roleOptions = mode === 'embassy_admin' ? (['consular_officer'] as StaffRole[]) : TENANT_ROLES;

  function run(fn: () => Promise<{ success?: boolean; error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleAssign() {
    if (!pickUser) return;
    run(async () => {
      const res = await assignStaffAction(pickUser, embassyId, pickRole);
      if (res.success) {
        setAssignOpen(false);
        setPickUser('');
      }
      return res;
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Embassy Staff — {embassyName}</h3>
        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deepest transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Assign Staff
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-navy-deep text-[10px] uppercase tracking-widest text-surface/40">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-navy-deep">
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-surface/50">
                  No staff assigned to this embassy yet.
                </td>
              </tr>
            )}
            {staff.map((s) => {
              const canEditRole = mode === 'tenant_admin' || s.role === 'consular_officer';
              return (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-white">{s.fullName ?? s.email}</p>
                    <p className="text-[10px] text-surface/40">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', ROLE_BADGE[s.role] ?? 'bg-white/5 text-surface/50')}>
                      {s.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-surface/50">
                    {new Date(s.assignedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {mode === 'tenant_admin' && canEditRole && (
                        <select
                          defaultValue={s.role}
                          disabled={isPending}
                          onChange={(e) => run(() => updateStaffRoleAction(s.userId, e.target.value as StaffRole))}
                          className="rounded border border-white/10 bg-navy px-2 py-1 text-xs text-surface/80 focus:border-gold/40 focus:outline-none"
                        >
                          {TENANT_ROLES.map((r) => (
                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => unassignStaffAction(s.userId, embassyId))}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-surface/50 transition-colors hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                        title="Unassign from embassy"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assign modal */}
      {assignOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Assign Staff to Embassy</h4>
              <button type="button" onClick={() => setAssignOpen(false)} className="text-surface/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-1.5 block text-xs font-medium text-surface/60">Staff member</label>
            <select
              value={pickUser}
              onChange={(e) => setPickUser(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none"
            >
              <option value="">— Select an unassigned staff member —</option>
              {assignable.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName ? `${u.fullName} (${u.email})` : u.email}</option>
              ))}
            </select>
            <label className="mb-1.5 block text-xs font-medium text-surface/60">Role for this embassy</label>
            <select
              value={pickRole}
              onChange={(e) => setPickRole(e.target.value as StaffRole)}
              className="mb-5 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-surface/80 focus:border-gold/40 focus:outline-none"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setAssignOpen(false)} className="rounded-md px-4 py-2 text-sm text-surface/70 hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={isPending || !pickUser}
                className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
