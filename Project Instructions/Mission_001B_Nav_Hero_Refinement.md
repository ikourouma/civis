# Mission 001-B — Navigation Refinement & Hero Redesign

**Mission ID:** Civis-Mission-001B  
**Phase:** Build Phase 1 — Foundation (Visual Lock)  
**Status:** Ready to Execute  
**Prerequisites:** Mission 001-A complete and signed off  
**Next Mission:** Mission 002 — Authentication & Tenant Foundation  
**Estimated Scope:** Small — three targeted changes, no new routes, no new dependencies

---

## Before You Begin

No new documents need to be read for this mission. You are making three surgical changes to components already built in Mission 001-A:

1. `components/layout/Header.tsx` — two fixes
2. `app/[locale]/page.tsx` + `components/marketing/Hero.tsx` (or equivalent home hero component) — one structural redesign

Do not touch any other files unless a change in the above components requires a cascading update to a shared utility or translation key.

---

## Overview of Changes

| # | Change | File | Type |
|---|---|---|---|
| 1 | Fix tagline wrapping to two lines | Header.tsx | 1-line CSS fix |
| 2 | Align nav inner container to page body max-width | Header.tsx | 2-line CSS fix |
| 3 | Redesign hero from centered to left-text + right intelligence panel | Hero component | Structural |

---

## Change 1 — Fix Tagline Wrapping

**Problem:** The text "Sovereign Diaspora Intelligence" next to the CIVIS wordmark wraps to two lines at certain viewport widths, making the logo area taller than intended.

**Fix:** Add `whitespace-nowrap` to the tagline element in `Header.tsx`.

Locate the tagline text element — it will look similar to:
```tsx
<span className="text-xs text-gold-400 ...">
  Sovereign Diaspora Intelligence
</span>
```

Add `whitespace-nowrap` to its className. Result:
```tsx
<span className="text-xs text-gold-400 whitespace-nowrap ...">
  Sovereign Diaspora Intelligence
</span>
```

If the tagline is too long to display at small viewport widths after applying `whitespace-nowrap`, add `hidden lg:block` so it only appears at large screens and above. The CIVIS wordmark alone is sufficient on smaller screens.

---

## Change 2 — Align Navigation Container to Page Body Width

**Problem:** The header's inner content (logo, nav links, CTA button) spans a wider area than the page body content below it. At the left and right edges, nav items appear closer to the screen edge than the page content sections beneath them.

**Fix:** The header's inner wrapper must use the same max-width constraint as the page body sections.

Locate the inner container div inside the `<header>` element — it will look similar to:
```tsx
<div className="flex items-center justify-between w-full px-6">
```

Replace with the same container pattern used in `SectionWrapper.tsx` for page body content:
```tsx
<div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
```

Verify the `max-w` value matches exactly what `SectionWrapper.tsx` uses. If `SectionWrapper` uses `max-w-6xl` or a custom value, use that same value here — consistency is the goal. The nav content left and right edges must be visually flush with the page body content below when viewed at a standard 1280px+ desktop viewport.

---

## Change 3 — Hero Redesign: Left Text + Right Intelligence Panel

**Problem:** The current hero is centered — headline, subtitle, CTAs all centered on a full-width dark navy background. This reads as a brand marketing page. Civis is an intelligence platform and the hero should demonstrate that immediately.

**Design:** Split two-column layout. Left column carries the narrative. Right column carries a live-feel intelligence visual. Together they communicate: sovereign authority (left) + data intelligence (right).

---

### 3.1 Layout Structure

```
[Full-viewport-height dark navy section]
  [Inner container — max-w-7xl mx-auto — same as body]
    [Two-column grid — 55% left / 45% right on desktop]
    [Single column stacked on mobile — left content first, panel second]
```

Desktop: `grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-16 items-center min-h-screen`  
Mobile: single column, left content top, intelligence panel below with `mt-12`

---

### 3.2 Left Column — Narrative Content

Keep all existing copy — only the layout changes. The content remains:

```
[Eyebrow — gold, uppercase, letter-spacing: 0.15em, text-xs]
SOVEREIGN DIASPORA INTELLIGENCE

[H1 — white, font-bold, text-4xl lg:text-6xl, leading-tight]
Know Your Diaspora.
Lead With Intelligence.

[Subtitle — text-blue-100/80, text-lg lg:text-xl, max-w-lg, leading-relaxed, mt-6]
Civis is the sovereign intelligence platform that transforms 
fragmented diaspora data into verified registries, policy-grade 
analytics, and AI-powered forecasting — built for African Union 
governments.

[CTA row — mt-10, flex gap-4, flex-wrap]
[Primary — gold fill, px-8 py-4]     Request a Government Briefing
[Secondary — white outline, px-8 py-4]  Explore the Platform

[Trust badges — mt-12, flex flex-wrap gap-4]
ISO 27001  |  GDPR Ready  |  SOC 2  |  Sovereign Cloud
```

