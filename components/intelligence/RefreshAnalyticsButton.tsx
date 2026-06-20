'use client';

import { RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { useToast } from '@/components/ui/Toast';
import { refreshAnalyticsCacheAction } from '@/lib/services/analytics/cache.actions';

export function RefreshAnalyticsButton({ lastUpdated }: { lastUpdated?: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const res = await refreshAnalyticsCacheAction();
      if (res.success) {
        toast({ type: 'success', title: 'Dashboard data refreshed' });
        router.refresh();
      } else {
        toast({ type: 'error', title: 'Refresh failed', description: res.error });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 print:hidden">
      {lastUpdated && (
        <span className="text-[10px] text-surface/40">
          Last updated: {new Date(lastUpdated).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      )}
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 transition-colors hover:border-gold/30 hover:text-gold disabled:opacity-50"
      >
        <RotateCw className={isPending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} /> Refresh
      </button>
    </div>
  );
}
