# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Di Barret — single-page Danish-language marketing site for a brand-system studio (`lang="da"`). Three hand-authored files at the repo root: `index.html`, `styles.css`, `main.js`. No framework, no bundler, no `package.json`, no tests, no build step. Fonts come from Google Fonts (Geist / Geist Mono / Inter); everything else is local.

Remote: `https://github.com/oreste2b/di-barret-website.git`. Deployed via Vercel (`.vercel/` is gitignored).

## Commands

There is no build, lint, or test tooling. Workflow is "edit file → reload browser → commit → push → Vercel auto-deploys".

- Local preview: `python3 -m http.server 8000` (or `npx serve .`) and open `http://localhost:8000`. Opening `index.html` via `file://` works for most things but can break `fetch`/Google Fonts CORS on some browsers.
- Deploy preview: `vercel deploy`
- Deploy production: `vercel deploy --prod`
- Git history convention: commits are sequenced as `Step N — <section>` for additive section work, or `Fix · <area>` for fixes. Keep that style when adding to the canonical build order.

`.gitignore` excludes `.vercel`, `node_modules/`, `.DS_Store`, and the design handoff artifacts (`di-barret/`, `Di Barret-handoff.zip`) — do not commit those.

## Architecture

### Page composition (single source of truth: `index.html`)

The page is one long static document. Sections are numbered with `kicker` eyebrows (`01 — Problemet`, `02 — Brand System`, …) and must stay in this order — the numbering is part of the design and the in-page nav/footer links depend on the section IDs:

`#top` (hero) → metrics → `#problem` → `#system` → `#services` → `#process` → `#testimonials` → `#team` → `#lead` → `#booking` (final CTA) → `#contact` (footer)

When adding a section, give it a numeric kicker, a section ID, and a corresponding footer link.

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

1. `#lead-form` submit handler: prevents default, removes the form, injects a `.lead__success` confirmation block (markup inlined in JS — keep the `.lead__success*` CSS hooks if you touch it).
2. Delegated click handler for `a[href^="#"]` that smooth-scrolls with a 20px top offset.

There is no router, no analytics, no animation library, and no fetch. The form intentionally does not POST anywhere yet — adding a backend means wiring `e.target` to a real endpoint and only swapping in the success state on success. Do not introduce frameworks or bundlers without a discussion: the project is deliberately a single HTML file.

### Content & copy

All copy is Danish. The brand voice is direct, technical, and confident (see existing section bodies for tone). Founders are **Orestes Barret** (Creative Director) and **Karo Lushi** (Strategy & Build), both based in København — this was wrong in earlier commits and has been explicitly corrected, so do not rename them.
