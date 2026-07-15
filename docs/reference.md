---
layout: docs
title: File Reference
---

A quick map of everything in the repo — what it is and where to look for it.

## Pages

| Path | What it is |
|---|---|
| `index.html` | Home page — hero, impact stats, pillars, featured roles, education strip, CTA |
| `About.html` | CV page — four jump-linked sections (Leadership, Digital, Research, Education) |
| `Blog.html` | Blog listing — featured post, filterable grid |
| `_posts/*.md` | Individual blog posts (rendered through `_layouts/post.html`) |

## Templates & partials

| Path | What it is |
|---|---|
| `_layouts/default.html` | Base HTML shell used by every page: fonts, stylesheets, nav, footer, scripts |
| `_layouts/post.html` | Wraps a blog post's Markdown body with the header/CTA structure |
| `_layouts/docs.html` | This documentation site's layout — sidebar nav, on-page TOC, docs styling |
| `_includes/nav.html` | The fixed top nav bar |
| `_includes/footer.html` | Site footer |
| `_includes/post-icon.html` | Liquid `case`/`when` — renders one of 41 named icons as inline SVG path data |
| `_includes/role-company.html` | Renders one company + its positions on the About page |
| `_includes/docs-nav.html` | The docs sidebar's link list |

## Data

| Path | What it is |
|---|---|
| `_data/roles.yml` | All career history shown on the About page — companies, each with a list of positions |
| `_config.yml` | Jekyll site config — permalink structure, Markdown settings, layout defaults |

## Theme

| Path | What it is |
|---|---|
| `css/custom.css` | The entire hand-written theme: palette, type scale, utilities, every component, every animation keyframe |
| `css/bootstrap.min.css` | Bootstrap, used only for its grid and a handful of layout utility classes |
| `js/site.js` | Every animated/interactive behavior — see [JavaScript](/docs/javascript.html) |
| `js/bootstrap.bundle.min.js` | Bootstrap's JS, used for the mobile nav's collapse behavior |

## CMS (Decap)

| Path | What it is |
|---|---|
| `admin/index.html` | The CMS entry point (`/admin`) — loads Decap CMS itself plus the two custom scripts below |
| `admin/config.yml` | Collections, fields, auth backend, editorial workflow settings — see [CMS Guide](/docs/cms-guide.html) |
| `admin/icon-picker.js` | Custom `icon-picker` widget — the clickable icon grid |
| `admin/preview.js` | Real-stylesheet live preview for the post editor |

## This documentation site

| Path | What it is |
|---|---|
| `docs/index.md` | Overview |
| `docs/design-system.md` | Colors, typography, buttons, reveal utilities |
| `docs/sections-components.md` | Backgrounds, blobs, wave dividers, cards, and how they combine |
| `docs/javascript.md` | Every system in `site.js`, explained |
| `docs/cms-guide.md` | How to use the Decap CMS admin panel |
| `docs/assets/docs.css` | Styling for this docs site specifically (not the live site's theme) |
| `docs/assets/docs.js` | On-page TOC generation, mobile nav drawer, code-block copy buttons |
| `docs/assets/screenshots/` | Screenshots embedded throughout these pages |

## Misc

| Path | What it is |
|---|---|
| `uploads/` | Media uploaded through the CMS (logos, post images) |
| `CNAME` | GitHub Pages custom domain config |
| `favicon*.png` / `favicon.svg` / `apple-touch-icon.png` | Site favicons |
| `.github/workflows/jekyll.yml` | GitHub Actions workflow that builds and deploys the site on push to `main` |
