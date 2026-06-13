'use client';

import { CheckCircle2, Clock, UserX, Users, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { startTransition, useState } from 'react';

import { Link } from '@/i18n/navigation';
import type { CivisUser } from '@/lib/services/auth/auth.types';
import type { Registrant } from '@/lib/services/registrants';
import { cn } from '@/lib/utils';
import { approveRegistrantAction, rejectRegistrantAction } from '@/app/[locale]/workspace/cases/actions';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-gold/15 text-gold',
  verified: 'bg-emerald-400/15 text-emerald-400',
  rejected: 'bg-red-400/15 text-red-400',
  unverified: 'bg-white/5 text-surface/50',
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

const TABS: { key: Tab; label: string; Icon: typeof Clock }[] = [
  { key: 'all', label: 'All', Icon: Users },
  { key: 'pending', label: 'Pending', Icon: Clock },
  { key: 'approved', label: 'Approved', Icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', Icon: XCircle },
];

interface Props {
  user: CivisUser;
  locale: string;
  queue: Registrant[];
  total: number;
  selectedRegistrant: Registrant | null;
  activeTab: Tab;
  hasEmbassy: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CasesView({
  user,
  locale,
  queue,
  total,
  selectedRegistrant,
  activeTab,
  hasEmbassy,
}: Props) {
  const t = useTranslations('Cases');
  const router = useRouter();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function selectRegistrant(id: string) {
    router.push(`?tab=${activeTab}&selected=${id}`);
  }

  function handleApprove() {
    if (!selectedRegistrant) return;
    setPending(true);
    setActionError(null);
    startTransition(async () => {
      const { error } = await approveRegistrantAction(selectedRegistrant.id);
      setPending(false);
      if (error) {
        setActionError(error);
      } else {
        router.push(`?tab=${activeTab}`);
      }
    });
  }

  function handleReject() {
    if (!selectedRegistrant || !rejectReason.trim()) return;
    setPending(true);
    setActionError(null);
    startTransition(async () => {
      const { error } = await rejectRegistrantAction(selectedRegistrant.id, rejectReason);
      setPending(false);
      if (error) {
        setActionError(error);
      } else {
        setShowRejectForm(false);
        setRejectReason('');
        router.push(`?tab=${activeTab}`);
      }
    });
  }

  if (!hasEmbassy) {
    return (
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('title')}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">My Queue</h1>
        </header>
        <div className="rounded-xl border border-white/5 bg-navy-deep p-10 text-center">
          <UserX className="mx-auto mb-4 h-10 w-10 text-surface/30" />
          <p className="text-sm font-medium text-white">No embassy assigned</p>
          <p className="mt-2 text-xs text-surface/50">
            Contact your administrator to assign you to an embassy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left panel — queue */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-white/5 bg-navy-deep">
        {/* Header */}
        <div className="border-b border-white/5 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('title')}</p>
          <h1 className="mt-1 text-lg font-bold text-white">My Queue</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-white/5">
          {TABS.map(({ key, label, Icon }) => (
            <Link
              key={key}
              href={`?tab=${key}`}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                activeTab === key
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-surface/50 hover:text-surface/80',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-emerald-400/30" />
              <p className="text-xs text-surface/40">No registrants in this queue.</p>
            </div>
          ) : (
            queue.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRegistrant(r.id)}
                className={cn(
                  'w-full border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5',
                  selectedRegistrant?.id === r.id && 'bg-gold/5',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-surface/50">
                      {r.nationality} · {r.countryOfResidence}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                      STATUS_BADGE[r.verificationStatus] ?? 'bg-white/5 text-surface/50',
                    )}
                  >
                    {STATUS_LABEL[r.verificationStatus] ?? r.verificationStatus}
                  </span>
                </div>

                {/* Completeness bar */}
                <div className="mt-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gold/60"
                      style={{ width: `${r.profileCompletenessScore}%` }}
                    />
                  </div>
                </div>

                <p className="mt-1 text-[10px] text-surface/40">
                  Submitted {formatDate(r.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Pagination hint */}
        {total > 25 && (
          <div className="border-t border-white/5 px-4 py-3 text-center text-[10px] text-surface/40">
            Showing 25 of {total} — use filters to narrow
          </div>
        )}
      </aside>

      {/* Right panel — detail */}
      <main className="flex-1 overflow-y-auto p-8">
        {!selectedRegistrant ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto mb-4 h-10 w-10 text-surface/20" />
              <p className="text-sm text-surface/40">Select a registrant to review their profile</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Name + status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedRegistrant.firstName}{' '}
                  {selectedRegistrant.middleName ? `${selectedRegistrant.middleName} ` : ''}
                  {selectedRegistrant.lastName}
                </h2>
                {selectedRegistrant.preferredName && (
                  <p className="text-sm text-surface/50">
                    Preferred: {selectedRegistrant.preferredName}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    'rounded px-2 py-1 text-xs font-semibold capitalize',
                    STATUS_BADGE[selectedRegistrant.verificationStatus] ?? 'bg-white/5 text-surface/50',
                  )}
                >
                  {STATUS_LABEL[selectedRegistrant.verificationStatus]}
                </span>
                <p className="text-[10px] text-surface/40">
                  {selectedRegistrant.profileCompletenessScore}% complete
                </p>
              </div>
            </div>

            {/* Completeness bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${selectedRegistrant.profileCompletenessScore}%` }}
              />
            </div>

            {/* Profile grid */}
            <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
              <div className="border-b border-white/5 px-6 py-4">
                <h3 className="text-sm font-semibold text-white">Personal Information</h3>
              </div>
              <dl className="grid grid-cols-2 gap-4 p-6">
                {[
                  ['Date of Birth', selectedRegistrant.dateOfBirth],
                  ['Gender', selectedRegistrant.gender],
                  ['Nationality', selectedRegistrant.nationality],
                  ['Dual Nationality', selectedRegistrant.dualNationality],
                  ['Country of Birth', selectedRegistrant.countryOfBirth],
                  ['City of Birth', selectedRegistrant.cityOfBirth],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm text-surface/80">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </section>

            <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
              <div className="border-b border-white/5 px-6 py-4">
                <h3 className="text-sm font-semibold text-white">Contact & Residence</h3>
              </div>
              <dl className="grid grid-cols-2 gap-4 p-6">
                {[
                  ['Email', selectedRegistrant.email],
                  ['Phone', selectedRegistrant.phonePrimary],
                  ['Country of Residence', selectedRegistrant.countryOfResidence],
                  ['City', selectedRegistrant.cityOfResidence],
                  ['Years Abroad', selectedRegistrant.yearsAbroad?.toString()],
                  ['Entry Year', selectedRegistrant.entryYear?.toString()],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm text-surface/80">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </section>

            <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
              <div className="border-b border-white/5 px-6 py-4">
                <h3 className="text-sm font-semibold text-white">Professional Profile</h3>
              </div>
              <dl className="grid grid-cols-2 gap-4 p-6">
                {[
                  ['Occupation', selectedRegistrant.occupation],
                  ['Employer', selectedRegistrant.employer],
                  ['Industry', selectedRegistrant.industrySector],
                  ['Education', selectedRegistrant.educationLevel],
                  ['Field of Study', selectedRegistrant.fieldOfStudy],
                  ['Generation', selectedRegistrant.generation],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm text-surface/80">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
              <div className="flex gap-6 border-t border-white/5 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      selectedRegistrant.returnInterest ? 'bg-emerald-400' : 'bg-white/20',
                    )}
                  />
                  <span className="text-xs text-surface/60">Return interest</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      selectedRegistrant.investmentInterest ? 'bg-gold' : 'bg-white/20',
                    )}
                  />
                  <span className="text-xs text-surface/60">Investment interest</span>
                </div>
              </div>
            </section>

            {/* Consent status */}
            <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
              <div className="border-b border-white/5 px-6 py-4">
                <h3 className="text-sm font-semibold text-white">Consent & Compliance</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      selectedRegistrant.consentCaptured
                        ? 'bg-emerald-400/15'
                        : 'bg-red-400/15',
                    )}
                  >
                    {selectedRegistrant.consentCaptured ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedRegistrant.consentCaptured ? 'Consent captured' : 'No consent on file'}
                    </p>
                    {selectedRegistrant.consentCapturedAt && (
                      <p className="text-xs text-surface/50">
                        {formatDate(selectedRegistrant.consentCapturedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Rejection reason (if rejected) */}
            {selectedRegistrant.rejectionReason && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
                  Rejection Reason
                </p>
                <p className="mt-1 text-sm text-surface/80">{selectedRegistrant.rejectionReason}</p>
              </div>
            )}

            {/* Error */}
            {actionError && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
                <p className="text-sm text-red-400">{actionError}</p>
              </div>
            )}

            {/* Action buttons — only shown for pending */}
            {selectedRegistrant.verificationStatus === 'pending_review' && (
              <div className="space-y-3">
                {!showRejectForm ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={pending}
                      className="flex-1 rounded-lg bg-emerald-400/10 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
                    >
                      {pending ? 'Processing…' : 'Approve Registration'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      disabled={pending}
                      className="flex-1 rounded-lg bg-red-400/10 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-sm font-semibold text-red-400">Reason for rejection</p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Provide a clear reason…"
                      className="w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-white placeholder-surface/30 focus:border-red-400/50 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={pending || !rejectReason.trim()}
                        className="flex-1 rounded-lg bg-red-400/15 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-400/25 disabled:opacity-50"
                      >
                        {pending ? 'Submitting…' : 'Confirm Rejection'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/60 hover:text-surface/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Metadata footer */}
            <p className="text-center text-[10px] text-surface/30">
              ID: {selectedRegistrant.id} · Submitted {formatDate(selectedRegistrant.createdAt)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
