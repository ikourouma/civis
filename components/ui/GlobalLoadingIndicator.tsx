// Civis "Sovereign Pulse" — full-screen page-transition overlay.
// Mounted via app/[locale]/loading.tsx, so it shows automatically on every
// route transition under the [locale] segment. CSS keyframes in globals.css.
export function GlobalLoadingIndicator({
  tagline = 'Diaspora Intelligence Terminal',
}: {
  tagline?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="civis-pulse-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-navy-deepest text-white"
    >
      {/* Centered radial backdrop — subtle gold-tinted vignette from the dot */}
      <div className="civis-pulse-vignette" aria-hidden="true" />

      {/* Top-left "live" pill */}
      <div className="absolute left-6 top-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-surface/50">
        <span className="civis-pulse-live-dot" aria-hidden="true" />
        Live
      </div>

      {/* Hero stack */}
      <div className="relative flex flex-col items-center">
        {/* The Sovereign Dot — core + three breathing halos + slow orbit ring */}
        <div className="civis-pulse-dot-wrap" aria-hidden="true">
          <span className="civis-pulse-halo civis-pulse-halo--outer" />
          <span className="civis-pulse-halo civis-pulse-halo--mid" />
          <span className="civis-pulse-halo civis-pulse-halo--inner" />
          <span className="civis-pulse-orbit" />
          <span className="civis-pulse-core" />
        </div>

        {/* Wordmark */}
        <p className="mt-10 text-4xl font-bold tracking-[0.35em] text-white">CIVIS</p>

        {/* Rule + tagline */}
        <span className="mt-5 block h-px w-6 bg-gold/60" aria-hidden="true" />
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/70">
          {tagline}
        </p>
      </div>

      {/* Peripheral progress sweep at the bottom */}
      <div className="civis-pulse-progress" aria-hidden="true" />
    </div>
  );
}