Left-align all content: `text-left items-start` on the column container.  
Remove any `text-center` or `items-center` from the previous centered implementation.

---

### 3.3 Right Column — Intelligence Panel

Build a self-contained dark surface card that communicates diaspora intelligence at a glance. This is a static visual — no backend data, no external API. It must look live, not placeholder.

**Outer card:**
```
background: #0D1B2E (deeper than hero navy)
border: 1px solid rgba(201, 168, 76, 0.2) (subtle gold border)
border-radius: 16px
padding: 24px
box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4)
```

**Card structure — four sections stacked vertically:**

---

**Section A — Card Header**
```
[Left] "LIVE INTELLIGENCE" — gold, text-xs, font-semibold, uppercase, letter-spacing 0.15em
[Right] Pulsing green dot + "ACTIVE" — text-xs, text-green-400
        (pulse animation: scale 1→1.5→1, 2s infinite, opacity fade)
```

---

**Section B — Africa SVG Map with Diaspora Hotspots**

Render a simplified SVG outline of the African continent. Keep it minimal — just the continent silhouette as a dark path stroke on a slightly lighter background surface (`#1A2C42`).

Overlay five glowing dot markers at approximate coordinates for these diaspora hub cities:

| City | Approx SVG position |
|---|---|
| Paris, France | Upper left of continent (outside, NW) |
| London, UK | Upper left (outside, N) |
| New York, USA | Far left (outside, W) |
| Dubai, UAE | Right side (outside, NE) |
| Johannesburg, SA | Lower center of continent |
| Montréal, Canada | Far left (outside, NW) |

Each dot:
```
Outer ring: gold (#C9A84C), opacity 0.3, radius 8px, pulse animation
Inner dot: gold (#C9A84C), opacity 1, radius 3px
Animation: ping/pulse, 2s infinite, staggered start times (0s, 0.4s, 0.8s, 1.2s, 1.6s, 2.0s)
```

Map container: `height: 180px`, `background: #1A2C42`, `border-radius: 8px`, `overflow: hidden`

Use Tailwind's `animate-ping` for the outer rings. Stagger with inline `style={{ animationDelay: 'Xs' }}`.

If an accurate Africa SVG path is complex to produce inline, use a simplified rectangular placeholder with the text "DIASPORA DISTRIBUTION MAP" centered in small caps gold — the dots still render over it. The visual effect of the pulsing location dots is the priority.

---

**Section C — Three Stat Tiles**

Three equal-width tiles in a row. Each tile:
```
background: #1A2C42
border-radius: 8px
padding: 12px 16px
```

| Tile | CountUp value | Suffix | Label |
|---|---|---|---|
| 1 | 2.4 | M+ | Diaspora Records |
| 2 | 47 | + | Countries Covered |
| 3 | 180 | + | Embassy Workspaces |

Stat number: `text-2xl font-bold text-white`  
Suffix: `text-gold-400`  
Label: `text-xs text-blue-200/60 mt-1`

CountUp triggers when panel enters viewport (it will trigger immediately on desktop since the panel is above the fold).

---

**Section D — Intelligence Feed (last 3 items)**

A slim feed of three recent "intelligence events" — static content, styled to look like live system notifications.

```
[Thin divider — rgba(255,255,255,0.06)]

Each item: flex row, py-2, border-b border-white/5 (except last)
  [Left] Colored status dot (2px × 8px rectangle, border-radius 2px)
  [Middle] Event text — text-xs text-blue-100/70
  [Right] Timestamp — text-xs text-blue-100/40
```

Three static feed items:

```
● [green]   New registration cluster detected — Paris corridor     2m ago
● [gold]    Ministerial brief generated — Q2 diaspora summary      1h ago  
● [blue]    Embassy sync completed — 12 missions updated           3h ago
```

Status dot colors:
- Green `#22C55E` — new data / activity
- Gold `#C9A84C` — AI output / intelligence
- Blue `#60A5FA` — system / sync

---

### 3.4 Scroll Indicator

Below the left column CTA row, at the very bottom of the viewport on desktop, add a subtle scroll indicator:

```
[Centered below CTAs, absolute bottom-8 or mt-auto]
↓ (animated bounce, Tailwind animate-bounce)
[text-xs text-white/30 mt-1] Scroll to explore
```

Only visible on desktop (`hidden lg:flex flex-col items-center`). Disappears after user scrolls past hero (`opacity-0` on scroll, transition 300ms).

---

### 3.5 Mobile Behavior

On screens below `lg` breakpoint (< 1024px):
- Single column layout
- Left content (eyebrow, H1, subtitle, CTAs, trust badges) renders first, full width
- Intelligence panel renders below with `mt-12 mb-16`
- Panel maintains all four sections but map height reduces to `120px`
- Scroll indicator hidden on mobile

