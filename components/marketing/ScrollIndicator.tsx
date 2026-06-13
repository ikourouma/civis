'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/**
 * Desktop-only bouncing scroll hint at the bottom of the hero —
 * fades out once the user scrolls past the top of the page.
 */
export function ScrollIndicator() {
  const t = useTranslations('Home.hero.panel');
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-x-0 bottom-8 hidden flex-col items-center transition-opacity duration-300 lg:flex',
        scrolled ? 'opacity-0' : 'opacity-100',
      )}
    >
      <ChevronDown className="h-4 w-4 animate-bounce text-white/40" />
      <span className="mt-1 text-xs text-white/30">{t('scrollLabel')}</span>
    </div>
  );
}
