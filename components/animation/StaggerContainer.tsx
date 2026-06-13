'use client';

import * as React from 'react';

import { FadeUp } from './FadeUp';

interface StaggerContainerProps {
  children: React.ReactNode;
  /** Delay increment between children, in milliseconds. */
  staggerDelay?: number;
  className?: string;
}

/**
 * Wraps each child in a FadeUp with an incrementing delay, producing a
 * cascade reveal. Used for card grids, feature lists, and stat tiles —
 * apply grid/flex classes via className; children become the grid items.
 */
export function StaggerContainer({
  children,
  staggerDelay = 100,
  className,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeUp delay={index * staggerDelay}>{child}</FadeUp>
      ))}
    </div>
  );
}
