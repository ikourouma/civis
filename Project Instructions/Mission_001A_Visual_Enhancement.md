# Mission 001-A — Visual Enhancement, Animation, Platform Subpages, Resources & Legal

**Mission ID:** Civis-Mission-001A  
**Phase:** Build Phase 1 — Foundation (Visual Lock)  
**Status:** Ready to Execute  
**Prerequisites:** Mission 001 complete and signed off  
**Next Mission:** Mission 002 — Authentication & Tenant Foundation  
**Estimated Scope:** Large — complete before any auth or tenant logic is introduced

---

## Before You Begin

Read the following documents from `C:\Users\ikour\Projects\civis\Project Documents` before writing any code:

- **Doc 07** — Sovereign Design System & Executive Experience Specification v1.0
- **Doc 06** — Marketing Platform IA & UX Specification v1.0
- **Doc 00** — Project Team, Roles & Platform Personas (for persona content on /solutions and /platform subpages)
- **Doc 10** — Consent, Privacy & Data Governance Specification v1.0 (for /legal content)
- **Doc 11** — Security Architecture Specification v1.0 (for /security and /resources/security-whitepaper content)
- **Doc 12** — API & Integration Specification v1.0 (for /resources/api-reference content)

Also study the EmbassyOS reference platform at https://embassyos.com before beginning. Pay close attention to:
- How each platform subpage is structured (hero → challenge → solution → metrics → CTA)
- How sections reveal on scroll (fade-up with stagger)
- How cards animate on hover (lift, border highlight, icon glow)
- The privacy banner behavior on first load
- The /resources and /legal page structure and tone

Civis must belong to the same institutional family as EmbassyOS — same design authority, different product identity.

---

## Objective

Lock the complete public marketing surface of the Civis platform before Mission 002 begins. This mission delivers:

1. A fully enhanced home page matching EmbassyOS institutional quality
2. A restructured /platform hub with four use-case subpages
3. Scroll reveal and card animation system across all pages
4. A privacy/cookie consent banner
5. Complete /resources section (five pages)
6. Complete /legal page (five anchored sections)
7. All new routes in both EN and FR locales

No authentication, no database, no tenant logic is introduced in this mission.

---

## Deliverable 1 — Animation System

Build a reusable animation foundation used across every page. This is the first deliverable because everything else depends on it.

### 1.1 Install Dependencies

```bash
npm install framer-motion react-intersection-observer
```

### 1.2 FadeUp Component

Create `components/animation/FadeUp.tsx` — a reusable wrapper that triggers a fade-up reveal when the element enters the viewport.

**Behavior:**
- Start state: `opacity: 0`, `y: 24px`
- End state: `opacity: 1`, `y: 0`
- Duration: `600ms`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Trigger: element enters viewport (threshold: 0.15)
- Trigger once: yes — does not re-animate on scroll back
- Delay prop: accepts `number` in milliseconds for stagger control
- Respects `prefers-reduced-motion` — when enabled, renders without animation

```tsx
// Usage example
<FadeUp delay={0}>
  <HeroHeadline />
</FadeUp>
<FadeUp delay={100}>
  <HeroSubheadline />
</FadeUp>
<FadeUp delay={200}>
  <HeroCTAs />
</FadeUp>
```

### 1.3 StaggerContainer Component

Create `components/animation/StaggerContainer.tsx` — wraps a list of children and applies incrementing delay to each, producing a cascade reveal effect.

**Behavior:**
- Accepts `staggerDelay` prop (default: `100ms`)
- Wraps each child in a FadeUp with calculated delay
- Used for card grids, feature lists, stat tiles, bullet lists

```tsx
// Usage example — cards stagger in 100ms apart
<StaggerContainer staggerDelay={100}>
  <FeatureCard ... />
  <FeatureCard ... />
  <FeatureCard ... />
  <FeatureCard ... />
</StaggerContainer>
```

### 1.4 AnimatedCard Component

Create `components/animation/AnimatedCard.tsx` — a Framer Motion wrapper that applies hover animations to any card.

**Behavior:**
- Hover lift: `y: -4px`
- Hover shadow: increases to `0 12px 32px rgba(0, 0, 0, 0.12)`
- Hover left border: transitions to Gold `#C9A84C` (4px solid)
- Hover icon wrapper: background transitions to `rgba(201, 168, 76, 0.1)` (gold tint)
- Transition duration: `200ms ease`
- Cursor: `pointer`
- All hover states disabled when `prefers-reduced-motion` is active

### 1.5 CountUp Component

Create `components/animation/CountUp.tsx` — animates a numeric stat from 0 to its target value when it enters the viewport.

