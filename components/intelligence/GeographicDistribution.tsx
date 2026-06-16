'use client';

import { X } from 'lucide-react';
import { useState, useTransition } from 'react';

import { getCountryCitiesAction } from '@/app/[locale]/intelligence/dashboard/actions';
import type { CountryDistribution } from '@/lib/services/analytics';
import { CHART_COLORS } from '@/lib/charts/chart-config';

interface Props {
  data: CountryDistribution[];
  limit?: number;
  drillDown?: boolean;
}

export function GeographicDistribution({ data, limit = 10, drillDown = true }: Props) {
  const top = data.slice(0, limit);
  const max = Math.max(1, ...top.map((d) => d.count));
  const [selected, setSelected] = useState<CountryDistribution | null>(null);
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  function openCountry(c: CountryDistribution) {
    if (!drillDown) return;
    setSelected(c);
    setCities([]);
    startTransition(async () => {
      const result = await getCountryCitiesAction(c.countryName);
      setCities(result.map((r) => ({ city: r.city, count: r.count })));
    });
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {top.map((c) => (
          <li key={c.countryName}>
            <button
              type="button"
              onClick={() => openCountry(c)}
              disabled={!drillDown}
              className="group flex w-full items-center gap-3 text-left"
            >
              <span className="w-6 text-base leading-none">{c.flagEmoji}</span>
              <span className="w-28 shrink-0 truncate text-xs text-white/80">{c.countryName}</span>
              <span className="relative h-3 flex-1 overflow-hidden rounded-sm bg-white/[0.04]">
                <span
                  className="absolute inset-y-0 left-0 rounded-sm transition-all group-hover:opacity-90"
                  style={{ width: `${(c.count / max) * 100}%`, backgroundColor: CHART_COLORS.primary }}
                />
              </span>
              <span className="w-16 text-right text-xs tabular-nums text-white/70">
                {c.count} <span className="text-white/30">({c.percentage}%)</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div
            className="h-full w-full max-w-sm overflow-y-auto border-l border-white/10 bg-[#0A1628] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-2xl">{selected.flagEmoji}</p>
                <h3 className="mt-1 text-lg font-bold text-white">{selected.countryName}</h3>
                <p className="text-xs text-white/50">{selected.count} registrants · {selected.percentage}%</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gold/70">Cities</p>
            {isPending ? (
              <p className="text-sm text-white/40">…</p>
            ) : cities.length === 0 ? (
              <p className="text-sm text-white/40">No city data.</p>
            ) : (
              <ul className="space-y-2">
                {cities.map((c) => {
                  const cmax = Math.max(1, ...cities.map((x) => x.count));
                  return (
                    <li key={c.city} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-xs text-white/80">{c.city}</span>
                      <span className="relative h-2.5 flex-1 overflow-hidden rounded-sm bg-white/[0.04]">
                        <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${(c.count / cmax) * 100}%`, backgroundColor: CHART_COLORS.accent1 }} />
                      </span>
                      <span className="w-8 text-right text-xs tabular-nums text-white/60">{c.count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
