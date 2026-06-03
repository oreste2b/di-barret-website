# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Di Barret — single-page Danish-language marketing site for a brand-system studio (`lang="da"`). Three hand-authored frontend files at the repo root (`index.html`, `styles.css`, `main.js`) plus one Vercel Function (`api/lead.js`). No framework, no bundler, no `package.json`, no tests, no build step. Fonts come from Google Fonts (Geist / Geist Mono / Inter); everything else is local.

Remote: `https://github.com/oreste2b/di-barret-website.git`. Deployed via Vercel (`.vercel/` is gitignored). Project is linked to Vercel team `oreste2bs-projects`, project `di-barret-website` (id `prj_4Tt3LMRkIO4RYlYCuxs6dZJmKQsQ`). Custom domain: `www.dibarret.dk`.

## Commands

There is no build, lint, or test tooling. Workflow is "edit file → reload browser → commit → push → Vercel auto-deploys".

- Local preview: `python3 -m http.server 8000` (or `npx serve .`) and open `http://localhost:8000`. Opening `index.html` via `file://` works for most things but can break `fetch`/Google Fonts CORS on some browsers.
- Deploy preview: `vercel deploy`
- Deploy production: `vercel deploy --prod`
- Git history convention: commits are sequenced as `Step N — <section>` for additive section work, or `Fix · <area>` for fixes. Keep that style when adding to the canonical build order.

`.gitignore` excludes `.vercel`, `node_modules/`, `.DS_Store`, all `.env*.local` files, and the design handoff artifacts (`di-barret/`, `Di Barret-handoff.zip`) — do not commit those.

### Vercel configuration (`vercel.json`)

Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS), `Cache-Control: no-store` on `/api/*`. `cleanUrls: true`. `api/lead.js` capped at 15s.

**Cache policy by asset type**: images/fonts (`svg|woff2|woff|ttf|otf|png|jpg|jpeg|gif|webp|avif|ico`) stay `immutable, max-age=1y` because their filenames change when content changes (favicons, og.png are rewritten when regenerated). **CSS/JS** use `max-age=3600, must-revalidate` (1h cache with revalidation) because their filenames stay stable — without this, browsers hold the old CSS for up to a year after a deploy. When making CSS changes that need to ship immediately to existing visitors, also bump the query-string version: `styles.css?v=N` → `styles.css?v=N+1`.

### Content section: `/cases/`

Bilingual (Danish + Spanish) case study section — real client work delivered by Di Barret. Strategy is **DA + ES on purpose** (not DA + EN): ES serves the Cuban-American Miami market (Pichy Boy, 1NationUp, Efecto Ñoh) and Spain (Clínica Bioever). Each case page renders both languages via `data-lang="da"` and `data-lang="es"` blocks; a fixed top-right `.lang-toggle` switches them and persists choice in `localStorage["dibarret_lang"]`. Browser locale is the initial fallback (`navigator.language` slice 0-2, default DA).

Structure:
- `/cases/case.css` — shared CSS for the index + all case pages. Defines `.cs`, `.cs-hero`, `.cs-results`, `.cs-body`, `.cs-index`, `.cs-card`, `.cs-cta`, plus the bilingual `[data-lang]` selectors and `.lang-toggle`.
- `/cases/index.html` — listing page (CollectionPage JSON-LD, `inLanguage: ["da-DK","es-ES"]`, hreflang DA/ES/x-default)
- `/cases/<slug>.html` — individual bilingual case (Article JSON-LD, key results bar, 5 narrative sections: Udfordringen/Desafío → Tilgangen/Enfoque → Udførelse/Ejecución → Resultater/Resultados → Hvad vi lærte/Lo aprendido)

Two case types supported:
- **Build cases** — full delivery (strategy → design → build → deploy). None currently published; live cases are all audit-type.
- **Audit cases** — Brand Audit deliverables (12-dimension scorecard or full 10-section template, prioritized fixes, 30-day action plan). Example: `/cases/audit-dubbu` (full canonical 10-section template — see below).