**Behavior:**
- Duration: `2000ms`
- Easing: ease-out
- Triggers once on viewport entry
- Accepts: `value` (number), `suffix` (string, e.g. "%", "+", "K")
- Respects `prefers-reduced-motion` — shows final value immediately

---

## Deliverable 2 — Home Page Full Enhancement

Replace the Mission 001 home page skeleton with the full institutional-grade implementation.

### 2.1 Hero Section

**Design:**
- Full-viewport-height dark navy background (`#0D1B2E` — deeper than header navy)
- Subtle grid or dot pattern overlay at low opacity (SVG background, no external image dependency)
- Centered content, max-width 800px

**Content structure (all through translation keys):**

```
[Eyebrow label — gold, uppercase, tracked]
SOVEREIGN DIASPORA INTELLIGENCE

[H1 — white, large, tight tracking]
Know Your Diaspora.
Lead With Intelligence.

[Subtitle — light gray, 20px, relaxed line height]
Civis is the sovereign intelligence platform that transforms fragmented 
diaspora data into verified registries, policy-grade analytics, and 
AI-powered forecasting — built for African Union governments.

[CTA row]
[Primary — gold fill]  Request a Government Briefing
[Secondary — white outline]  Explore the Platform

[Trust bar — four badges, horizontal, centered, 60px below CTAs]
ISO 27001 Compliant  |  GDPR Ready  |  SOC 2 Architecture  |  Sovereign Cloud
```

**Animated intelligence metrics panel (below trust bar):**
A dark surface card (`#1A2C42`) showing three live-feel counters:

```
[CountUp to 2.4M]  Diaspora Records Indexed
[CountUp to 47]    Countries Covered  
[CountUp to 180]   Embassy Workspaces Active
```

Note: these are aspirational platform-capacity numbers, not live data. Style them to read as capability metrics, not live counts.

**Animation sequence:**
- Eyebrow: FadeUp, delay 0
- H1: FadeUp, delay 100
- Subtitle: FadeUp, delay 200
- CTAs: FadeUp, delay 300
- Trust bar: FadeUp, delay 400
- Metrics panel: FadeUp, delay 500, CountUp triggers on entry

### 2.2 Four Pillars Section

Light background (`#EAF2FA`). Section title: "One Platform. Complete Diaspora Sovereignty."

Four AnimatedCards in a 2×2 grid (mobile: 1 column, tablet: 2 columns):

| # | Icon | Title | Description |
|---|---|---|---|
| 01 | Registry icon | Diaspora Registry | A sovereign, verified registry of every citizen abroad — structured, searchable, and owned by your government |
| 02 | Embassy icon | Embassy Intelligence | Unified workspace for every mission worldwide — one platform, all embassies, zero data silos |
| 03 | Analytics icon | Sovereign Analytics | Policy-grade intelligence dashboards that transform raw registry data into ministerial-ready insights |
| 04 | AI icon | Dia Intelligence Engine | AI-powered forecasting, cohort modeling, and executive briefs — built on your sovereign data |

Each card links to its corresponding `/platform/[subpage]`.
StaggerContainer with 100ms stagger. Each card is an AnimatedCard.

### 2.3 Before / After Contrast Section

Dark navy background. Two-column layout. Title: "The Cost of Fragmented Diaspora Data."

**Left column — "Without Civis" (red accent):**
- Diaspora registration drives that fail to convert
- Embassy data siloed across 30+ missions with no unified view
- Policy decisions made on World Bank estimates, not sovereign data
- No predictive capability — events discovered reactively
- Citizen data held on foreign commercial infrastructure

**Right column — "With Civis" (gold/green accent):**
- Verified, growing diaspora registry that compounds in value over time
- All embassies unified — one workspace, one data model, one source of truth
- Ministerial intelligence dashboards built on your own sovereign registry
- Dia AI forecasts demographic shifts and economic signals weeks ahead
- Sovereign-grade infrastructure — your data, your borders, your control

FadeUp on each column as it enters viewport.

### 2.4 AU Member States Trust Section

White background. Title: "Trusted by African Union Governments."

Horizontal scrolling row of AU member state flag emojis with country names below. Style: clean, institutional — not a consumer logo parade.

Below flags: four compliance badge tiles (ISO 27001, GDPR Ready, SOC 2, Malabo Convention).

### 2.5 Deployment Tier Preview Section

Light surface background. Title: "Deploy at the Level Your Sovereignty Requires."

Three AnimatedCards — one per tier:

