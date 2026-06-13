'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * The single hover animation pattern for all cards (Mission 001-A §1.4):
 * lift, deepened shadow, gold left border, and a gold-tint icon glow via
 * the `group` class — pair icon wrappers with
 * `motion-safe:group-hover:bg-gold/10`. All hover states are disabled
 * when prefers-reduced-motion is active.
 */
export function AnimatedCard({ children, className }: AnimatedCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'group h-full cursor-pointer rounded-lg border border-l-4 border-l-transparent bg-card text-card-foreground shadow-sm',
        className,
      )}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
              borderLeftColor: '#C9A84C',
            }
      }
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