**Retirados (jun 2026)**: `/cases/isabella-abreu` (Phase 2 build personal brand Cuban F4 driver) y `/cases/audit-isabella-abreu` (personal brand audit). Cliente no responde mensajes ni email, decisión de retirar el case. Archivos eliminados del repo y sitemap, no redirect (404 normal).

`/cases/` is reserved for **client work only**. The previous self-references (`/cases/dibarret-dk` build meta-case and `/cases/audit-dibarret-dk` self-audit) were removed in June 2026 — the site itself stands as proof of capability, the cases section showcases clients.

Pre-publication audit drafts for clients pending approval live at root level under `/audit-<client>` with `<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">`, NOT linked from anywhere on the site and NOT added to sitemap. On client sign-off, the audit either migrates into `/cases/audit-<client>` with the canonical bilingual format, or stays at root and gets the `noindex` dropped + a CASE card in `/cases/index.html` linking to it.

Current live (1 jun 2026):
- `/audit-1nationup` (Miami brand-system + production agency, ES-only, linked as CASE 04 from `/cases/index.html`).
- `/audit-lospichyboys` (Cuban-American comedy podcast in Miami, business audit with revenue model 60/25/15 + customer journey dual sponsor/fan + plan A/B/C, ES-only, linked as CASE 05).
- `/auditoria-seo-lospichyboys` (Companion SEO audit for same client. Premium interactive HTML with Chart.js embedded, dark/light toggle, sticky sidebar, severity filter, sortable comparison table, kanban action plan, print-to-PDF. 290 KB. 45 findings, 40/100 score, 10 keyword opportunities with real SERP validation).
- `/propuesta-web-lospichyboys` (3-tier custom Next.js + GSAP + Sanity build proposal anchored to Rebeca 2026 premiere). Links to live demo at `/demo-lospichyboys`.
- `/demo-lospichyboys` (Live GSAP teaser of Tier 2 / Tier 3 deliverable. Single-file HTML autocontained except GSAP CDN. Uses ScrollSmoother + ScrollTrigger + SplitText + parallax + 4-act pin scrollytelling + horizontal pinned scroll + animated stat counters + magnetic CTA. Cinema-noir aesthetic — Cormorant Garamond serif, burgundy + gold + cream palette, film grain overlay, radial vignette. Anchored to Rebeca 2026 premiere narrative. Sales tool linked from the proposal CTA.).
- `/audit-efectonoh` (Cuban boutique brand studio with two cofounders working remote from US and Spain. 15 findings including invisible-on-Google-by-own-name, 2 duplicate H1 with typo, LinkedIn link going to admin dashboard, 42% images without alt, Hostinger Builder limits. Score 40/100. ES-only, linked as CASE 06).
- `/audit-clinicabioever` (First aesthetic medicine and Age Management clinic in Las Palmas de Gran Canaria, allied with Dr. Oliver Zolman from London. 16 findings including two different addresses website-vs-Google, two duplicate domains .com+.es without canonical, four H1 on home, only H2 being cookies banner, zero medical schema markup, Oliver Zolman not named on website, no online booking, monolingual in health tourism zone, x-powered-by exposing PHP/8.2.30, only 457 words on home. Score 42/100. Laravel + Vite + Inertia stack detected. ES-only, linked as CASE 07).

Pages remain at root rather than `/cases/<slug>` because they were authored as standalone ES-only deliverables; canonical bilingual /cases/ migration is optional future work. CASE 05 in `/cases/index.html` links to the business audit at `/audit-lospichyboys`; from there the user can navigate to the SEO companion and the web proposal.

### Canonical audit template — 10 sections

All client-deliverable audits going forward use this structure (anchored `#s00` through `#s10`):