| Tier | Badge color | Title | One-line |
|---|---|---|---|
| Civis Cloud | Blue | For governments beginning their diaspora intelligence journey | Shared sovereign infrastructure. Operational in days. |
| Civis Government | Gold | For nations requiring dedicated national infrastructure | Your country. Your cloud. Your registry. |
| Civis Sovereign | Navy/Platinum | For governments requiring maximum sovereignty and on-premise control | Physically isolated. Sovereign key management. Air-gap capable. |

Each card links to `/deployment`. StaggerContainer with 150ms stagger.

### 2.6 Government Briefing CTA Section

Deep navy background. Mirrors EmbassyOS's closing CTA section precisely.

```
[H2] Ready to Lead the Digital Transformation of Your Diaspora?

[Body] Join the governments building sovereign diaspora intelligence 
with institutional-grade technology. Our team will prepare a personalized 
briefing tailored to your nation's specific requirements.

[Four bullet promises — gold checkmarks]
✦ Personalized technical briefing within 48 hours
✦ Live demonstration of your country's sovereign tenant
✦ Security architecture review and compliance mapping
✦ Custom deployment timeline and implementation roadmap

[AU flag row — same as trust section]

[CTA row]
[Primary — gold]  Request a Government Briefing  →  /contact
[Secondary — outline]  View Security Architecture  →  /security
```

---

## Deliverable 3 — Platform Hub Page (/platform)

Replace the current /platform scaffold with a proper hub page.

**Structure:**
- Dark navy hero: "One Platform. Every Dimension of Diaspora Sovereignty." — breadcrumb, title, subtitle, no CTAs (the subpages carry the CTAs)
- Intro paragraph: two sentences on the four-pillar architecture
- Four large AnimatedCards linking to subpages — each with numbered label (01, 02, 03, 04), icon, title, challenge teaser, and "Explore →" link
- Bottom CTA strip: "Request a Government Briefing" + "View Deployment Options"

---

## Deliverable 4 — Platform Subpages (Four Pages)

Create four subpages under `/platform/`. Each follows the identical EmbassyOS structure:

```
Breadcrumb → Hero → The Challenge → The Civis Solution → Metrics Bar → CTA Strip
```

All four pages in both `/en/platform/[slug]` and `/fr/platform/[slug]`.

---

### 4.1 /platform/diaspora-registry

**Hero:**
Title: "Diaspora Registry"
Subtitle: "Build a verified, sovereign registry of every citizen abroad — structured for intelligence, built for policy."

**The Challenge:**
- Diaspora registration drives launch with no lasting infrastructure to capture and retain data
- Embassy spreadsheets across 30+ missions contain duplicate, unverified, and outdated records
- No unified citizen identity across missions — the same person appears five times in five countries
- Governments make diaspora policy decisions on World Bank estimates, not their own verified data
- Registration data is collected then abandoned — never analyzed, never actioned

**The Civis Solution (six feature cards):**

| Icon | Title | Description |
|---|---|---|
| 🪪 | Sovereign Citizen Registry | A single, verified record for every diaspora citizen — deduplicated, validated, and owned by your government |
| 🌍 | Multi-Mission Unified View | One registrant profile visible across all embassies worldwide — no duplicates, no silos |
| ✅ | Consent-First Architecture | Every registration built on informed consent — GDPR, NDPR, and Malabo Convention compliant by design |
| 📋 | Structured Data Model | Professional background, host country, life events, language, generation cohort — policy-ready from day one |
| 🔒 | Sovereign Data Residency | Your registry lives on your infrastructure — no foreign commercial server holds your citizens' data |
| 📈 | Registration Campaign Engine | Launch, track, and optimize national registration campaigns from a single command dashboard |

**Metrics:**
- `2.4M+` Diaspora Records Supported
- `99.97%` Data Deduplication Accuracy
- `<24h` Registration Processing Time
- `100%` Consent Coverage

---

### 4.2 /platform/embassy-intelligence

**Hero:**
Title: "Embassy Intelligence"
Subtitle: "Every mission unified. Every consular officer empowered. Every registrant served — from anywhere in the world."

**The Challenge:**
- Embassy staff manage registrant queues in spreadsheets with no shared visibility
- A citizen who visits the Washington D.C. embassy is unknown to the Brussels consulate
- No cross-mission workload visibility — some embassies are overwhelmed, others underutilized
- Document requests take weeks because there is no digital workflow between citizen and officer
- Ministry officials have no real-time view into what any embassy is doing at any moment

**The Civis Solution (six feature cards):**

