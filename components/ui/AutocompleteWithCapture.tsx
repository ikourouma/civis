'use client';

import { Check, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  searchReference,
  type ReferenceCategory,
  type ReferenceMatch,
} from '@/lib/services/reference/autocomplete.service';
import { submitSuggestion } from '@/lib/services/reference/suggestions.actions';
import { cn } from '@/lib/utils';

export interface AutocompleteSelection {
  type: 'canonical' | 'suggested';
  value: string;
  id?: string; // canonical id if existing
  suggestion_id?: string; // suggestion id if newly captured
}

interface AutocompleteWithCaptureProps {
  category: ReferenceCategory;
  value?: string;
  onChange: (selection: AutocompleteSelection) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  locale?: 'en' | 'fr';
  id?: string;
  /** Translation strings (passed by parent which has next-intl context). */
  labels?: {
    addNew?: string; // "Add new: {value}"
    confirmTitle?: string;
    confirmMessage?: string; // with {value}
    confirmAction?: string;
    cancel?: string;
    recorded?: string;
    noMatches?: string;
    minChars?: string;
  };
}

const DEFAULT_LABELS = {
  addNew: 'Add new: {value}',
  confirmTitle: 'Add new entry?',
  confirmMessage: "We don't have '{value}' in our list yet. Would you like to add it as a new entry?",
  confirmAction: 'Add new',
  cancel: 'Cancel',
  recorded:
    'Your suggestion has been recorded. A super administrator will review it for inclusion in our standard list.',
  noMatches: 'No matches found',
  minChars: 'Type at least 2 characters to search',
};

export function AutocompleteWithCapture({
  category,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  locale = 'en',
  id,
  labels,
}: AutocompleteWithCaptureProps) {
  const L = { ...DEFAULT_LABELS, ...labels };

  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState<ReferenceMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [committed, setCommitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced search (300ms, min 2 chars)
  useEffect(() => {
    if (committed) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const matches = await searchReference(category, query, locale);
      setResults(matches);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, locale, committed]);

  function selectCanonical(match: ReferenceMatch) {
    setQuery(match.value);
    setCommitted(true);
    setOpen(false);
    setRecorded(false);
    onChange({ type: 'canonical', value: match.value, id: match.id });
  }

  async function confirmSuggestion() {
    setSubmitting(true);
    const { suggestionId } = await submitSuggestion(category, query.trim(), `registration:${category}`, locale);
    setSubmitting(false);
    setConfirmOpen(false);
    setCommitted(true);
    setOpen(false);
    setRecorded(true);
    // Value is used immediately even though it is pending review.
    onChange({
      type: 'suggested',
      value: query.trim(),
      suggestion_id: suggestionId ?? undefined,
    });
  }

  const exactMatch = results.some((r) => r.value.toLowerCase() === query.trim().toLowerCase());
  const showAddNew = query.trim().length >= 2 && !exactMatch && !loading;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex h-11 w-full items-center gap-2 rounded-lg border bg-navy px-3 transition-colors',
          open ? 'border-gold/60' : 'border-white/10',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-surface/40" />
        <input
          id={id}
          type="text"
          required={required}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCommitted(false);
            setRecorded(false);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder-surface/30 focus:outline-none"
          autoComplete="off"
        />
      </div>

      {/* Helper / confirmation text */}
      {recorded ? (
        <p className="mt-1 text-xs text-success-teal">{L.recorded}</p>
      ) : (
        helperText && <p className="mt-1 text-xs text-surface/40">{helperText}</p>
      )}

      {/* Dropdown */}
      {open && !committed && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-deep shadow-xl">
          <ul className="max-h-[260px] overflow-y-auto py-1">
            {query.trim().length < 2 && (
              <li className="px-3 py-3 text-center text-xs text-surface/40">{L.minChars}</li>
            )}
            {query.trim().length >= 2 && loading && (
              <li className="px-3 py-3 text-center text-xs text-surface/40">…</li>
            )}
            {query.trim().length >= 2 &&
              !loading &&
              results.length === 0 &&
              !showAddNew && (
                <li className="px-3 py-3 text-center text-xs text-surface/40">{L.noMatches}</li>
              )}

            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => selectCanonical(r)}
                  className="group flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
                >
                  <span className="truncate">{r.value}</span>
                  <Check className="h-3.5 w-3.5 shrink-0 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}

            {showAddNew && (
              <li className="border-t border-dashed border-white/10">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="flex w-full items-center gap-2 bg-gold/[0.04] px-3 py-2.5 text-left text-sm text-gold transition-colors hover:bg-gold/10"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="truncate">{L.addNew.replace('{value}', query.trim())}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">{L.confirmTitle}</h3>
            <p className="mt-2 text-sm text-surface/60">
              {L.confirmMessage.replace('{value}', query.trim())}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={confirmSuggestion}
                disabled={submitting}
                className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? '…' : L.confirmAction}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-surface/70 transition-colors hover:text-white"
              >
                {L.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
