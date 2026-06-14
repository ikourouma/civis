'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getAllCountries, sortAUFirst, type Country } from '@/lib/services/reference/countries.service';
import { cn } from '@/lib/utils';

interface CountrySelectorProps {
  value?: string; // controlled ISO alpha-2
  defaultValue?: string;
  onChange: (isoAlpha2: string, country: Country) => void;
  locale?: 'en' | 'fr';
  placeholder?: string;
  searchPlaceholder?: string;
  auGroupLabel?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  defaultValue,
  onChange,
  locale = 'en',
  placeholder = 'Select a country',
  searchPlaceholder = 'Search countries...',
  auGroupLabel = 'African Union Member States',
  required,
  id,
  disabled,
}: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = value ?? internalValue;

  useEffect(() => {
    let active = true;
    getAllCountries(locale).then((data) => {
      if (active) setCountries(sortAUFirst(data));
    });
    return () => {
      active = false;
    };
  }, [locale]);

  // Close on outside click / Escape
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
    if (open) {
      setQuery('');
      setHighlight(0);
      // Focus search after the panel paints
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return countries;
    const q = query.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.isoAlpha2.toLowerCase().includes(q) ||
        c.isoAlpha3.toLowerCase().includes(q),
    );
  }, [countries, query]);

  const selectedCountry = countries.find((c) => c.isoAlpha2 === selected);

  function commit(country: Country) {
    if (value === undefined) setInternalValue(country.isoAlpha2);
    onChange(country.isoAlpha2, country);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[highlight];
      if (c) commit(c);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Keep highlighted row in view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const node = list.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  // Show AU group separator: find boundary index in filtered list
  const firstNonAU = filtered.findIndex((c) => !c.isAUMember);

  return (
    <div ref={containerRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg border bg-navy px-3 text-left text-sm transition-colors',
          open ? 'border-gold/60' : 'border-white/10 hover:border-white/20',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {selectedCountry ? (
          <span className="flex items-center gap-2 truncate text-white">
            <span className="text-base leading-none">{selectedCountry.flagEmoji}</span>
            <span className="truncate">{selectedCountry.name}</span>
          </span>
        ) : (
          <span className="text-surface/40">{placeholder}</span>
        )}
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-surface/40 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-deep shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-surface/40" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-white placeholder-surface/30 focus:outline-none"
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-[320px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-surface/40">No countries found</li>
            )}
            {filtered.map((c, i) => (
              <li key={c.id}>
                {i === 0 && c.isAUMember && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gold/70">
                    {auGroupLabel}
                  </p>
                )}
                {i === firstNonAU && firstNonAU > 0 && (
                  <p className="mt-1 border-t border-white/5 px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                    All Countries
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={c.isoAlpha2 === selected}
                  data-index={i}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => commit(c)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                    i === highlight ? 'bg-white/[0.06]' : '',
                    c.isoAlpha2 === selected ? 'border-l-2 border-gold' : 'border-l-2 border-transparent',
                  )}
                >
                  <span className="text-base leading-none">{c.flagEmoji}</span>
                  <span className="flex-1 truncate text-white">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-surface/30">{c.isoAlpha2}</span>
                  {c.isoAlpha2 === selected && <Check className="h-3.5 w-3.5 text-gold" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
