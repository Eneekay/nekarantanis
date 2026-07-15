---
layout: docs
title: JavaScript
next_title: CMS Guide
next_url: /docs/cms-guide.html
---

All animated behavior lives in one file, `js/site.js`, wrapped in a single `DOMContentLoaded` listener. There's no framework and no build step — every system below is a self-contained block that finds its own elements via `document.querySelectorAll`, does nothing if it finds none, and (with one exception) is skipped entirely under `prefers-reduced-motion: reduce` rather than just running slower.

## Hero intro sequence

The home page (`hero_intro: true` in its front matter, which adds `class="home-hero-intro"` to `<body>`) plays a staged entrance: background fades in, then the nav drops down, then the heading, then the three hero buttons and scroll hint cascade in one after another while the intro paragraph is mid-typewriter. This part is pure CSS (`@keyframes heroFadeIn`, `heroNavDrop`, etc., each with its own `animation-delay`), scoped entirely to `body.home-hero-intro` so it never touches any other page's shared nav.

<div class="docs-note" id="hero-intro-sequence">
<strong>The bug this uncovered:</strong> those one-shot entrance animations use <code>animation-fill-mode: both</code> so a button holds its final position during its delay instead of flashing into view unstyled. But <code>fill-mode: both</code> keeps the animation "in effect" on the <code>transform</code> property forever — which silently blocked the ordinary hover-lift transition every button on the site has, since two rules were fighting over the same CSS property. The fix, in <code>site.js</code>, listens for <code>animationend</code> on each hero button and sets <code>el.style.animation = 'none'</code> once the entrance animation genuinely finishes, releasing the property back to the normal <code>:hover</code> transition. It carefully skips this for <code>.scroll-hint</code> while its <em>infinite</em> bounce animation is still the one running, checking <code>e.animationName === 'scrollBounce'</code>.
</div>

## Scroll reveals

