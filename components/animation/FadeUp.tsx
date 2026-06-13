'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface FadeUpProps {
  children: React.ReactNode;
  /** Delay in milliseconds — used for stagger control. */
  delay?: number;
  className?: string;
}

/**
 * Fade-up reveal triggered once when the element enters the viewport.
 * Renders without animation when prefers-reduced-motion is active.
 */
export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