---

### 3.6 Animation Sequence

Keep all existing FadeUp animations from Mission 001-A. Update timing for the two-column layout:

**Left column (unchanged):**
- Eyebrow: FadeUp delay 0ms
- H1: FadeUp delay 100ms
- Subtitle: FadeUp delay 200ms
- CTAs: FadeUp delay 300ms
- Trust badges: FadeUp delay 400ms

**Right column (new):**
- Intelligence panel card: FadeUp delay 200ms (starts with subtitle, arrives together)
- Card header: instant (part of card reveal)
- Map dots: staggered ping starts after card is visible (CSS animation-delay handles this)
- Stat tiles: CountUp triggers on card entry
- Feed items: no additional animation — they are visible within the card on reveal

---

## Translation Keys

No new translation keys are required for Changes 1 and 2.

For Change 3, add the following keys to both `/messages/en.json` and `/messages/fr.json` if the intelligence panel text is passed through i18n (recommended):

```json
// en.json additions under "home.hero"
{
  "home": {
    "hero": {
      "panel_label": "Live Intelligence",
      "panel_status": "Active",
      "stat_records_label": "Diaspora Records",
      "stat_countries_label": "Countries Covered", 
      "stat_embassies_label": "Embassy Workspaces",
      "feed_item_1": "New registration cluster detected — Paris corridor",
      "feed_item_2": "Ministerial brief generated — Q2 diaspora summary",
      "feed_item_3": "Embassy sync completed — 12 missions updated",
      "feed_time_1": "2m ago",
      "feed_time_2": "1h ago",
      "feed_time_3": "3h ago",
      "scroll_label": "Scroll to explore"
    }
  }
}
```

```json
// fr.json additions under "home.hero"
{
  "home": {
    "hero": {
      "panel_label": "Intelligence en Direct",
      "panel_status": "Actif",
      "stat_records_label": "Dossiers Diaspora",
      "stat_countries_label": "Pays Couverts",
      "stat_embassies_label": "Espaces Ambassade",
      "feed_item_1": "Nouveau cluster d'inscription détecté — corridor Paris",
      "feed_item_2": "Note ministérielle générée — bilan diaspora T2",
      "feed_item_3": "Synchronisation ambassades — 12 missions mises à jour",
      "feed_time_1": "il y a 2 min",
      "feed_time_2": "il y a 1 h",
      "feed_time_3": "il y a 3 h",
      "scroll_label": "Défiler pour explorer"
    }
  }
}
```

---

## Success Criteria

- [ ] "Sovereign Diaspora Intelligence" renders on a single line at all viewport widths ≥ 1024px; hidden below that breakpoint if needed
- [ ] Nav inner container left and right edges are visually flush with page body content at 1280px+ viewport
- [ ] Hero is two-column on desktop (lg+): left narrative, right intelligence panel
- [ ] Hero is single-column on mobile: content stacks, panel below
- [ ] Intelligence panel renders all four sections: header, map with pulsing dots, three stat tiles, feed
- [ ] CountUp animates on the three stat tiles on page load
- [ ] Map dots pulse with staggered animation delays
- [ ] Feed items display with correct color coding (green / gold / blue)
- [ ] Scroll indicator visible on desktop, hidden on mobile, bounces correctly
- [ ] All intelligence panel text runs through next-intl translation keys
- [ ] FR locale renders correctly — panel content in French
- [ ] No TypeScript errors in strict mode
- [ ] `next build` completes cleanly — all existing 36 pages still statically generated
- [ ] No regressions on any other page — only Header.tsx and the hero component are modified

---

## Explicitly Out of Scope

- No changes to any page other than the home page hero and the header
- No new routes
- No authentication or database logic
- No changes to the cookie banner, footer, platform subpages, resources, or legal pages
- No real backend data in the intelligence panel — all static

---

## Completion Sign-Off

When Mission 001-B is complete, confirm before closing:

1. Tagline single-line confirmed at 1280px viewport
2. Nav and body content left/right edges visually aligned
3. Hero two-column layout confirmed on desktop
4. Hero single-column confirmed on mobile (resize browser or use DevTools)
5. All intelligence panel animations running (dots, CountUp, scroll indicator)
6. FR locale tested — hero panel in French
7. `next build` clean
8. Visual review on production build recommended
9. Ready to proceed to Mission 002 — Authentication & Tenant Foundation

---

*Document location: `C:\Users\ikour\Projects\civis\Project Instructions\Mission_001B_Nav_Hero_Refinement.md`*  
*Program Owner: Afronovation, Inc.*  
*Classification: Internal — Build Team Only*  
*Depends on: Mission_001A_Visual_Enhancement.md*