import { type LucideIcon } from 'lucide-react';

import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

// Shared placeholder for portal sections that arrive in later missions.
export function PortalPlaceholder({
  locale,
  eyebrow,
  title,
  body,
  Icon,
}: {
  locale: string;
  eyebrow: string;
  title: string;
  body: string;
  Icon: LucideIcon;
}) {
  return (
    <WorkspaceShell locale={locale}>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-navy-deep py-16 text-center">
          <Icon className="mb-4 h-10 w-10 text-surface/20" />
          <p className="max-w-md text-sm text-surface/50">{body}</p>
        </div>
      </div>
    </WorkspaceShell>
  );
}
