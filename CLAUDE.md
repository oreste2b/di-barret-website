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

Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS), `Cache-Control: no-store` on `/api/*`, long-cache (`immutable`, 1y) on static assets. `cleanUrls: true`. `api/lead.js` capped at 15s.

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
