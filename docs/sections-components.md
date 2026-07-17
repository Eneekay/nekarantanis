---
layout: docs
title: Sections & Components
next_title: JavaScript
next_url: /docs/javascript.html
---

The site's visual rhythm comes from a small set of section-level building blocks that get reused across every page: textured backgrounds, floating decorative "blobs," animated wave dividers, and cards. None of them are page-specific — the same handful of classes assemble into the home hero, the About header, the Blog header, and every post header. This page covers each piece and, most importantly, **how they're meant to combine**.

## Section backgrounds

Four background classes give a section its base texture, all built the same way — a `background-color` plus a repeating `background-image` at `24px 24px`, so every dotted or gridded surface on the site shares one visual rhythm:

```css
.section-dark-dotted   /* --nk-c0, white dots at 5% opacity — used for headers/CTAs */
.section-light-dotted  /* --nk-c3, dark dots at 3.5% — used for secondary content bands */
.section-white-dotted  /* --nk-c4, dark dots at 3.5% — About page's alternating sections */
.section-light-grid    /* --nk-c3, dark grid lines at 1.8% — Home's "By the Numbers" only */
```

<figure>
  <img src="/docs/assets/screenshots/home-stats.png" alt="Impact stats section showing the grid texture and wave divider">
  <figcaption>`.section-light-grid` — the one place on the site that uses a grid instead of dots, to visually set the stats apart as "data."</figcaption>
</figure>

Every dark (and the one light) dotted header/section also includes `{% raw %}{% include contour-lines.html %}{% endraw %}` as its first child — drifting SVG contour lines behind the content (see [JavaScript](/docs/javascript.html#contour-line-backgrounds)).

## Decorative blobs

Soft, semi-transparent circles (or free-form blob shapes) that drift slowly behind a header's content — a bit of organic movement without competing with the text on top. Each page header that has one defines it as an inline `<svg>` with a dedicated position class:

```html
<svg viewBox="0 0 200 200" class="about-header-blob">
  <circle cx="100" cy="100" r="100" fill="var(--nk-c1)"></circle>
</svg>
<svg viewBox="0 0 200 200" class="about-header-blob-2">
  <circle cx="100" cy="100" r="100" fill="var(--nk-c2)"></circle>
</svg>
```

Every blob position class (`.home-hero-blob-1/2`, `.about-header-blob/-2`, `.blog-header-blob/-2`, `.post-header-blob`, `.post-cta-blob-1/2`) is just `position: absolute` with its own corner offset, size, and opacity — then all of them share one `@keyframes blob-float` animation (a 6-waypoint drift-and-scale loop), each given its own `animation-duration` and a negative `animation-delay` so a page with two blobs never has them moving in sync. The convention is **one larger, more visible blob** (opacity ~0.12) **plus one larger but fainter second blob** (opacity ~0.07–0.08) anchored to the opposite corner — visible on the About and Blog headers:

<figure>
  <img src="/docs/assets/screenshots/about-header.png" alt="About page header showing two decorative blobs and the section jump-nav">
  <figcaption>About header: a cyan blob top-right, a fainter teal blob bottom-left, both drifting independently.</figcaption>
</figure>

All blob animation is skipped under `prefers-reduced-motion: reduce`.

## Wave dividers

The curved SVG shape at the bottom edge of a header or section, giving the straight edge between two background colors a soft, hand-drawn boundary instead of a hard line:

```html
<svg class="wave-divider wave-divider--64" viewBox="0 0 1440 100" preserveAspectRatio="none">
  <path d="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,50 L1440,100 L0,100 Z" class="fill-c3"></path>
</svg>
```

The base `.wave-divider` class is `position: absolute; bottom: -1px` with a default 44px height; `--48`, `--56`, and `--64` modifiers adjust that. The path is filled with whatever color the *next* section is (`.fill-c3`, `.fill-c4`, `.fill-c0` — matching utility classes to the palette above), so it reads as that section's color curving up into the one above it. Every wave divider drifts gently side to side via `site.js` — see [Wave dividers](/docs/javascript.html#wave-dividers) for how that animation works and the one case (the stats section) that needed a different approach.

<div class="docs-note">
The stats section's wave is the one exception to "just an SVG path": it's a real CSS-background <code>div</code> clipped to a wave shape via <code>clip-path</code>, not an SVG fill. That section's background is a grid, and a grid pattern squeezed through a wave divider's non-uniform SVG scaling renders inconsistently — full story in the JavaScript page.
</div>

## Cards

Three card variants, all sharing `.hover-card` for the lift-on-hover behavior (`translateY(-4px)` + shadow):

- **`.post-card`** — blog grid cards: icon, category/date label, title, summary
- **`.role-card`** — the home page's "Featured Roles" cards: logo, company, title, blurb, "Read full role" link
- **`.featured-post-card`** — the Blog page's single featured post, a two-column grid (icon, then text) rather than stacked

`.pillar-card` (Home's "Areas of Focus") and `.info-card` (About page's highlighted current-role box) are simpler — a top accent border or flat background, no hover lift, since they aren't links.

<figure>
  <img src="/docs/assets/screenshots/home-pillars-roles.png" alt="Home page showing pillar cards and role cards side by side">
  <figcaption>`.pillar-card` (top, no hover lift) and `.role-card` (bottom, `.hover-card` lift) on the Home page.</figcaption>
</figure>

## Putting it together: the header pattern

Every page header on the site follows the same recipe, which is why they all feel like the same site despite different content:

```html
<header class="section-dark-dotted text-c3 position-relative overflow-hidden">
  <svg class="about-header-blob">...</svg>
  <svg class="about-header-blob-2">...</svg>
  <div class="container position-relative page-header-inner">
    <!-- eyebrow, h1, intro paragraph -->
  </div>
  <svg class="wave-divider" ...>...</svg>
</header>
```

1. `.section-dark-dotted` for the base texture, plus `{% raw %}{% include contour-lines.html %}{% endraw %}` as the first child for the drifting contour lines
2. Two blobs, largest/most-visible one first
3. Content wrapped in `.container.position-relative` so it stacks above the blobs (which are `z-index: 0`) without needing an explicit `z-index` itself
4. A wave divider closing out the bottom edge, filled with whatever color comes next

The home hero, About header, Blog header, and every post header are all this same structure with different content and blob/wave color choices. When adding a new page header, start from an existing one and swap the content rather than building the pattern from scratch.

<figure>
  <img src="/docs/assets/screenshots/home-hero.png" alt="Home page hero header showing the dark-dotted background, contour lines, two blobs, and wave divider">
  <figcaption>The home hero: `.section-dark-dotted` + contour lines + two blobs + wave divider — the full pattern in one place.</figcaption>
</figure>

Content sections between headers alternate `.bg-c4` (plain) and `.section-white-dotted` / `.section-light-dotted` to keep a long page from feeling flat, as seen across the About page's four jump-linked sections (Leadership, Digital, Research, Education).