| Icon | Title | Description |
|---|---|---|
| 🏢 | Multi-Embassy Workspace | Every mission — Washington D.C., Paris, London, Brussels — in one unified operational platform |
| 👤 | Consular Officer Dashboard | Each officer sees their queue, their cases, and their registrants — no more spreadsheet chaos |
| 🔄 | Cross-Mission Visibility | Tenant Admin sees all missions in real time — workload, queue depth, registration velocity |
| 📄 | Document Request Workflow | Citizens submit document requests digitally. Officers fulfill them with a verified audit trail |
| 📅 | Appointment Management | Self-service appointment booking with capacity controls per embassy and service type |
| 🔐 | Role-Based Access Control | Eight platform roles, RLS-enforced — officers see only what their role permits |

**Metrics:**
- `85%` Reduction in Processing Time
- `40%` Fewer Missed Appointments
- `30+` Missions in One Workspace
- `100%` Immutable Audit Coverage

---

### 4.3 /platform/sovereign-analytics

**Hero:**
Title: "Sovereign Analytics"
Subtitle: "Transform your diaspora registry into policy-grade intelligence — built for ministers, designed for decisions."

**The Challenge:**
- Governments have no intelligence on the size, location, or economic contribution of their diaspora
- Remittance policy is made using corridor-level estimates, not citizen-level data
- Development partners and multilateral funders ask for diaspora impact data that does not exist
- Parliamentary questions on diaspora affairs cannot be answered with evidence
- Ministers receive briefings assembled manually from fragmented sources the night before a meeting

**The Civis Solution (six feature cards):**

| Icon | Title | Description |
|---|---|---|
| 📊 | Intelligence Dashboard | Real-time diaspora metrics across host country, profession, generation, and engagement level |
| 🗺️ | Geographic Distribution | Interactive map of diaspora concentration worldwide — down to city level |
| 💹 | Remittance Corridor Analysis | Connect diaspora demographics to remittance flow data for central bank-grade policy modeling |
| 📑 | Ministerial Report Builder | Generate formatted intelligence reports for cabinet, parliament, and development partners in minutes |
| 🎯 | Segment Builder | Build custom diaspora cohorts — by profession, host country, generation, or engagement level |
| 📤 | Export & API Access | CSV, PDF, and API export — compatible with national data lakes and multilateral reporting frameworks |

**Metrics:**
- `90%` Faster Ministerial Report Generation
- `360°` Diaspora View — Host Country to Profession
- `Real-Time` Dashboard Refresh
- `API-Ready` for National Data Infrastructure

---

### 4.4 /platform/dia-ai

**Hero:**
Title: "Dia Intelligence Engine"
Subtitle: "AI-powered forecasting, cohort modeling, and executive intelligence — built on your sovereign diaspora data."

**The Challenge:**
- Governments discover diaspora demographic shifts after they have already happened
- No predictive capability exists to model diaspora growth, decline, or migration patterns
- Policy planning horizons are 3–5 years but diaspora data is historical, not predictive
- AI platforms that could help require data to leave sovereign infrastructure — unacceptable for government
- Intelligence outputs from AI systems are black boxes — governments cannot explain or defend them

**The Civis Solution (six feature cards):**

| Icon | Title | Description |
|---|---|---|
| 🔮 | Demographic Forecasting | Predict diaspora population growth, migration shifts, and host country changes 12–24 months ahead |
| 🧩 | Cohort Clustering | Automatically identify diaspora segments with shared characteristics — investment potential, engagement risk, skill concentration |
| 📈 | Trend Detection | Surface early signals in registration data before they become visible to manual analysis |
| 📝 | Executive Brief Generation | LLM-generated ministerial intelligence briefs from your sovereign data — accurate, explainable, audit-ready |
| 🔍 | Explainability Layer | Every Dia AI output includes confidence level, methodology reference, and data lineage — no black boxes |
| 🔒 | Sovereign AI Boundary | All AI processing occurs within your sovereign data boundary — diaspora data never leaves your infrastructure |

**Metrics:**
- `12–24 Month` Forecast Horizon
- `Confidence Score` on Every AI Output
- `100%` Sovereign Data Boundary
- `<5 Min` Executive Brief Generation

---

## Deliverable 5 — Solutions Page (/solutions)

Replace the Mission 001 scaffold with the full persona-driven solutions page.

**Structure:**
- Dark navy hero: "Built for the Decision-Makers Who Shape Diaspora Policy."
- Intro: "Every feature of the Civis platform was designed around the real challenges faced by the government leaders responsible for diaspora engagement, economic intelligence, and sovereign data governance."
- Five solution cards — one per procurement persona (from Doc 00)

Each card structure:
```
[Persona role — gold eyebrow]
[Challenge headline — H3, white]
[Two-sentence challenge description]
[Three bullet outcomes — what Civis delivers for this persona]
[Link: "See how Civis serves [role] →"]
```

