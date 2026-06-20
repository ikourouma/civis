'use client';

import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';

interface HelpTooltipProps {
  content: string;
  learnMoreUrl?: string;
}

export function HelpTooltip({ content, learnMoreUrl }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="ml-1.5 text-surface/40 transition-colors hover:text-surface/80"
      >
        <HelpCircle className="h-4 w-4 cursor-help" />
      </button>
      {open && (
        <span className="absolute left-1/2 top-6 z-50 w-60 -translate-x-1/2 rounded-lg border border-white/10 bg-navy-deepest p-3 text-xs leading-relaxed text-surface/80 shadow-xl">
          {content}
          {learnMoreUrl && (
            <Link href={learnMoreUrl} className="mt-2 block text-gold">Learn more →</Link>
          )}
        </span>
      )}
    </span>
  );
}
