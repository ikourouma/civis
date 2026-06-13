'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useInView } from 'react-intersection-observer';

interface CountUpProps {
  /** Target numeric value. */
  value: number;
  /** Rendered after the number, e.g. "%", "+", "K", "M". */
  suffix?: string;
  /** Decimal places preserved during the count (e.g. 1 for 2.4M). */
  decimals?: number;
  className?: string;
}

const DURATION_MS = 2000;

/**
 * Animates a numeric stat from 0 to its target on first viewport entry,
 * with ease-out pacing and locale-aware number formatting. Shows the final
 * value immediately when prefers-reduced-motion is active.
 */
export function CountUp({ value, suffix = '', decimals = 0, className }: CountUpProps) {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const [current, setCurrent] = React.useState(0);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    if (reduceMotion) {
      setCurrent(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, value]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(current);

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