Three attribute selectors (`[data-reveal]`, `[data-reveal-grid]`, `[data-reveal-split]`) opt an element into fade/slide-up-on-scroll. A single `IntersectionObserver` (falling back to "just show everything" if the browser doesn't support it) adds `.is-visible` the first time each element enters the viewport, then stops observing it — the animation only ever plays once per page load.

`[data-reveal-grid]` additionally gets a *direction* computed at runtime rather than hardcoded: `assignRevealDirections()` groups each grid's children by their rendered `offsetTop` (i.e. which row they landed in after the browser wraps the grid), sorts each row by `offsetLeft`, and marks the first item `left`, the last item `right`, and anything else `up`. This re-runs on window resize (debounced 150ms) and whenever the Blog page's filters change which cards are visible — so a 4-column row that becomes a 2-column row on a narrower viewport (or a filtered-down set of cards) still gets a sensible per-card direction instead of an assumption baked in at author time.

## Typewriter effect

Any element with `[data-typewriter]` — including every blockquote pull-quote inside a post body, tagged automatically via `document.querySelectorAll('.post-body-inner blockquote p')` — has its text revealed one character at a time once it scrolls into view (again via `IntersectionObserver`, `threshold: 0.1`).

Implementation notes worth knowing if you're touching this code:

- Every character is laid out up front as an invisible `<span class="tw-char tw-char--pending">` so the element already occupies its final width/height from frame one — this keeps centered headings anchored in place instead of visibly growing outward as text fills in.
- The blinking `_` cursor is a separately positioned absolute element that's repositioned after each character (`placeCursor`), rather than an inline character in the text flow — an inline cursor occasionally pushed a line just over its wrap width, causing a visible stutter as a word jumped to the next line and back.
- The just-typed character sits in the accent color (`.tw-char--accent`) until the next one appears, then settles to the normal text color.
- `data-tw-delay="850"` on an element (used on the home hero's intro paragraph) delays the start so it can be timed against the hero's own staged entrance rather than firing the instant it's visible.
- CSS hides `[data-typewriter]` text by default (`.js-tw [data-typewriter] { opacity: 0; }`, `.js-tw` being added by an inline `<script>` in `<head>` before anything renders) so there's never a flash of the full static text before the effect takes over — and if JavaScript is disabled entirely, the `.js-tw` class never gets added, so the plain text just shows normally.

## Stat counters

Every `[data-count-to]` inside a `[data-count-group]` (the Home page's "By the Numbers" row) counts up from 0 together, sharing one shared `start` timestamp and a fixed 1400ms duration with an ease-out-cubic curve — so a counter going to `5` and one going to `5,000` both land on their final value at exactly the same moment rather than the small number finishing first and just sitting there. `data-count-prefix`/`data-count-suffix` (e.g. `£` / `%` / `+`) wrap the animated number, and values ≥1000 get `toLocaleString('en-GB')` comma formatting applied each frame. Once every counter in the group lands, each gets a quick `statPop` scale-bounce (`.count-done`) as a small "landed" punctuation mark.

## Wave dividers

Every `svg.wave-divider` path gets a continuously-animated, gently drifting shape — a smooth spline (Catmull-Rom converted to cubic Bezier, `smoothPath`) through a handful of sine-wave-offset points, redrawn every frame by rewriting the path's `d` attribute. Each divider is seeded from its index using the golden ratio (`i * 0.618...`) so a page with several dividers gets well-scattered, never-quite-synchronized phases, speeds, and amplitudes rather than looking copy-pasted. Scrolling temporarily speeds the drift up to ~6x (`VELOCITY_FOR_FULL_BOOST`), easing back to the normal slow pace once the scroll gesture actually stops (a debounced idle timer, not just "last event"). Each wave is also gated by its own `IntersectionObserver` — one that's scrolled off-screen stops being redrawn every frame until it's back in view.

<div class="docs-note" id="wave-dividers">
<strong>The stats section's wave is a special case.</strong> It sits above a section with a grid-textured background, and originally was an SVG <code>&lt;path&gt;</code> filled with a tiled grid <code>&lt;pattern&gt;</code> to match. That approach turned out to be fundamentally unreliable: the wave SVG uses <code>preserveAspectRatio="none"</code> to stretch non-uniformly to the page width, which also stretches anything filled inside it — squeezing thin, low-opacity grid lines through that distortion anti-aliased most of them into invisibility, leaving only a fraction of the lines actually visible and reading as a coarse, misaligned grid.
<br><br>
The fix moves the grid onto a plain <code>&lt;div class="stats-wave-fill"&gt;</code> with a real, undistorted CSS <code>background-image</code> grid (identical technique to <code>.section-light-grid</code> below it), clipped to the wave silhouette via an SVG <code>&lt;clipPath clipPathUnits="objectBoundingBox"&gt;</code> instead of an SVG fill. To keep this one wave animating like all the others, <code>buildWavePath()</code> takes a <code>normalized</code> flag: when set, it builds the exact same 1440×100-space curve everyone else uses, then scales every point down to the 0–1 range <code>objectBoundingBox</code> expects (and raises decimal precision from 1 to 4 places, since 0–1 numbers need much finer resolution than 0–1440 ones to look smooth). The background grid itself never moves — only the clip shape drifts — so the grid stays perfectly aligned with the section below regardless of the animation.
</div>

## Network canvas

Every `.section-dark-dotted` element automatically gets a `<canvas class="network-canvas">` inserted as its first child — a faint, slow-drifting node-and-line graph layered behind the real content, animated on a shared `requestAnimationFrame` loop across all instances. Node count scales with the section's area (`area / 8500`, clamped 24–110); nodes bounce gently off the section's edges, and any two within 175px are connected with a line whose opacity fades with distance.

Nodes are seeded on a **jittered grid** rather than pure random placement: the section is divided into roughly-square cells (one node per cell, positioned randomly *within* that cell) so coverage is guaranteed edge-to-edge — pure random placement occasionally clumped by chance and left an entire edge (often the right side, on a wide section) empty. Canvas size is re-measured on resize (debounced 200ms) and again once web fonts finish loading (`document.fonts.ready`), since font loading can reflow a section's height after the first layout pass. Skipped entirely under reduced motion, rather than drawn once and left static — a frozen, half-connected graph reads as broken, not intentional.

## Blog filter dropdowns

The category and tag dropdowns on the Blog page are custom button+list widgets, not `<select>` elements — a native select's open popup is browser chrome that can't be restyled to match the theme. `setupDropdown(root, onSelect, onClear)` wires up one dropdown: a trigger button, a `role="listbox"` menu, and a small × button that only appears once a value is picked (living *inside* the same pill as the trigger, not a separate "clear all" button). Filtering itself just toggles `.d-none` on each post card client-side and re-runs `assignRevealDirections()` since the visible set (and so each card's row) just changed. The current category/tag selection is mirrored into the URL query string (`syncUrl`, via `history.replaceState`) so a filtered view is shareable/bookmarkable, and read back out on page load. The featured post at the top is never affected by filtering — it's shown unconditionally, independent of the grid below it.

<figure>
  <img src="/docs/assets/screenshots/blog-filter-open.png" alt="Blog page with the category filter dropdown open, showing the custom listbox menu">
  <figcaption>The category dropdown open — a custom `role="listbox"` menu, not a native `&lt;select&gt;`.</figcaption>
</figure>

## Nav scroll state

`site.js` toggles `.scrolled` on `#siteNav` once `window.scrollY > 24`, which is what switches the nav from transparent-over-the-hero to a solid background with the logo/links flipping from light to dark text (all handled in CSS via `.site-nav.scrolled` variants). It also keeps a `--nav-h` CSS custom property in sync with the nav's actual rendered height (recalculated on scroll and resize) — used by `.section-subnav`'s `top: var(--nav-h, 69px)` so the About page's sticky jump-nav sits flush under the main nav at any width rather than at a hardcoded offset.