**Five persona cards:**

**Card 1 — Minister of Foreign Affairs**
Eyebrow: "For the Minister of Foreign Affairs"
Challenge: "Your diaspora policy is only as strong as the data behind it."
Description: Thirty missions. Thirty spreadsheets. Zero unified intelligence. Cabinet decisions on diaspora affairs are made on estimates, not evidence.
Outcomes:
- A verified, sovereign diaspora registry your cabinet can defend
- Ministerial intelligence dashboards ready for parliamentary briefings
- A platform that survives changes in government without losing institutional knowledge

**Card 2 — Central Bank Governor**
Eyebrow: "For the Central Bank Governor"
Challenge: "Remittance data tells you how much. Civis tells you who, where, and why."
Description: Corridor-level remittance figures are not enough to model diaspora economic behavior or design diaspora investment programs.
Outcomes:
- Demographic-level data connecting diaspora profiles to remittance corridors
- Economic intelligence compatible with IMF, World Bank, and bilateral reporting
- Forecasting capability for diaspora bond and investment program design

**Card 3 — Diaspora Commission Director**
Eyebrow: "For the Diaspora Commission Director"
Challenge: "You run the campaigns. You need the infrastructure to make them count."
Description: Registration campaigns reach thousands of diaspora citizens — then the data lands in a spreadsheet and the intelligence is lost.
Outcomes:
- Campaign-to-registry pipeline: every registrant captured, verified, and analyzed
- Segment-level targeting for diaspora programs, events, and investment outreach
- Impact reports that demonstrate program value to the Minister and development partners

**Card 4 — Development Partner / Multilateral Program Officer**
Eyebrow: "For the Development Partner"
Challenge: "The governments you fund need a platform you can recommend with confidence."
Description: No sovereign-grade diaspora registry platform has existed that meets both government data sovereignty requirements and multilateral data standards — until now.
Outcomes:
- Compliance architecture aligned to GDPR, NDPR, and the AU Malabo Convention
- Data interoperability and export compatible with multilateral reporting frameworks
- A platform built by Afronovation — the team behind EmbassyOS

**Card 5 — Head of Digital Government / CIO**
Eyebrow: "For the Head of Digital Government"
Challenge: "Your government's diaspora data should not live on a foreign commercial server."
Description: Every diaspora platform on the market today is a commercial SaaS product. None of them were built for governments that require sovereign data residency, national integration, and long-term operational independence.
Outcomes:
- Three-tier deployment: Cloud, Government-dedicated, or Sovereign on-premise
- Open API and integration architecture for national identity and data lake systems
- A platform your team can operate without permanent vendor dependency

Bottom CTA strip: "Request a Government Briefing" + "View Deployment Tiers"

---

## Deliverable 6 — Privacy / Cookie Consent Banner

Create `components/legal/CookieBanner.tsx`.

**Behavior:**
- Appears fixed at the bottom of the viewport on first page load
- Checks for `civis_cookie_consent` cookie on mount — if present (either value), banner does not render
- Two action buttons: "Essential Only" and "Accept All"
- Both actions set `civis_cookie_consent` cookie (value: `essential` or `all`) with 365-day expiry
- Banner disappears immediately on either action — no page reload required
- Banner is not dismissible by clicking outside or pressing Escape — user must make a choice

