'use client';

import { Printer } from 'lucide-react';

// Prints the current page (chrome is hidden via `print:hidden` + globals print CSS).
export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 transition-colors hover:border-gold/30 hover:text-gold print:hidden"
    >
      <Printer className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
