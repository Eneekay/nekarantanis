---
layout: docs
title: Overview
next_title: Design System
next_url: /docs/design-system.html
---

This is the internal documentation for **nekarantanis.co.uk** — a Jekyll site with a hand-built design system and a Decap CMS admin panel for editing content without touching code. It covers how the CSS theme, the JavaScript behaviors, and the CMS all fit together, so a future change (yours or someone else's) can be made consistently instead of by guesswork.

## What this site is

A static site built with [Jekyll](https://jekyllrb.com/), hosted on GitHub Pages, with three main page types:

- **Home** (`index.html`) — hero intro, impact stats, leadership pillars, featured roles, education strip
- **About** (`About.html`) — a CV-style page with four jump-linked sections (Leadership, Digital, Research, Education)
- **Blog** (`Blog.html` + `_posts/*.md`) — a featured post, a filterable grid of the rest, and individual post pages

There's no build tooling beyond Jekyll itself — no bundler, no npm dependencies for the front end. `css/custom.css` and `js/site.js` are hand-written and loaded directly on every page via `_layouts/default.html`.

## The three things that make up the theme

<div class="docs-note">
This is the short version — each has its own full page in the sidebar.
</div>

**1. A small set of CSS custom properties** (`--nk-c0` through `--nk-c4`, plus gold) drive every color on the site. Everything else — buttons, cards, section backgrounds, text colors — is a utility class built on top of those variables. See **[Design System](/docs/design-system.html)**.

**2. A handful of reusable section-level components** — dotted/grid textured backgrounds, decorative floating "blobs," animated wave dividers, and drifting SVG contour lines — that combine to give each page header and section its own quiet motion without any of it being page-specific code. See **[Sections & Components](/docs/sections-components.html)**.

**3. One JavaScript file, `js/site.js`**, that layers in every animated behavior — scroll reveals, the homepage's staged intro, the typewriter effect, counting-up stats, the wave drift, and the blog's filter dropdowns — all gated behind `prefers-reduced-motion` and `IntersectionObserver` so nothing animates when it doesn't need to. The contour-line backgrounds are pure CSS, not JS — see **[JavaScript](/docs/javascript.html)**.

## Editing content

Everything editorial — blog posts and the About page's career history — is meant to be edited through **Decap CMS** at `/admin`, not by hand-editing Markdown or YAML (though you can do that too, they're just files). The CMS has a custom icon-picker widget and a live preview styled to match the real site. See the **[CMS Guide](/docs/cms-guide.html)**.

## Where things live

| Area | Path |
|---|---|
| Page templates | `_layouts/default.html`, `_layouts/post.html` |
| Shared partials | `_includes/` |
| Theme CSS | `css/custom.css` |
| Theme JS | `js/site.js` |
| Blog posts | `_posts/*.md` |
| Career history data | `_data/roles.yml` |
| CMS config | `admin/config.yml` |
| CMS custom widgets/preview | `admin/icon-picker.js`, `admin/preview.js` |

See **[File Reference](/docs/reference.html)** for the complete map.
