'use client';

import { AsYouType, getCountryCallingCode, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getAllCountries, sortAUFirst, type Country } from '@/lib/services/reference/countries.service';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value?: string; // E.164 (controlled)
  defaultCountry?: string; // ISO alpha-2; falls back to US
  onChange: (e164: string, isValid: boolean) => void;
  locale?: 'en' | 'fr';
  helperText?: string;
  invalidMessage?: string; // template with {country}
  searchPlaceholder?: string;
  required?: boolean;
  id?: string;
}

export function PhoneInput({
  value,
  defaultCountry = 'US',
  onChange,
  locale = 'en',
  helperText = 'Enter your phone number including area code',
  invalidMessage = 'Invalid phone number for {country}',
  searchPlaceholder = 'Search...',
  required,
  id,
}: PhoneInputProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState<string>(defaultCountry.toUpperCase());
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getAllCountries(locale).then((data) => {
      if (active) setCountries(sortAUFirst(data));
    });
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    setCountry(defaultCountry.toUpperCase());
  }, [defaultCountry]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedCountry = countries.find((c) => c.isoAlpha2 === country);

  let callingCode = '';
  try {
    callingCode = `+${getCountryCallingCode(country as CountryCode)}`;
  } catch {
    callingCode = '';
  }

  function emit(nextNational: string, nextCountry: string) {
    const formatter = new AsYouType(nextCountry as CountryCode);
    const formatted = formatter.input(nextNational);
    setNational(formatted);

    const full = `${(() => {
      try {
        return `+${getCountryCallingCode(nextCountry as CountryCode)}`;
      } catch {
        return '';
      }
    })()}${nextNational.replace(/\D/g, '')}`;

    let valid = false;
    try {
      valid = isValidPhoneNumber(full, nextCountry as CountryCode);
    } catch {
      valid = false;
    }
    onChange(full, valid);
  }

  function selectCountry(c: Country) {
    setCountry(c.isoAlpha2);
    setOpen(false);
    setQuery('');
    emit(national, c.isoAlpha2);
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return countries;
    const q = query.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.isoAlpha2.toLowerCase().includes(q) || c.phoneCode.includes(q),
    );
  }, [countries, query]);

  // Validity for inline error
  const isValid = useMemo(() => {
    if (!national.trim()) return true; // empty = no error (required handled elsewhere)
    const digits = national.replace(/\D/g, '');
    if (!callingCode) return false;
    try {
      return isValidPhoneNumber(`${callingCode}${digits}`, country as CountryCode);
    } catch {
      return false;
    }
  }, [national, callingCode, country]);

  const showError = touched && national.trim().length > 0 && !isValid;

  return (
    <div ref={containerRef}>
      <div
        className={cn(
          'flex h-11 w-full items-stretch overflow-hidden rounded-lg border bg-navy transition-colors',
          showError ? 'border-red-400/50' : 'border-white/10 focus-within:border-gold/60',
        )}
      >
        {/* Country code selector */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Select country code"
          className="flex shrink-0 items-center gap-1.5 border-r border-white/10 px-3 text-sm text-white transition-colors hover:bg-white/[0.04]"
        >
          <span className="text-base leading-none">{selectedCountry?.flagEmoji ?? '🏳️'}</span>
          <span className="text-surface/70">{callingCode}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-surface/40 transition-transform', open && 'rotate-180')} />
        </button>

        {/* National number */}
        <input
          id={id}
          type="tel"
          inputMode="tel"
          required={required}
          value={national}
          onChange={(e) => emit(e.target.value, country)}
          onBlur={() => setTouched(true)}
          placeholder="803 123 4567"
          className="w-full bg-transparent px-3 text-sm text-white placeholder-surface/30 focus:outline-none"
        />
      </div>

      {/* Helper / error text */}
      {showError ? (
        <p className="mt-1 text-xs text-red-400">
          {invalidMessage.replace('{country}', selectedCountry?.name ?? country)}
        </p>
      ) : (
        helperText && <p className="mt-1 text-xs text-surface/40">{helperText}</p>
      )}

      {/* Country dropdown */}
      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-deep shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-surface/40" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-white placeholder-surface/30 focus:outline-none"
              />
            </div>
            <ul className="max-h-[280px] overflow-y-auto py-1">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]',
                      c.isoAlpha2 === country ? 'border-l-2 border-gold' : 'border-l-2 border-transparent',
                    )}
                  >
                    <span className="text-base leading-none">{c.flagEmoji}</span>
                    <span className="flex-1 truncate text-white">{c.name}</span>
                    <span className="text-xs text-surface/40">{c.phoneCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
