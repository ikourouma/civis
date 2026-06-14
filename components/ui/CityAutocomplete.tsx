'use client';

import { MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface CitySelection {
  name: string;
  state?: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
}

interface CityAutocompleteProps {
  countryCode?: string; // ISO alpha-2 to scope results
  value?: string;
  onChange: (city: CitySelection) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

interface MapboxFeature {
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: { id: string; text: string; short_code?: string }[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function CityAutocomplete({
  countryCode,
  value,
  onChange,
  placeholder = 'Search for a city...',
  required,
  id,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fallbackMode = !MAPBOX_TOKEN || apiFailed;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (fallbackMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN!,
          types: 'place',
          limit: '6',
          autocomplete: 'true',
        });
        if (countryCode) params.set('country', countryCode.toLowerCase());

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query.trim(),
        )}.json?${params.toString()}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Mapbox ${res.status}`);
        const json = (await res.json()) as { features: MapboxFeature[] };
        setResults(json.features ?? []);
      } catch {
        setApiFailed(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, countryCode, fallbackMode]);

  function regionOf(feature: MapboxFeature): string | undefined {
    return feature.context?.find((c) => c.id.startsWith('region'))?.text;
  }

  function countryOf(feature: MapboxFeature): string {
    const c = feature.context?.find((ctx) => ctx.id.startsWith('country'));
    return c?.short_code?.toUpperCase() ?? countryCode?.toUpperCase() ?? '';
  }

  function selectCity(feature: MapboxFeature) {
    const selection: CitySelection = {
      name: feature.text,
      state: regionOf(feature),
      country_code: countryOf(feature),
      longitude: feature.center?.[0],
      latitude: feature.center?.[1],
    };
    setQuery(feature.text);
    setOpen(false);
    onChange(selection);
  }

  function handleFreeText(text: string) {
    setQuery(text);
    onChange({ name: text, country_code: countryCode?.toUpperCase() ?? '' });
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex h-11 w-full items-center gap-2 rounded-lg border bg-navy px-3 transition-colors',
          open ? 'border-gold/60' : 'border-white/10',
        )}
      >
        {fallbackMode ? (
          <MapPin className="h-4 w-4 shrink-0 text-surface/40" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-surface/40" />
        )}
        <input
          id={id}
          type="text"
          required={required}
          value={query}
          onChange={(e) => {
            if (fallbackMode) {
              handleFreeText(e.target.value);
            } else {
              setQuery(e.target.value);
              setOpen(true);
            }
          }}
          onFocus={() => !fallbackMode && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder-surface/30 focus:outline-none"
          autoComplete="off"
        />
      </div>

      {fallbackMode && (
        <p className="mt-1 text-xs text-surface/40">
          City search unavailable — enter your city manually.
        </p>
      )}

      {open && !fallbackMode && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-deep shadow-xl">
          <ul className="max-h-[280px] overflow-y-auto py-1">
            {loading && <li className="px-3 py-3 text-center text-xs text-surface/40">…</li>}
            {!loading && results.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-surface/40">No cities found</li>
            )}
            {results.map((feature, i) => (
              <li key={`${feature.place_name}-${i}`}>
                <button
                  type="button"
                  onClick={() => selectCity(feature)}
                  className="flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                  <span className="min-w-0">
                    <span className="block truncate text-white">{feature.text}</span>
                    <span className="block truncate text-[11px] text-surface/40">
                      {feature.place_name}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
