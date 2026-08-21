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
| `Blog.html` | Blog listing — featured post, filterable/card-list-toggleable grid |
| `_posts/*.md` | Individual blog posts (rendered through `_layouts/post.html`) |
| `Publications.html` | Research listing — header, "By the Numbers" stats, filterable/card-list-toggleable list |
| `_publications/*.md` | Individual publication pages (rendered through `_layouts/publication.html`) |
| `Contact.html` | Contact form (Formspree) |
| `Privacy.html` | Analytics/cookies policy page |

## Templates & partials

| Path | What it is |
|---|---|
| `_layouts/default.html` | Base HTML shell used by every page: fonts, stylesheets, nav, footer, scripts, the site-wide Umami analytics tag, and a sitewide `Person` JSON-LD block (name, alternate names, social profile links) for search-engine entity matching |
| `_layouts/post.html` | Wraps a blog post's Markdown body with the header/CTA structure. The header also computes a reading-time estimate at build time (word count ÷ 200wpm, `ceil`'d, minimum 1) and, if `site.pageviews.worker_url` is set, adds a `#postReads` element that `site.js` fills in client-side |
| `_layouts/publication.html` | Wraps a publication's Markdown body with the `.pub-shell` sticky-TOC + article structure |
| `_layouts/docs.html` | This documentation site's layout — sidebar nav, on-page TOC, docs styling |
| `_includes/nav.html` | The fixed top nav bar |
| `_includes/footer.html` | Site footer — links every nav item, plus RSS |
| `_includes/post-icon.html` | Liquid `case`/`when` — renders one of 41 named icons as inline SVG path data |
| `_includes/role-company.html` | Renders one company + its positions on the About page |
| `_includes/contour-lines.html` | Drifting SVG contour-line background used on dotted headers/sections |
| `_includes/cusdis.html` | Cusdis comments widget — included at the end of `_layouts/post.html` and `_layouts/publication.html` only; renders nothing until `site.cusdis.app_id` is set. Takes a `closing_wave` param (used by `post.html` only) to draw the light-to-dark wave divider into the CTA section that follows, since inserting comments between the article and CTA displaced the wave that used to live there |
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
| `admin/index.html` | The CMS entry point (`/admin`) — loads Decap CMS (pinned to `3.14.1`) plus the two custom scripts below, and the pinned "Umami ↗" / "Cusdis ↗" / "Docs ↗" / "View site ↗" buttons |
| `admin/config.yml` | Collections (Blog Posts, Publications, About Page), fields, auth backend, editorial workflow settings, `site_url` (powers Decap's per-entry live-page preview link) — see [CMS Guide](/docs/cms-guide.html) |
| `admin/icon-picker.js` | Custom `icon-picker` widget — the clickable icon grid, shared by posts, publications, and career roles |
| `admin/preview.js` | Real-stylesheet live preview for the post editor |

## External services (not part of this repo)

Two small Cloudflare Workers this site depends on but doesn't contain the code for — each holds a credential that can't safely live in this repo's client-side JS, and exposes only a narrow, purpose-built endpoint back to the site:

| Worker | What it does |
|---|---|
| `decap-cms-auth` (github.com/Eneekay/decap-cms-auth) | Relays the GitHub OAuth handshake for Decap CMS logins — see the comment at the top of `admin/config.yml` |
| `umami-pageviews-proxy` | Reads Umami's pageview data server-side and answers "how many times has this URL been viewed" for `site.js`'s read-count fetch, without exposing the Umami login used to query it. Its URL is set as `site.pageviews.worker_url` in `_config.yml` |

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
| `uploads/` | Media uploaded through the CMS (logos, post images, publication PDFs) |
| `LICENSE` | CC BY 4.0 for both code and content, with an exception carved out for published-journal research PDFs under `_publications`/`uploads/publications` (those remain under their original publisher's copyright/license) |
| `robots.txt` | Crawler rules |
| `sitemap.xml` / `feed.xml` | Generated by Jekyll at build time, not source files — no corresponding file to hand-edit in the repo |
| `CNAME` | GitHub Pages custom domain config |
| `favicon*.png` / `favicon.svg` / `apple-touch-icon.png` | Site favicons |
| `.github/workflows/jekyll.yml` | GitHub Actions workflow that builds and deploys the site on push to `main` |
