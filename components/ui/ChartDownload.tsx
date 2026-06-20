'use client';

import { Download } from 'lucide-react';
import { useRef, useState } from 'react';

// Wraps a chart/card; on hover shows a button that exports the container to PNG.
export function ChartDownloadWrapper({ filename, children }: { filename: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(ref.current, { backgroundColor: '#0d1b2e', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch {
      // best-effort; ignore capture failures
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="group relative">
      {children}
      <button
        type="button"
        onClick={download}
        disabled={busy}
        title="Download as PNG"
        className="chart-download-btn absolute right-3 top-3 rounded-lg bg-navy/80 p-2 text-surface/70 opacity-0 backdrop-blur-sm transition-opacity hover:text-gold group-hover:opacity-100 disabled:opacity-40 print:hidden"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
