import { ArrowRight, Clock, FileText, Folder, Users } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { CivisUser } from '@/lib/services/auth/auth.types';
import { diplomaticTitleLabel } from '@/lib/constants/diplomatic-titles';
import { getMyEmbassy } from '@/lib/services/embassies';
import { createAdminClient } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

// Embassy-scoped landing dashboard for consular officers (Mission 006-C, D12).
export async function ConsularDashboard({ user, locale }: { user: CivisUser; locale: 'en' | 'fr' }) {
  const embassy = await getMyEmbassy();
  const admin = createAdminClient();
  const embassyId = embassy?.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pending, total, approvedToday, myActivity, queue] = embassyId
    ? await Promise.all([
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('embassy_id', embassyId).eq('verification_status', 'pending_review'),
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('embassy_id', embassyId),
        admin.from('audit_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('action', 'REGISTRANT_APPROVED').gte('created_at', todayStart.toISOString()),
        admin.from('audit_logs').select('action, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        admin.from('civis_registrants').select('id, first_name, last_name, profile_completeness_score, created_at').eq('embassy_id', embassyId).eq('verification_status', 'pending_review').order('created_at', { ascending: false }).limit(5),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }, { data: [] }, { data: [] }];

  const tiles = [
    { label: 'My Pending Cases', value: pending.count ?? 0, Icon: Clock, href: '/workspace/cases' },
    { label: 'My Approved Today', value: approvedToday.count ?? 0, Icon: Folder, href: '/workspace/cases' },
    { label: 'Total Embassy Registrants', value: total.count ?? 0, Icon: Users, href: '/workspace/registry' },
    { label: 'Documents to Review', value: '—', Icon: FileText, href: '/workspace/documents' },
  ];

  const activity = (myActivity.data as { action: string; created_at: string }[]) ?? [];
  const queueRows = (queue.data as { id: string; first_name: string; last_name: string; profile_completeness_score: number; created_at: string }[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.08] to-transparent p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Consular Workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-white">
          Welcome, {user.fullName ?? user.email}
          {user.diplomaticTitle && <span className="ml-2 text-sm font-normal text-gold/70">— {diplomaticTitleLabel(user.diplomaticTitle, locale)}</span>}
        </h1>
        <p className="mt-1 text-sm text-surface/60">{embassy?.name ?? 'Your embassy'} · Consular Officer</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon, href }) => (
          <Link key={label} href={href} className="group rounded-xl border border-white/5 bg-navy-deep p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</p>
              <Icon className="h-4 w-4 text-gold/70" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <h2 className="text-sm font-semibold text-white">My Pending Queue</h2>
            <Link href="/workspace/cases" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {queueRows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-surface/40">No pending cases. Great work!</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {queueRows.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-surface/80">{r.first_name} {r.last_name}</span>
                  <span className="text-[10px] text-surface/40">{r.profile_completeness_score}% · {new Date(r.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          <div className="border-b border-white/5 px-5 py-3"><h2 className="text-sm font-semibold text-white">Recent Activity</h2></div>
          {activity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-surface/40">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm capitalize text-surface/70">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="text-[10px] text-surface/40">{new Date(a.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Process Cases', href: '/workspace/cases', Icon: Folder },
          { label: 'Search Registry', href: '/workspace/registry', Icon: Users },
          { label: 'Review Documents', href: '/workspace/documents', Icon: FileText },
        ].map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={cn('flex items-center gap-3 rounded-xl border border-white/5 bg-navy-deep p-4 transition-colors hover:border-gold/30')}>
            <Icon className="h-5 w-5 text-gold/70" />
            <span className="text-sm font-medium text-white">{label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
