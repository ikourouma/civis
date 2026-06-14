# Civis Country Branding System

## Architectural Lineage

This branding system is derived from the **Bridge55 country theme architecture**
(reference: `bridge55/packages/shared/css/country-themes.css`) and the
**EmbassyOS theme engine** (reference: `embassy-os/lib/theme-engine.ts` and
`embassy-os/lib/data/country-branding.ts`). Bridge55 contributed the proven
CSS-custom-property token structure and the flag-derived palette catalogue;
EmbassyOS contributed the government-context refinements — programmatic
darken/lighten generation and WCAG luminance-based text-color selection.

Both have been adapted for Civis's **sovereign-intelligence** context: the
tourism aesthetic (bright gradients, consumer buttons) is replaced with an
institutional government tone (restrained palettes, navy/gold base neutrals,
seal-forward lockups), and a **deployment-tier** dimension is added that
Bridge55 and EmbassyOS do not have (Cloud / Government / Sovereign co-branding).

## Bridge55 Token Structure Observed

`country-themes.css` defines, per `[data-country="xx"]` selector:

| Bridge55 token        | Meaning                                            |
| --------------------- | -------------------------------------------------- |
| `--primary`           | Main flag color (e.g. CI orange `#FF8C00`)         |
| `--primary-dark`      | Hover/active shade of primary                      |
| `--primary-light`     | Very light tint of primary (≈95% lightness)        |
| `--secondary`         | Second flag color                                  |
| `--accent`            | Third flag color (often white or gold)             |
| `--bridge-gradient`   | `linear-gradient(135deg, primary → secondary)`     |
| base neutrals (`:root` only) | `--navy-dark`, `--navy-card`, `--text-primary/secondary/tertiary`, `--bg-light`, `--border-color` |

Countries currently themed in Bridge55: **MA, EG, DZ, TN, NG, GH, CI, SN, CM,
KE, TZ, UG, RW, ET, ZA, ZM, ZW, BW** (18). **Liberia (LR) is not present** — it
is generated for Civis from the Liberian flag colors using the same methodology.
Bridge55 also has **no per-country typography, shadow, or radius tokens** (those
are shared), and **no light/dark mode variants** (a single palette with shared
dark surface neutrals).

## EmbassyOS Brand Generation Methodology

`embassy-os/lib/data/country-branding.ts` is the authoritative palette catalogue
(`COUNTRY_PALETTES`, keyed by lowercase ISO alpha-2) and exposes the color math
that Civis reuses verbatim in `lib/branding/colors.ts`:

- `darken(hex, amount)` → multiply each RGB channel by `(1 - amount)`
- `lighten(hex, amount)` → `channel + (255 - channel) * amount`
- `luminance(hex)` → WCAG 2.1 relative luminance
- `contrastRatio(a, b)` and `textOnColor(hex)` → pick `#FFFFFF`/`#000000` for ≥4.5:1
- `generatePaletteFromPrimary(primary)` → derive a full palette from one color

`theme-engine.ts` stores resolved colors as space-separated **RGB triples** and
injects them via a `style` attribute server-side, with a priority chain of
*mission overrides → country branding → system fallback*. Civis keeps the
simpler **hex-in-`:root`** model (applied client-side by `BrandProvider`) per the
mission spec, but adopts the same priority idea (tenant brand → default brand).

### Bridge55 ↔ EmbassyOS agreement (verification)

The CI and GH palettes are identical across both sources, confirming canonical values:

- **CI** — primary `#FF8C00`, primaryDark `#E67300`, secondary `#00954A`, accent `#FFFFFF`
- **GH** — primary `#EF3340`, primaryDark `#CE1126`, secondary `#FCD116`, accent `#006B3F`

## Civis Surface-Variant Generation

Bridge55 only ships `--primary-light` / `--primary-dark`. Civis needs a 5-step
surface scale (`surface_primary_50…900`). These are computed from `brand_primary`
using the EmbassyOS math (`lib/branding/colors.ts`):

