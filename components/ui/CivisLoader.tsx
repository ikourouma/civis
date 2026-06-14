// CivisLoader — the brand-mark loading spinner.
// Pure SVG + CSS animation (see globals.css). Respects prefers-reduced-motion.
import { cn } from '@/lib/utils';

interface CivisLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const DIMENSIONS = { sm: 24, md: 48, lg: 96, xl: 128 } as const;

export function CivisLoader({ size = 'md', label, fullScreen = false, className }: CivisLoaderProps) {
  const dimensions = DIMENSIONS[size];

  const loader = (
    <div
      className={cn('civis-loader', className)}
      style={{ width: dimensions, height: dimensions }}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <svg viewBox="0 0 100 100" className="civis-loader-ring" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="2.5"
          strokeDasharray="70 213"
          strokeLinecap="round"
        />
      </svg>
      <div className="civis-loader-mark" aria-hidden="true">
        <span className="civis-loader-c">C</span>
        <span className="civis-loader-dot">.</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-deepest">
        {loader}
        {label && <p className="mt-6 text-sm tracking-wide text-surface/60">{label}</p>}
      </div>
    );
  }

  return loader;
}