- **00 — Resumé / Resumen ejecutivo** — `cs-stats-3` row + `cs-quote` thesis + 3 priority leaks bullet
- **01 — Digital røntgen / Radiografía digital** — `cs-stats-3` (value prop, journey, support) + `cs-table` friction audit
- **02 — Trustpilot & reputación** — `cs-bars` volume chart + `cs-bars` response-time chart + `cs-stats-3` (strength/gap/opportunity)
- **03 — Instagram & contenido** — observable fact card + estimated cost card
- **04 — Mapa competitivo** — `cs-table` competitor map + `cs-quote` disruption risk
- **05 — Fugas de capital / Capital leaks** — `cs-bars` monthly leaks + `cs-fugas` 6-card grid + `cs-total` summary panel
- **06 — Matrices de posición** — two `cs-matrix` 2×2 quadrants (tech maturity, impact/effort)
- **07 — Roadmap IA** — `cs-accordion` with 4 `<details>` items (AI agent, Trustpilot auto, content system, CRM lifecycle)
- **08 — Propuesta económica** — `cs-phases` 3-up pricing cards + breakdown `cs-table`
- **09 — ROI vs empleado** — `cs-roi` comparison panel (salary col vs Di Barret col + diff)
- **10 — Próximo paso** — `cs-steps` 3-up (workshop → proposal → 90-day live) + final `cs-cta`

Plus: sticky top nav `cs-audit-nav` linking to all 10 anchors, `cs-client-meta` pill row in hero with `<strong>` labels.

All components defined in `cases/case.css`. Bilingual DA + ES throughout via `data-lang` spans. Article JSON-LD with `about: Organization` (with CVR identifier) or `about: Person` depending on client type. Sign as **Orestes Barret** (the brand name) — never "Baratuti". Email is always `orestes@dibarret.dk` (`.dk`, never `.com`).

