'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

import { ButtonLoader } from '@/components/ui/ButtonLoader';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  requireTypedConfirmation?: string; // If set, the user must type this to enable confirm.
  isLoading?: boolean;
}

const CONFIRM_BTN: Record<string, string> = {
  default: 'bg-gold text-navy-deepest hover:opacity-90',
  warning: 'bg-amber-400 text-navy-deepest hover:opacity-90',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  requireTypedConfirmation,
  isLoading,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  if (!open) return null;

  const typedOk = !requireTypedConfirmation || typed === requireTypedConfirmation;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-deep p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {variant !== 'default' && (
              <AlertTriangle className={cn('h-5 w-5', variant === 'danger' ? 'text-red-400' : 'text-amber-400')} />
            )}
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button type="button" onClick={onCancel} className="text-surface/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-surface/70">{description}</p>

        {requireTypedConfirmation && (
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Type "${requireTypedConfirmation}" to confirm`}
            className="mt-4 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none"
          />
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/70 hover:text-white">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!typedOk || isLoading}
            className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40', CONFIRM_BTN[variant])}
          >
            {isLoading && <ButtonLoader />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
