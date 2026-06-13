# Mission 001 — Civis Application Foundation & Public Platform Scaffold

**Mission ID:** Civis-Mission-001  
**Phase:** Build Phase 1 — Foundation  
**Status:** Ready to Execute  
**Prerequisites:** None — this is the first mission  
**Next Mission:** Mission 002 — Authentication & Tenant Foundation

---

## Before You Begin

Read the following documents from `C:\Users\ikour\Projects\civis\Project Documents` before writing any code:

- **Doc 08** — Technical Architecture & Implementation Blueprint v2.0
- **Doc 07** — Sovereign Design System & Executive Experience Specification v1.0
- **Doc 06** — Marketing Platform IA & UX Specification v1.0

---

## Objective

Initialize the Civis Next.js application with the correct foundation for all subsequent build phases. This mission establishes the scaffold only — no authentication, no database logic, no production features.

---

## Deliverables

### 1. Next.js Application Initialization
- Next.js 14 with App Router
- TypeScript in strict mode
- Tailwind CSS configured
- shadcn/ui installed and configured
- ESLint and Prettier configured

### 2. Localization Architecture (next-intl)
- All routes under `/[locale]/` with `/en/` and `/fr/` support
- Locale detection and automatic redirect from root `/`
- Translation file structure:
  - `/messages/en.json`
  - `/messages/fr.json`
- Language toggle component — functional, persists selection
- All user-facing strings rendered through translation keys — zero hardcoded text anywhere

### 3. Public Marketing Route Structure
Create page scaffolds for both `/en/` and `/fr/` locales:

| Route | Purpose |
|---|---|
| `/` | Home — hero, value proposition, request-demo CTA |
| `/platform` | Platform capabilities and four pillars |
| `/solutions` | Government persona use cases and outcome narratives |
| `/security` | Compliance, data residency, sovereign trust posture |
| `/deployment` | Three-tier model — Cloud, Government, Sovereign |
| `/about` | Afronovation program context and institutional credentials |
| `/contact` | Request-demo form — name, government, country, role, message |

> **Note on /solutions:** This page houses all government persona use cases framed as outcome narratives — not a generic features list. Each solution card maps to one of the five procurement personas (Minister, Central Bank Governor, Diaspora Commission Director, Development Partner, CIO). Refer to Doc 00 (Platform Personas) and Doc 06 (Marketing IA) for persona details.

### 4. Design System Baseline
- Tailwind config extended with Civis brand tokens:
  - Navy: `#2A3F62`
  - Gold: `#C9A84C`
  - Light Blue (surface): `#EAF2FA`
  - Dark Gray (text): `#2D2D2D`
- Base typography scale aligned to Sovereign Design System (Doc 07)
- 8-point spacing grid
- Reusable layout components:
  - `Header` — with navigation and EN/FR language toggle
  - `Footer` — with links and Afronovation attribution
  - `SectionWrapper` — consistent section padding and max-width container
- shadcn/ui theme configured to match Sovereign Design System visual language
- Design reference: institutional authority of EmbassyOS combined with intelligence terminal aesthetics of Palantir Government and World Bank Data Portals — not consumer SaaS

### 5. Supabase Client Structure (Prepared — Not Connected)
Create the folder and file structure. Do not connect to a production Supabase instance in this mission.

```
/lib/
  /supabase/
    client.ts        — Supabase browser client
    server.ts        — Supabase server client (for Server Components)
  /services/         — Empty folder structure, ready for Mission 002
    /auth/
    /tenants/
    /registrants/
    /embassies/
    /analytics/
```

### 6. Environment Variable Documentation
Create `.env.example` at project root with all required variables documented:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only — never exposed to client

# Deployment tier
CIVIS_DEPLOYMENT_TIER=            # cloud | government | sovereign
CIVIS_TENANT_ID=                  # For Government / Sovereign single-tenant deployments

# Localization
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Dia AI Service
DIA_SERVICE_URL=                  # Python forecasting service endpoint
DIA_SERVICE_API_KEY=              # Internal service authentication

# Mapping
NEXT_PUBLIC_MAPBOX_TOKEN=

# Storage
SUPABASE_STORAGE_BUCKET_PREFIX=   # Tenant isolation prefix
```

### 7. Marketing Home Page — EN Content Skeleton
Build the home page with real structural content (no Lorem Ipsum):

- **Hero section** — headline, sub-headline, primary CTA (Request a Demo), secondary CTA (Explore Platform)
- **Value proposition block** — three to four core platform pillars with icons
- **Social proof / trust bar** — institutional credibility signals
- **Request-demo CTA section** — routes to `/contact`

All copy through translation keys. EN content written. FR keys stubbed and ready for translation.

---

## Folder Structure Output

```
civis/
├── app/
│   └── [locale]/
│       ├── layout.tsx
│       ├── page.tsx              — Home
│       ├── platform/page.tsx
│       ├── solutions/page.tsx
│       ├── security/page.tsx
│       ├── deployment/page.tsx
│       ├── about/page.tsx
│       └── contact/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── SectionWrapper.tsx
│   └── ui/                       — shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── services/
│       ├── auth/
│       ├── tenants/
│       ├── registrants/
│       ├── embassies/
│       └── analytics/
├── messages/
│   ├── en.json
│   └── fr.json
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Success Criteria

- [ ] App runs locally and loads in the browser (Next.js assigns an available port automatically — do not hardcode a port number)
- [ ] `/en/` and `/fr/` routes both load without error
- [ ] Language toggle switches locale correctly and persists
- [ ] All seven marketing routes return a page (scaffold is sufficient — no full content required)
- [ ] Design tokens applied to base layout (Navy, Gold visible in header/footer)
- [ ] Zero hardcoded user-facing strings — all text through next-intl translation keys
- [ ] `.env.example` complete with all variable names documented
- [ ] `/lib/services/` folder structure in place
- [ ] No TypeScript errors in strict mode
- [ ] Codebase ready for Mission 002 (authentication and tenant foundation)

---

## Explicitly Out of Scope

The following must **not** be built in Mission 001:

- Authentication or session management of any kind
- Database migrations, SQL, or RLS policies
- Tenant logic or tenant_id handling
- Embassy workspace screens
- Intelligence dashboard screens
- Registrant portal screens
- Production Supabase connection (client structure only)
- Dia AI integration

---

## Engineering Guardrails

These rules apply to every mission, starting now:

**Must Do:**
- Use TypeScript strict mode throughout — no `any` types
- Use next-intl translation keys for every user-facing string
- Follow the 8-point spacing grid from the design system
- Use shadcn/ui components as the base for all UI elements
- Name files and folders consistently with the structure above

**Must Avoid:**
- Hardcoded text strings in any component
- Inline styles — use Tailwind classes only
- Consumer SaaS visual patterns (rounded pill buttons, bright gradients, playful typography)
- Lorem Ipsum or placeholder text visible in the browser
- Any direct database calls — the `/lib/services/` layer is the pattern from Mission 001 onward

---

## Completion Sign-Off

When Mission 001 is complete, confirm the following before closing:

1. All success criteria checked
2. No TypeScript errors
3. Both `/en/` and `/fr/` routes tested in browser
4. Language toggle tested
5. Folder structure matches the output specification above
6. Ready to proceed to Mission 002

---

*Document location: `C:\Users\ikour\Projects\civis\Project Instructions\Mission_001_Foundation_Scaffold.md`*  
*Program Owner: Afronovation, Inc.*  
*Classification: Internal — Build Team Only*