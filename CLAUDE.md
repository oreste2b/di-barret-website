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

### Content section: `/teardowns/`

Long-form brand-system analyses of iconic brands (LEGO, Carlsberg, Novo Nordisk, etc.) — authority-building content under our own domain. Strategy is deliberately about **large brands we will never have as clients**, NOT about prospects (auditing a prospect publicly burns the prospect — see Audit Pass 1 lesson).

Structure:
- `/teardowns/teardown.css` — shared CSS for all teardown pages (article layout, scorecard, panels)
- `/teardowns/index.html` — listing page (CollectionPage JSON-LD)
- `/teardowns/<slug>.html` — individual teardown (Article JSON-LD, ~2500 words, scorecard 0-10 across 5 dimensions)
- `/teardowns/og-<slug>.png` — per-teardown OG image (1200×630, generated via `python3 + Pillow`)

Every teardown must:
1. Have `lang="da"` (content is Danish like the rest of the site)
2. Use the standard 5-dimension scorecard (Strategi & positionering, Visuel identitet, Verbal identitet, Digital oplevelse, Touchpoint-koherens — 0-10 each, total /50)
3. Include "What they did well" + "What we'd do different" panels
4. End with a CTA linking to `/#lead` and `https://wa.me/4528898373`
5. Be added to `sitemap.xml` with its own `<url>` entry + image entry
6. Be linked from `/teardowns/index.html` and from main `index.html` footer Discover list

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