Every case must:
1. Include both DA and ES copy in `<span data-lang="da">…</span><span data-lang="es">…</span>` pairs (never DA-only or ES-only — the toggle hides whichever isn't active)
2. Set `<html lang="da">` initially; the toggle JS rewrites it to `es` when ES is active
3. Embed the same language-toggle IIFE pattern (search `data-set-lang` in `/cases/index.html`)
4. Include hreflang `<link rel="alternate">` for da, es, x-default in `<head>`
5. Have JSON-LD with `inLanguage: ["da-DK","es-ES"]`
6. Be added to `sitemap.xml` with `<xhtml:link rel="alternate" hreflang>` entries for da/es/x-default
7. Be linked from `/cases/index.html` grid and (if flagship) referenced from the main site

CSS-only fallback for no-JS: `body:not([data-active-lang]) [data-lang="da"] { display: revert; }` keeps DA visible until JS runs.

Card states in the index grid: live cards are `<a class="cs-card">`, upcoming cases use `<div class="cs-card cs-card--soon" data-soon-label="…">` (greyed, pointer-events:none, label appended via `::after`).

## Architecture

### Page composition (single source of truth: `index.html`)

The page is one long static document. Sections are numbered with `kicker` eyebrows (`01 — Problemet`, `02 — Brand System`, …) and must stay in this order — the numbering is part of the design and the in-page nav/footer links depend on the section IDs:

`#top` (hero) → metrics → `#problem` (01) → `#system` (02) → `#services` (03) → `#process` (04) → `#bygget` (05 — honest "vi er nye", replaced the old testimonials section in Audit Pass 1) → `#team` (06) → `#hvorfor` (07 — answers the "why pick us" objection, added in Audit Pass 1) → `#lead` (08) → `#booking` (09 — final CTA) → `#contact` (footer)

When adding a section, give it a numeric kicker, a section ID, and a corresponding footer link. **Never re-introduce fictional testimonials in `#bygget` — the meta-case (this website) + "send cases via DM" pattern is intentional and matches the brand's direct/honest voice.**

Services in `#services` carry Danish names (Visuel landing / Brand-oplevelse / Web-oplevelse / Vækst-fundament), a 3-bullet `service__deliverables` list, a `service__pricing` row with "Fra X DKK" and "Tidsramme", plus the original "Ideal for" footer. Pricing tier reference: Landing 8k / Brand 25k / Web 35k / Vækst 50k DKK — adjust to reality, but keep numeric anchors so buyers can self-select.

### CSS architecture (`styles.css`, ~1300 lines)

- **Design tokens** live in `:root` at the top: color (`--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--line`, `--line-mid`, `--accent`), font stacks (`--display` Geist, `--body` Inter, `--mono` Geist Mono), and layout (`--max: 1320px`, `--pad: 32px`). Always reach for these vars — do not hardcode colors or paddings.
- **Section-banner convention**: each section starts with a banner comment `/* === SECTION NAME === */` matching the HTML order. Keep this for navigation.
- **BEM naming**: `.block`, `.block__element`, `.block--modifier` (e.g. `.layer`, `.layer__top`, `.layer__status--beta`). All section styles are namespaced by block.
- **Hairline-grid pattern**: most multi-card sections (`.system__grid`, `.services__grid`, `.testimonials__grid`) use 1px `var(--line)` borders on the container + bottom/right borders on children to draw a single-pixel grid. Reuse this rather than inventing card chrome.
- **Status-dot palette**: `#34d399` for "Aktiv", `#fbbf24` for "Beta" are the only non-grayscale accent colors. The rest of the palette is pure black/white with alpha-derived greys via `--ink-*` and `--line*`.
- **Responsive is consolidated at the bottom** (single `RESPONSIVE` block), breakpoints `1024 / 900 / 640 / 420`. When adding component CSS, add the desktop rules in the section block and add any overrides to the existing responsive block — do not scatter `@media` queries throughout the file.
- **Typography**: display headings use `var(--display)` with negative letter-spacing (`-0.025em`) and `font-weight: 400`. Mono is reserved for kickers, numeric labels, and status chips with uppercase tracking. Numeric labels use `font-variant-numeric: tabular-nums`.
- **Effects**: a single SVG `feTurbulence` data-URI in `.noise` provides the film-grain overlay (no JS). `backdrop-filter: blur` is used for the nav glass.

### JavaScript (`main.js`)

A single IIFE with two behaviors only:

1. `#lead-form` submit handler: validates name/email, POSTs JSON to `/api/lead`, manages loading/error states via `#lead-status` (ARIA live), and on success removes the form and injects the `.lead__success` block.
2. Delegated click handler for `a[href^="#"]` that smooth-scrolls with a 20px top offset.

No router, no analytics, no animation library. Error copy is Danish-only. Do not introduce frameworks or bundlers without a discussion: the project is deliberately a single HTML file plus a single Function.

### Backend (`api/lead.js`)

Single Vercel Function (Node.js runtime, Fluid Compute, no npm deps). Calls Resend REST API via native `fetch` to send a notification to `kontakte@dibarret.dk` and an auto-reply to the lead. Guards: honeypot field (`company`), time-trap (rejects sub-1.5s submits), per-instance rate limiter (5/min/IP), strict payload validation, HTML escaping.

Required env vars (set in Vercel dashboard or `vercel env add`):

- `RESEND_API_KEY` — Resend API key with "Sending access" scope
- `LEAD_FROM` — verified sender, e.g. `Di Barret <kontakte@dibarret.dk>`
- `LEAD_NOTIFY_TO` — notification recipient, e.g. `kontakte@dibarret.dk`
- `LEAD_REPLY_TO` — optional Reply-To on the auto-reply (defaults to `LEAD_NOTIFY_TO`)

See `.env.example` for the template. The Resend dashboard owns DNS verification for `dibarret.dk` (SPF/DKIM/DMARC).

### Content & copy

All copy is Danish. The brand voice is direct, technical, and confident (see existing section bodies for tone). Founders are **Orestes Barret** (Creative Director) and **Karo Lushi** (Strategy & Build), both based in København — this was wrong in earlier commits and has been explicitly corrected, so do not rename them.
