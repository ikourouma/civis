'use client';

import { CheckCircle2, Clock, Search, UserX, Users, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { RegistrantDetail } from '@/components/registrants/RegistrantDetail';
import { Link, useRouter } from '@/i18n/navigation';
import type { CivisUser } from '@/lib/services/auth/auth.types';
import type { ConsentRecord } from '@/lib/services/consent/consent.service';
import type {
  Registrant,
  RegistrantActivityEntry,
  RegistrantDocument,
  RegistrantNote,
} from '@/lib/services/registrants';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';
type Mode = 'queue' | 'search';

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
  selectedDocuments: RegistrantDocument[];
  selectedConsent: ConsentRecord | null;
  selectedNotes: RegistrantNote[];
  selectedActivity: RegistrantActivityEntry[];
  selectedEmbassyName: string | null;
  activeTab: Tab;
  mode: Mode;
  query: string;
  canSearch: boolean;
  hasEmbassy: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CasesView({
  locale,
  queue,
  total,
  selectedRegistrant,
  selectedDocuments,
  selectedConsent,
  selectedNotes,
  selectedActivity,
  selectedEmbassyName,
  activeTab,
  mode,
  query,
  canSearch,
  hasEmbassy,
}: Props) {
  const t = useTranslations('Cases');
  const td = useTranslations('registrant_detail');
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);

  function selectRegistrant(id: string) {
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (mode === 'queue') params.set('tab', activeTab);
    if (mode === 'search' && query) params.set('q', query);
    params.set('selected', id);
    router.push(`/workspace/cases?${params.toString()}`);
  }

  function switchMode(next: Mode) {
    const params = new URLSearchParams();
    params.set('mode', next);
    if (next === 'queue') params.set('tab', activeTab);
    router.push(`/workspace/cases?${params.toString()}`);
  }

  function runSearch() {
    const params = new URLSearchParams();
    params.set('mode', 'search');
    if (searchInput.trim()) params.set('q', searchInput.trim());
    router.push(`/workspace/cases?${params.toString()}`);
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
          <p className="mt-2 text-xs text-surface/50">Contact your administrator to assign you to an embassy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left panel */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-white/5 bg-navy-deep">
        <div className="border-b border-white/5 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('title')}</p>
          <h1 className="mt-1 text-lg font-bold text-white">My Queue</h1>
        </div>

        {/* Mode toggle */}
        {canSearch && (
          <div className="flex border-b border-white/5">
            <button
              type="button"
              onClick={() => switchMode('queue')}
              className={cn('flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors', mode === 'queue' ? 'border-b-2 border-gold text-gold' : 'text-surface/50 hover:text-surface/80')}
            >
              {td('search.mode_queue')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('search')}
              className={cn('flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors', mode === 'search' ? 'border-b-2 border-gold text-gold' : 'text-surface/50 hover:text-surface/80')}
            >
              {td('search.mode_search')}
            </button>
          </div>
        )}

        {mode === 'search' && canSearch ? (
          <div className="border-b border-white/5 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface/30" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder={td('search.placeholder')}
                className="w-full rounded-lg border border-white/10 bg-navy py-1.5 pl-8 pr-3 text-sm text-white placeholder-surface/30 focus:border-gold/40 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex border-b border-white/5">
            {TABS.map(({ key, label, Icon }) => (
              <Link
                key={key}
                href={`/workspace/cases?mode=queue&tab=${key}`}
                className={cn('flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors', activeTab === key ? 'border-b-2 border-gold text-gold' : 'text-surface/50 hover:text-surface/80')}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-emerald-400/30" />
              <p className="text-xs text-surface/40">
                {mode === 'search' ? td('search.no_results') : 'No registrants in this queue.'}
              </p>
            </div>
          ) : (
            queue.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRegistrant(r.id)}
                className={cn('w-full border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5', selectedRegistrant?.id === r.id && 'bg-gold/5')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{r.firstName} {r.lastName}</p>
                    <p className="mt-0.5 text-[10px] text-surface/50">{r.nationality} · {r.countryOfResidence}</p>
                  </div>
                  <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', STATUS_BADGE[r.verificationStatus] ?? 'bg-white/5 text-surface/50')}>
                    {STATUS_LABEL[r.verificationStatus] ?? r.verificationStatus}
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold/60" style={{ width: `${r.profileCompletenessScore}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-surface/40">Registered {formatDate(r.createdAt)}</p>
              </button>
            ))
          )}
        </div>

        {total > queue.length && (
          <div className="border-t border-white/5 px-4 py-3 text-center text-[10px] text-surface/40">
            Showing {queue.length} of {total} — refine with {mode === 'search' ? 'search' : 'filters'}
          </div>
        )}
      </aside>

      {/* Right panel */}
      <main className="flex-1 overflow-y-auto p-8">
        {!selectedRegistrant ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto mb-4 h-10 w-10 text-surface/20" />
              <p className="text-sm text-surface/40">Select a registrant to review their profile</p>
            </div>
          </div>
        ) : (
          <RegistrantDetail
            locale={locale}
            registrant={selectedRegistrant}
            embassyName={selectedEmbassyName}
            documents={selectedDocuments}
            consent={selectedConsent}
            notes={selectedNotes}
            activity={selectedActivity}
            variant="panel"
          />
        )}
      </main>
    </div>
  );
}