**Design:**
- Dark navy background (`#0D1B2E`), 1px gold top border
- Left side: brief copy (all through translation keys):
  > "We use essential cookies for security and core platform functionality. By continuing, you agree to cookies as described in our privacy notice, consistent with sovereign data protection standards."
  > [Privacy Policy link → /legal#cookie-policy]
- Right side: two buttons — "Essential Only" (outline) and "Accept" (gold fill)
- Mobile: stacks vertically, full-width buttons

**Add to root layout** (`app/[locale]/layout.tsx`): render `<CookieBanner />` as the last element before `</body>`.

---

## Deliverable 7 — Resources Section (Five Pages)

Create `/resources/` hub and five subpages. All in both `/en/` and `/fr/` locales.

### 7.1 /resources (Hub Page)

Dark navy hero: "Resources"
Subtitle: "Everything you need to evaluate, deploy, and operate Civis."

Three audience cards linking to /resources/documentation:
- Decision Makers (government stakeholders evaluating Civis)
- Platform Administrators (tenant and embassy admins managing deployments)
- Technical Teams (architects and engineers reviewing integration and security)

Four additional resource cards below:
- Security Whitepaper → /resources/security-whitepaper
- API Reference → /resources/api-reference
- Changelog → /resources/changelog
- System Status → /resources/status

### 7.2 /resources/documentation

Three-tab or three-section layout (Decision Makers / Platform Admins / Technical Teams).

**Decision Makers section content:**
- Platform Overview: what Civis is, what problem it solves, who it serves
- Return on Investment: processing time reduction, operational cost reduction, policy impact, compliance coverage
- Compliance & Certifications: ISO 27001, SOC 2, GDPR, NDPR, AU Malabo Convention
- Deployment Models: Cloud vs Government vs Sovereign — comparison table

**Platform Admins section content:**
- Tenant Administrator guide overview (links to Doc 14 for full playbook)
- Embassy Administrator guide overview
- User provisioning and role assignment overview
- Registration campaign management overview

**Technical Teams section content:**
- Architecture overview (three-tier, multi-tenant, RLS)
- Supabase and Next.js stack summary
- Deployment guide overview
- API and integration overview (link to /resources/api-reference)

### 7.3 /resources/security-whitepaper

Draws content from Doc 11 (Security Architecture Specification). Structure:

- Executive Summary
- Zero-Trust Architecture
- Sovereign Cloud and On-Premise Deployment
- Encryption Standards (AES-256 at rest, TLS 1.3 in transit)
- Row-Level Security and Tenant Isolation
- Immutable Audit Trail Architecture
- Identity and Access Management
- Compliance Framework (ISO 27001, SOC 2, GDPR, NDPR, Malabo Convention)
- Penetration Testing and Vulnerability Management
- Incident Response Overview

End with: "Request the full Security Architecture document" CTA → /contact

### 7.4 /resources/api-reference

Draws content from Doc 12 (API & Integration Specification). Structure:

- Overview and authentication model
- Base URL and versioning convention
- Core endpoint groups: Registry API, Embassy API, Analytics API, Dia AI API, Webhook API
- Rate limiting and pagination
- SDK availability note
- "Request full API documentation" CTA → /contact

### 7.5 /resources/changelog

Structured changelog page. First entry:

```
v1.0.0 — June 2026
Initial platform release.
- Diaspora Registry engine
- Embassy Workspace (multi-mission)
- Sovereign Analytics Dashboard
- Dia Intelligence Engine (forecasting, clustering, executive briefs)
- Three-tier deployment: Cloud, Government, Sovereign
- Full EN/FR localization
- GDPR, NDPR, and AU Malabo Convention compliance architecture
```

### 7.6 /resources/status

Simple status page. Three sections:
- Platform Services (API, Web App, Database, AI Service) — all showing "Operational" with green indicators
- Recent Incidents: "No incidents reported in the last 90 days."
- Uptime: "99.9% uptime SLA — current month: 100%"

---

## Deliverable 8 — Legal Page (/legal)

Single page with sticky left-column anchor navigation and five sections. Draws from Doc 10 (Consent, Privacy & Data Governance) and EmbassyOS legal as structural reference.

All sections in both `/en/legal` and `/fr/legal`.

**Left navigation anchors:**
- Privacy Policy
- Terms of Service
- Data Processing Agreement
- Cookie Policy
- Compliance

---

### 8.1 Privacy Policy

Effective Date: [current date] | Version 1.0

Sections:
1. Introduction — Afronovation, Inc. operates Civis; commitment to sovereign data protection
2. Data We Collect — Identity data, contact data, authentication data, registry data, technical data
3. How We Use Your Data — Service delivery, authentication, audit compliance, anonymized analytics
4. Data Sovereignty and Storage — Cryptographic tenant isolation; sovereign infrastructure; no cross-tenant access; AES-256 + TLS 1.3
5. Consent Architecture — Informed consent captured before any personal data is stored; consent records are immutable; withdrawal is supported
6. Data Retention — Configurable per government entity; 90-day secure erasure post-termination with cryptographic proof of deletion
7. Your Rights — Access, correction, deletion, portability, objection — subject to government entity configuration and applicable law
8. Applicable Law — GDPR, NDPR (Nigeria), AU Malabo Convention, and applicable national data protection legislation
9. Contact — privacy@civisos.com | DPO: dpo@civisos.com

### 8.2 Terms of Service

Effective Date: [current date] | Version 1.0

Sections:
1. Acceptance — Service exclusively for authorized government entities, diplomatic missions, and designated personnel
2. Service Description — Sovereign intelligence platform; diaspora registry; embassy workspace; analytics; Dia AI; three deployment tiers
3. Government Entity Obligations — Administrator designation; security clearance compliance; credential confidentiality; incident reporting
4. Intellectual Property — All IP owned by Afronovation, Inc.; government entities retain full ownership of all their data; no data rights transferred to Afronovation
5. Service Level Agreement — 99.9% monthly uptime; 72-hour maintenance notice; emergency security patches permitted without advance notice
6. Limitation of Liability — Standard commercial SaaS limitation; cap at 12 months of fees paid
7. Termination — 90-day written notice; 30-day data export window; secure deletion with cryptographic proof

### 8.3 Data Processing Agreement

Effective Date: [current date] | Version 1.0

Sections:
1. Scope and Purpose — DPA between Afronovation, Inc. (Processor) and government entity (Controller); GDPR, Malabo Convention, and NDPR compliance
2. Processing Instructions — Processor acts only on documented Controller instructions; immediate notification if instruction violates applicable law
3. Technical Security Measures:
   - AES-256 encryption at rest, TLS 1.3 in transit
   - Row-Level Security enforcing tenant isolation at the database layer
   - Multi-factor authentication for all administrative access
   - Immutable audit logging of all data access and modification events
   - Regular third-party penetration testing and vulnerability assessments
   - Incident response with 72-hour notification to Controller
4. Sub-processors — List of approved sub-processors with data processing scope
5. Data Subject Rights — Processor supports Controller in fulfilling all data subject rights requests within 30 days
6. Cross-Border Transfers — Data transferred only with appropriate safeguards (SCCs, adequacy decisions, or sovereign infrastructure deployment)
7. Termination — Secure deletion with cryptographic proof within 90 days of termination

### 8.4 Cookie Policy

Sections:
1. What Cookies We Use — Essential only: session security, locale preference (`NEXT_LOCALE`), cookie consent record (`civis_cookie_consent`)
2. What We Do Not Use — No advertising cookies; no third-party tracking; no analytics cookies without explicit consent
3. Cookie Consent — Bottom banner on first load; consent stored in `civis_cookie_consent` cookie; 365-day expiry; withdrawal available by clearing cookies
4. Third-Party Cookies — None on the marketing platform; authenticated platform may use Mapbox (map tiles) and Supabase (authentication session)
5. Managing Cookies — Browser settings; withdrawal process

### 8.5 Compliance

Structured compliance table:

| Standard | Status | Scope |
|---|---|---|
| ISO 27001 | Architecture Aligned | Information security management |
| SOC 2 Type II | Architecture Aligned | Trust service criteria |
| GDPR | Compliant | EU data subjects and EU-jurisdiction deployments |
| NDPR | Compliant | Nigerian data subjects and Nigerian government deployments |
| AU Malabo Convention | Compliant | African Union member state deployments |
| WCAG 2.1 AA | Compliant | All public-facing platform interfaces |
| HSTS | Enforced | All platform domains |
| TLS 1.3 | Enforced | All data in transit |
| AES-256 | Enforced | All data at rest |

Contact for compliance inquiries: compliance@civisos.com

---

## Deliverable 9 — Navigation Updates

Update `components/layout/Header.tsx` to reflect all new routes.

**Updated navigation structure:**

```
Platform ▾
  → Diaspora Registry        (/platform/diaspora-registry)
  → Embassy Intelligence     (/platform/embassy-intelligence)
  → Sovereign Analytics      (/platform/sovereign-analytics)
  → Dia Intelligence Engine  (/platform/dia-ai)

Solutions                    (/solutions)
Security                     (/security)
Deployment                   (/deployment)

Resources ▾
  → Documentation            (/resources/documentation)
  → Security Whitepaper      (/resources/security-whitepaper)
  → API Reference            (/resources/api-reference)
  → Changelog                (/resources/changelog)
  → System Status            (/resources/status)

[Sign In — ghost button]     (disabled / placeholder — no auth yet)
[Request a Briefing — gold fill CTA]  → /contact
```

**Footer updates:**

```
Column 1: Platform
  Diaspora Registry | Embassy Intelligence | Sovereign Analytics | Dia Intelligence Engine | Security

Column 2: Resources  
  Documentation | Security Whitepaper | API Reference | Changelog | System Status

Column 3: Legal
  Privacy Policy | Terms of Service | Data Processing Agreement | Cookie Policy | Compliance

Column 4: Company
  About | Contact | Afronovation.com (external link)
  [Newsletter subscribe — email input + Subscribe button — no backend yet, UI only]
```

---

## Deliverable 10 — Translation Coverage

All new content in this mission must be fully covered in both `/messages/en.json` and `/messages/fr.json`.

**Translation key structure for new sections:**

```json
{
  "home": { "hero": {}, "pillars": {}, "contrast": {}, "trust": {}, "tiers": {}, "cta": {} },
  "platform": { "hub": {}, "registry": {}, "embassy": {}, "analytics": {}, "dia": {} },
  "solutions": { "hero": {}, "personas": {} },
  "resources": { "hub": {}, "documentation": {}, "whitepaper": {}, "api": {}, "changelog": {}, "status": {} },
  "legal": { "privacy": {}, "terms": {}, "dpa": {}, "cookies": {}, "compliance": {} },
  "cookie_banner": {},
  "navigation": {},
  "footer": {}
}
```

FR translation note: Use Doc 06 official French headlines where provided. For content not covered in Doc 06, translate with institutional French government register — formal, precise, no consumer marketing tone. "Demander une consultation gouvernementale" not "Demandez une démo."

---

## Updated Route Structure

After Mission 001-A, the complete public route tree is:

```
/[locale]/
├── page.tsx                              — Home (enhanced)
├── platform/
│   ├── page.tsx                          — Platform hub
│   ├── diaspora-registry/page.tsx
│   ├── embassy-intelligence/page.tsx
│   ├── sovereign-analytics/page.tsx
│   └── dia-ai/page.tsx
├── solutions/page.tsx                    — Persona use cases
├── security/page.tsx
├── deployment/page.tsx
├── about/page.tsx
├── contact/page.tsx
├── resources/
│   ├── page.tsx                          — Resources hub
│   ├── documentation/page.tsx
│   ├── security-whitepaper/page.tsx
│   ├── api-reference/page.tsx
│   ├── changelog/page.tsx
│   └── status/page.tsx
└── legal/page.tsx                        — All five sections, anchor navigation
```

Total: 19 routes × 2 locales = 38 statically generated pages.

---

## Success Criteria

- [ ] Animation system functional — FadeUp, StaggerContainer, AnimatedCard, CountUp all working
- [ ] `prefers-reduced-motion` respected — all animations disabled when active
- [ ] Home page matches EmbassyOS institutional quality — dark navy hero, metrics panel, before/after section, trust bar, tier preview, CTA section
- [ ] /platform hub page live with four subpage cards
- [ ] All four platform subpages live — hero, challenge, solution cards, metrics, CTA strip — in both locales
- [ ] /solutions live with all five persona cards
- [ ] Cookie consent banner appears on first load, disappears after choice, does not reappear
- [ ] /resources hub and all five resource subpages live
- [ ] /legal page live with all five anchored sections and working anchor navigation
- [ ] Header navigation updated with dropdowns for Platform and Resources
- [ ] Footer updated with four-column structure
- [ ] All 38 routes return 200 in both locales
- [ ] All visible text through next-intl translation keys — zero hardcoded strings
- [ ] Full FR translation coverage — not stubs
- [ ] No TypeScript errors in strict mode
- [ ] `next build` completes cleanly — all 38 pages statically generated
- [ ] Production build recommended for visual review (dev server compilation is slow)

---

## Explicitly Out of Scope

- Authentication or session management
- Database migrations or RLS policies
- Tenant logic of any kind
- Embassy workspace, dashboard, or registrant portal screens
- Production Supabase connection
- Real data in metrics (CountUp targets are capability numbers, not live data)
- Newsletter subscribe backend (UI only — no email service integration)
- Contact form backend (UI only — no form submission handling)

---

## Engineering Guardrails

Everything from Mission 001 applies, plus:

- **Framer Motion only for animation** — no CSS animation libraries, no GSAP
- **AnimatedCard is the single hover animation pattern** — do not create per-component hover logic
- **FadeUp wraps sections, StaggerContainer wraps card grids** — consistent pattern everywhere
- **Cookie banner uses native cookie API** — no external cookie library
- **Legal content is sovereign-grade** — no boilerplate generator language; draw from Doc 10 and Doc 11
- **No Lorem Ipsum anywhere** — every page has real, mission-appropriate content

---

## Completion Sign-Off

When Mission 001-A is complete, confirm before closing:

1. All 38 routes tested in browser — EN and FR
2. Animation system tested — scroll reveal, card hover, CountUp
3. Cookie banner tested — appears, accepts, does not reappear
4. Language toggle tested across all new routes
5. Navigation dropdowns tested — Platform and Resources menus
6. `next build` clean with all 38 pages generated
7. No TypeScript errors
8. Visual review done on production build (not dev server)
9. Ready to proceed to Mission 002 — Authentication & Tenant Foundation

---

*Document location: `C:\Users\ikour\Projects\civis\Project Instructions\Mission_001A_Visual_Enhancement.md`*  
*Program Owner: Afronovation, Inc.*  
*Classification: Internal — Build Team Only*  
*Depends on: Mission_001_Foundation_Scaffold.md*