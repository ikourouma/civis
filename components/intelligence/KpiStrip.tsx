'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

function CountUp({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value]);
  return (
    <>
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

export interface Kpi {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tone?: 'default' | 'up' | 'down';
}

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((k) => (
        <div key={k.label} className="rounded-md border border-white/[0.06] bg-[#111827] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{k.label}</p>
          <p
            className={cn(
              'mt-2 text-2xl font-bold tabular-nums',
              k.tone === 'up' ? 'text-emerald-400' : k.tone === 'down' ? 'text-red-400' : 'text-white',
            )}
          >
            <CountUp value={k.value} decimals={k.decimals} suffix={k.suffix} />
          </p>
        </div>
      ))}
    </div>
  );
}

export { CountUp };
