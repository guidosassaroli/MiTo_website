# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiTo is a single-page marketing/landing site for a personal finance app ("Your money, speaking your language"). The entire site lives in one file: `mito.html`.

## Architecture

`mito.html` is a self-contained file with three sections in order:
1. **`<head>`** — Google Fonts imports (Playfair Display, DM Mono, DM Sans) and all CSS in a `<style>` block
2. **`<body>`** — Semantic HTML sections: nav, hero, features, how-it-works, testimonials, pricing, CTA, footer
3. **Inline `<script>`** at the bottom — vanilla JS for scroll animations (IntersectionObserver), nav scroll effects, and any interactive behavior

## Design System

CSS custom properties defined in `:root`:
- Colors: `--ink` (#0a0a0f), `--paper` (#f5f2ec), `--cream`, `--gold` (#c9a84c), `--gold-light`, `--sage`, `--rust`, `--muted`, `--border`
- `--radius: 2px` (intentionally minimal/sharp)
- Typography: Playfair Display (headings/display), DM Mono (labels/UI), DM Sans (body)

## Project Structure

```
public/index.html   ← the entire site (HTML + CSS + JS)
package.json        ← dev script only, no build step
vercel.json         ← points Vercel at the public/ output directory
```

The original `mito.html` is kept at the root for reference; `public/index.html` is the deployed file.

## Development

```bash
npm install         # installs serve (dev only)
npm run dev         # serves public/ on http://localhost:3000
```

## Deployment

The project is configured for Vercel. Push to the linked Git repo and Vercel picks up `public/` as the output directory automatically. No build command needed.

To deploy manually via CLI:
```bash
npx vercel          # preview deployment
npx vercel --prod   # production deployment
```
