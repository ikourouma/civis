'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Globe, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CountUp } from '@/components/animation/CountUp';
import { cn } from '@/lib/utils';

export interface CarouselSlide {
  id: string;
  headline: string;
  subtitle: string | null;
}

interface Props {
  slides: CarouselSlide[];
  registrantCount: number;
  primary: string;
  countLabel: string; // "{n}+ citizens already registered" — {n} replaced
}

const ROTATE_MS = 6000;
const SLIDE_ICONS = [Globe, BarChart3, ShieldCheck];

export function PortalCarousel({ slides, registrantCount, primary, countLabel }: Props) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;
  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  // Auto-rotation (disabled when reduced-motion, paused, or single slide).
  useEffect(() => {
    if (reduce || paused || count <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [reduce, paused, count]);

  const showCount = registrantCount >= 50;
  const active = slides[index] ?? slides[0];
  const Icon = SLIDE_ICONS[index % SLIDE_ICONS.length]!;

  return (
    <div
      className="relative w-full max-w-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Social proof counter */}
      {showCount && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-surface/70">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} aria-hidden="true" />
          <CountUp value={registrantCount} suffix="+" className="font-semibold text-white" />
          <span>{countLabel}</span>
        </p>
      )}

      {/* Decorative quote mark */}
      <span aria-hidden="true" className="block font-serif text-6xl leading-none" style={{ color: primary }}>&ldquo;</span>

      {/* Slides */}
      <div className="relative min-h-[180px]" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={active?.id ?? index}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <span className="sr-only">Slide {index + 1} of {count}: </span>
            <motion.div
              initial={reduce ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Icon className="mb-4 h-7 w-7" style={{ color: primary }} aria-hidden="true" />
            </motion.div>
            <h3 className="text-xl font-semibold leading-snug text-white lg:text-2xl">{active?.headline}</h3>
            {active?.subtitle && <p className="mt-3 text-sm leading-relaxed text-surface/60">{active.subtitle}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + progress */}
      {count > 1 && (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={cn('h-2 rounded-full transition-all', i === index ? 'w-6' : 'w-2 bg-white/30 hover:bg-white/50')}
                style={i === index ? { backgroundColor: primary } : undefined}
              />
            ))}
          </div>
          {/* Thin progress bar that fills over the rotation interval */}
          {!reduce && (
            <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                key={index + (paused ? '-paused' : '')}
                className="h-full"
                style={{ backgroundColor: primary }}
                initial={{ width: '0%' }}
                animate={{ width: paused ? '0%' : '100%' }}
                transition={{ duration: paused ? 0 : ROTATE_MS / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
