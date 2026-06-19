'use client';

import type { LucideIcon } from 'lucide-react';

import { Link } from '@/i18n/navigation';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// Standard empty state for any data view.
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-8 w-8 text-gold" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-surface/60">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
