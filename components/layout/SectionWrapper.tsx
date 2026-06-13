import * as React from 'react';

import { cn } from '@/lib/utils';

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  /** Constrains inner content width. `narrow` suits forms and prose. */
  width?: 'default' | 'narrow';
}

/**
 * Consistent section rhythm for the public platform — 64px/96px vertical
 * padding (8-point grid, Doc 07 §6) and a centered max-width container.
 */
export function SectionWrapper({
  className,
  width = 'default',
  children,
  ...props
}: SectionWrapperProps) {
  return (
    <section className={cn('px-6 py-16 md:py-24', className)} {...props}>
      <div className={cn('mx-auto w-full', width === 'narrow' ? 'max-w-3xl' : 'max-w-6xl')}>
        {children}
      </div>
    </section>
  );
}
