// Color math for brand palette generation.
// Ported verbatim from the EmbassyOS theme engine
// (embassy-os/lib/data/country-branding.ts) — see lib/branding/README.md.
// Pure functions, no runtime dependencies — safe in Node scripts and the browser.

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g)
    .toString(16)
    .padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`.toUpperCase();
}

/** Darken a hex color by a fraction (0–1). */
export function darken(hex: string, amount = 0.2): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
}

/** Lighten a hex color toward white by a fraction (0–1). */
export function lighten(hex: string, amount = 0.2): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount,
  );
}

/** WCAG 2.1 relative luminance (0–1). */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const lin = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** '#FFFFFF' or '#000000', whichever has ≥4.5:1 contrast on the given color. */
export function textOnColor(hex: string): string {
  return contrastRatio(hex, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#000000';
}

export interface SurfaceScale {
  surface_primary_50: string;
  surface_primary_100: string;
  surface_primary_500: string;
  surface_primary_700: string;
  surface_primary_900: string;
}

/**
 * Generate the Civis 5-step surface scale from a primary color.
 * Mapping documented in lib/branding/README.md.
 */
export function generateSurfaceScale(primary: string): SurfaceScale {
  return {
    surface_primary_50: lighten(primary, 0.92),
    surface_primary_100: lighten(primary, 0.85),
    surface_primary_500: primary,
    surface_primary_700: darken(primary, 0.25),
    surface_primary_900: darken(primary, 0.5),
  };
}
