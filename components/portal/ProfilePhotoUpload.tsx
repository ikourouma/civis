'use client';

import { Camera, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

import { uploadProfilePhoto } from '@/lib/services/documents/document.actions';
import { cn } from '@/lib/utils';

// Center-square crop to a 512×512 canvas (no external cropper dependency).
async function cropToSquare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 512, 512);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png', 0.92));
}

export function ProfilePhotoUpload({
  initialUrl,
  helper,
}: {
  initialUrl?: string;
  helper?: string;
}) {
  const t = useTranslations('registration.phase2');
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    try {
      const blob = await cropToSquare(file);
      setPendingBlob(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError('Could not process this image.');
    }
  }

  function save() {
    if (!pendingBlob) return;
    setError(null);
    const fd = new FormData();
    fd.set('file', new File([pendingBlob], 'photo.png', { type: 'image/png' }));
    startTransition(async () => {
      const { signedUrl, error: err } = await uploadProfilePhoto(fd);
      if (err) setError(err);
      else {
        setPendingBlob(null);
        if (signedUrl) setPreview(signedUrl);
      }
    });
  }

  function cancel() {
    setPendingBlob(null);
    setPreview(initialUrl ?? null);
    setError(null);
  }

  return (
    <div className="flex items-start gap-5">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-gold/50 bg-navy">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-surface/30">
            <Camera className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {helper && <p className="text-xs text-surface/40">{helper}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />

        {pendingBlob ? (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isPending ? '…' : t('photo_save')}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              {t('photo_cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs transition-colors hover:border-gold/30 hover:text-gold',
              preview ? 'text-surface/60' : 'text-surface/70',
            )}
          >
            <Camera className="h-3.5 w-3.5" />
            {preview ? t('photo_change') : t('photo_upload')}
          </button>
        )}

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