| Civis field           | Derivation                |
| --------------------- | ------------------------- |
| `surface_primary_50`  | `lighten(primary, 0.92)`  |
| `surface_primary_100` | `lighten(primary, 0.85)`  |
| `surface_primary_500` | `primary` (unchanged)     |
| `surface_primary_700` | `darken(primary, 0.25)`   |
| `surface_primary_900` | `darken(primary, 0.50)`   |

## Civis-Specific Adaptations

1. **Token namespace** — `--civis-brand-*` and `--civis-surface-*` (not Bridge55's
   bare `--primary`) to avoid collisions with the existing shadcn token layer.
2. **Institutional neutrals** — `brand_neutral_dark` defaults to Civis navy
   `#0D1B2E`, `brand_neutral_light` to `#EAF2FA`; gold `#C9A84C` remains the
   platform accent, never a fill.
3. **Seal-forward identity** — government deployments lead with the national
   coat of arms / seal, not a wordmark; Liberia ships its real coat of arms.
4. **Persistence** — brands live in `civis_country_branding` (DB), not static
   CSS, so they are tenant-assignable and super-admin-manageable at runtime.
5. **Deployment tiers** — a dimension absent from Bridge55/EmbassyOS (below).

## Tier-Dependent Behaviors

`lib/branding/tier-rules.ts` (`getBrandingRules(tier)`) modulates how the Civis
identity and the country identity co-present:

| Tier         | Primary identity | Header lockup                 | Civis attribution | Docs/email |
| ------------ | ---------------- | ----------------------------- | ----------------- | ---------- |
| `cloud`      | Civis            | civis-with-country-accent     | header            | civis      |
| `government` | balanced         | civis-and-country             | footer            | both       |
| `sovereign`  | country          | country-only                  | hidden            | country    |

## Three Reference Brands + Platform

- **CI — Côte d'Ivoire** — `brand_source: 'bridge55'`, fr-default, XOF, generated flag.
- **GH — Ghana** — `brand_source: 'bridge55'`, en-default, GHS, generated flag.
- **LR — Liberia** — `brand_source: 'liberia_asset'`, real coat of arms at
  `brand-assets/lr/seal.svg`; flag colors `#BF0A30` / `#002868` / `#FFFFFF`.
- **AF — Afronovation (platform default)** — `brand_source: 'manual'`, Civis navy
  `#2A3F62` / gold `#C9A84C`; the fallback brand for marketing + platform tenant.

No CI/GH/SN national seals exist in the Bridge55 source tree (only tourism logos),
so their `seal_asset_path` is left null for super-admin upload later.

## Asset Path Convention

`brand-assets/{country_code_lowercase}/{asset_type}.{ext}` — e.g. `lr/seal.svg`,
`ci/flag.svg`. Bucket `brand-assets` is public-read (assets must be embeddable),
super-admin write only.

## Adding a New Country Brand (super-admin workflow)

1. `/admin/branding` → **Add Country Brand** → pick ISO country, set primary/
   secondary/accent (surface variants auto-generate).
2. Upload flag + seal (optional) — stored under `brand-assets/{cc}/`.
3. Assign the brand to a tenant via the tenant's `branding_id`.

## CSS Variable Reference (`--civis-*`)

```
--civis-brand-primary        --civis-surface-50
--civis-brand-secondary      --civis-surface-100
--civis-brand-accent         --civis-surface-500
--civis-brand-neutral-dark   --civis-surface-700
--civis-brand-neutral-light  --civis-surface-900
--civis-font-display
--civis-font-body
```

Consumed through Tailwind utilities (`bg-brand-primary`, `text-brand-secondary`,
`bg-surface-50`, `font-display`, …) which resolve to the active tenant brand at
runtime. `data-brand="{cc}"` and `data-tier="{tier}"` are set on `:root` by
`BrandProvider`.
