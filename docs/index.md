---
layout: docs
title: Overview
next_title: Design System
next_url: /docs/design-system.html
---

This is the internal documentation for **nekarantanis.co.uk** — a Jekyll site with a hand-built design system and a Decap CMS admin panel for editing content without touching code. It covers how the CSS theme, the JavaScript behaviors, and the CMS all fit together, so a future change (yours or someone else's) can be made consistently instead of by guesswork.

## What this site is

A static site built with [Jekyll](https://jekyllrb.com/), hosted on GitHub Pages, with these main page types:

- **Home** (`index.html`) — hero intro, impact stats, leadership pillars, featured roles, education strip, latest blog posts, a closing CTA
- **About** (`About.html`) — a CV-style page with four jump-linked sections (Leadership, Digital, Research, Education)
- **Blog** (`Blog.html` + `_posts/*.md`) — a featured post, a live-searchable/filterable grid of the rest (with a card/list view toggle), and individual post pages
- **Research / Publications** (`Publications.html` + `_publications/*.md`) — an overview page with "By the Numbers" stats and a filterable list of papers, plus individual publication pages with a sticky, scrollspy'd table of contents
- **Contact** (`Contact.html`) — a contact form (submitted via Formspree)
- **Privacy** (`Privacy.html`) — the analytics/cookies policy page

There's no build tooling beyond Jekyll itself — no bundler, no npm dependencies for the front end. `css/custom.css` and `js/site.js` are hand-written and loaded directly on every page via `_layouts/default.html`, which also loads [Umami](https://umami.is/) analytics site-wide (a single `<script>` tag, added once in the shared layout rather than per page). GoatCounter has been removed — Umami is now the only analytics provider, described on the Privacy page.

## The three things that make up the theme

<div class="docs-note">
This is the short version — each has its own full page in the sidebar.
</div>

**1. A small set of CSS custom properties** (`--nk-c0` through `--nk-c4`, plus gold) drive every color on the site. Everything else — buttons, cards, section backgrounds, text colors — is a utility class built on top of those variables. See **[Design System](/docs/design-system.html)**.

**2. A handful of reusable section-level components** — dotted/grid/crosses textured backgrounds, decorative floating "blobs," animated wave dividers, drifting SVG contour lines, and the publication page's sticky TOC/reading-progress pattern — that combine to give each page header and section its own quiet motion without any of it being page-specific code. See **[Sections & Components](/docs/sections-components.html)**.

**3. One JavaScript file, `js/site.js`**, that layers in every animated behavior — scroll reveals, the homepage's staged intro, the typewriter effect, counting-up stats, icon draw-on, the wave drift, the reading-progress pill, the blog/publications card-list view toggle, the publication TOC scrollspy, and the blog's category/tag/search filtering — all gated behind `prefers-reduced-motion` and `IntersectionObserver` so nothing animates when it doesn't need to. The contour-line backgrounds are pure CSS, not JS — see **[JavaScript](/docs/javascript.html)**.

## Editing content

Everything editorial — blog posts, publications, and the About page's career history — is meant to be edited through **Decap CMS** at `/admin`, not by hand-editing Markdown or YAML (though you can do that too, they're just files). The CMS has a custom icon-picker widget and a live preview styled to match the real site. See the **[CMS Guide](/docs/cms-guide.html)**.

## Where things live

| Area | Path |
|---|---|
| Page templates | `_layouts/default.html`, `_layouts/post.html`, `_layouts/publication.html` |
| Shared partials | `_includes/` |
| Theme CSS | `css/custom.css` |
| Theme JS | `js/site.js` |
| Blog posts | `_posts/*.md` |
| Publications | `_publications/*.md` |
| Career history data | `_data/roles.yml` |
| Contact / Privacy pages | `Contact.html`, `Privacy.html` |
| CMS config | `admin/config.yml` |
| CMS custom widgets/preview | `admin/icon-picker.js`, `admin/preview.js` |
| License | `LICENSE` (CC BY 4.0 — see the file for the exception covering published-journal research PDFs) |
| Crawling / SEO | `robots.txt`, plus Jekyll's generated `sitemap.xml` and `feed.xml` |

See **[File Reference](/docs/reference.html)** for the complete map.
