---
layout: docs
title: JavaScript
next_title: CMS Guide
next_url: /docs/cms-guide.html
---

All animated behavior lives in one file, `js/site.js`, wrapped in a single `DOMContentLoaded` listener. There's no framework and no build step — every system below is a self-contained block that finds its own elements via `document.querySelectorAll`, does nothing if it finds none, and (with one exception) is skipped entirely under `prefers-reduced-motion: reduce` rather than just running slower.

## Hero intro sequence

The home page (`hero_intro: true` in its front matter, which adds `class="home-hero-intro"` to `<body>`) plays a staged entrance: background fades in, then the nav drops down, then the heading, then the two hero buttons and scroll hint cascade in one after another while the intro paragraph is mid-typewriter. The buttons slide in from opposite sides (`.hero-btn-left` from the left, `.hero-btn-right` from the right) so the pair reads as a symmetric duo rather than a single-file list. This part is pure CSS (`@keyframes heroFadeIn`, `heroNavDrop`, etc., each with its own `animation-delay`), scoped entirely to `body.home-hero-intro` so it never touches any other page's shared nav.

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
- `data-tw-static` on an element (used on CTA headings) skips the letter-by-letter reveal but keeps the trailing blinking cursor as a small decorative touch — full text is written in immediately, with the same `_` cursor span appended right after it, no per-character timeline runs at all.
- CSS hides `[data-typewriter]` text by default (`.js-tw [data-typewriter] { opacity: 0; }`, `.js-tw` being added by an inline `<script>` in `<head>` before anything renders) so there's never a flash of the full static text before the effect takes over — and if JavaScript is disabled entirely, the `.js-tw` class never gets added, so the plain text just shows normally.

## Icon draw-on

Icons inside `.stat-icon` and `.post-card-icon` (the small stroke SVGs used across stat groups, post cards, and pillars) draw their strokes on rather than just appearing, via `stroke-dasharray`/`stroke-dashoffset`: every shape starts fully "undrawn" (`dashoffset` set to its own `getTotalLength()`), then transitions to `0` once the icon scrolls into view (`IntersectionObserver`, `threshold: 0.6`).

Two tiers keep this from reading as busy on compound icons or tiny shapes:

- **Per-shape stagger** (`SHAPE_STAGGER_MS`, 90ms) — a multi-shape icon (e.g. "team": circle+path+circle+path) draws one shape after the next rather than all four at once.
- **Per-icon stagger** (`ICON_STAGGER_MS`, 130ms) — whichever icons the observer reports intersecting in the same callback batch (a whole row of stat icons entering together) are also offset from each other, both for visual calm and to spread out the real paint cost of several icons redrawing their stroke every frame at once.

Two fallbacks skip the draw animation entirely in favor of a plain fade:

- Any individual shape under 10px of path length (`NO_DRAW_LENGTH`) — a growing arc that short reads as a flicker, not a draw.
- Any icon with more than 4 shapes (`MAX_ANIMATED_SHAPES`) — the "tree" icon (4 branches + 4 leaf dots) kept reading as frantic no matter how it was staggered, so past that shape count the whole icon just fades in together instead.
- Any icon inside a `[data-icon-fade-only]` container (used on Publications' "By the Numbers" row) opts out of drawing entirely, even for simple icons — a lone simple icon drawing on next to a compound one popping/fading on its own timeline read as mismatched, so the whole section is fade-only as a group.

## Stat counters

Every `[data-count-to]` inside a `[data-count-group]` (the Home page's "By the Numbers" row) counts up from 0 together, sharing one shared `start` timestamp and a fixed 1400ms duration with an ease-out-cubic curve — so a counter going to `5` and one going to `5,000` both land on their final value at exactly the same moment rather than the small number finishing first and just sitting there. `data-count-prefix`/`data-count-suffix` (e.g. `£` / `%` / `+`) wrap the animated number, and values ≥1000 get `toLocaleString('en-GB')` comma formatting applied each frame. Once every counter in the group lands, each gets a quick `statPop` scale-bounce (`.count-done`) as a small "landed" punctuation mark.

## Wave dividers

Every `svg.wave-divider` path gets a continuously-animated, gently drifting shape — a smooth spline (Catmull-Rom converted to cubic Bezier, `smoothPath`) through a handful of sine-wave-offset points, redrawn every frame by rewriting the path's `d` attribute. Each divider is seeded from its index using the golden ratio (`i * 0.618...`) so a page with several dividers gets well-scattered, never-quite-synchronized phases, speeds, and amplitudes rather than looking copy-pasted. Scrolling temporarily speeds the drift up to ~6x (`VELOCITY_FOR_FULL_BOOST`), easing back to the normal slow pace once the scroll gesture actually stops (a debounced idle timer, not just "last event"). Each wave is also gated by its own `IntersectionObserver` — one that's scrolled off-screen stops being redrawn every frame until it's back in view.

<div class="docs-note" id="wave-dividers">
<strong>The stats section's wave is a special case.</strong> It sits above a section with a grid-textured background, and originally was an SVG <code>&lt;path&gt;</code> filled with a tiled grid <code>&lt;pattern&gt;</code> to match. That approach turned out to be fundamentally unreliable: the wave SVG uses <code>preserveAspectRatio="none"</code> to stretch non-uniformly to the page width, which also stretches anything filled inside it — squeezing thin, low-opacity grid lines through that distortion anti-aliased most of them into invisibility, leaving only a fraction of the lines actually visible and reading as a coarse, misaligned grid.
<br><br>
The fix moves the grid onto a plain <code>&lt;div class="stats-wave-fill"&gt;</code> with a real, undistorted CSS <code>background-image</code> grid (identical technique to <code>.section-light-grid</code> below it), clipped to the wave silhouette via an SVG <code>&lt;clipPath clipPathUnits="objectBoundingBox"&gt;</code> instead of an SVG fill. To keep this one wave animating like all the others, <code>buildWavePath()</code> takes a <code>normalized</code> flag: when set, it builds the exact same 1440×100-space curve everyone else uses, then scales every point down to the 0–1 range <code>objectBoundingBox</code> expects (and raises decimal precision from 1 to 4 places, since 0–1 numbers need much finer resolution than 0–1440 ones to look smooth). The background grid itself never moves — only the clip shape drifts — so the grid stays perfectly aligned with the section below regardless of the animation.
</div>

## Contour-line backgrounds

Dark (and the one light) dotted sections carry a drifting contour-line background instead of any JS-driven animation — `_includes/contour-lines.html` renders a `.contour-bg` div holding an SVG with 3–4 open (unfilled) wave paths, reusing the same curve family as `.wave-divider`. Each path is one 1440-unit period drawn twice across a 2880-wide viewBox; a CSS `@keyframes` animation translates it by exactly `-50%` (one period) on an infinite loop, so the seam where it repeats is invisible. `preserveAspectRatio="none"` plus `height: 100%` on the SVG let the same 0–100-unit paths stretch to whatever height the section actually renders at.

Because the only animated property is `transform`, the browser composites this on the GPU with no per-frame JavaScript at all — `prefers-reduced-motion: reduce` is handled with a plain CSS rule (`animation: none`) rather than a JS check, so it also responds if the setting changes mid-visit. The include takes two params: `variant="hero"` adds a fourth, faintest line for tall page headers (`variant` omitted/anything else gives the 3-line "compact" set for CTA-sized sections), and `tone="light"` switches the stroke to a low-opacity ink color for the one section with a light background (`.section-light-dotted`) instead of the light ink used everywhere else.

One easy-to-miss requirement: the section's actual content wrapper needs its own stacking context above `.contour-bg` (`position: relative` **and** an explicit `z-index`, e.g. the `z-1` utility) — `position: relative` alone leaves `z-index: auto`, and a non-positioned descendant of that wrapper can still end up painted *behind* a later `position: absolute` sibling like `.contour-bg`, regardless of DOM order. Every section using this include already has `z-1` on its content container for exactly this reason.

## Blog category/tag filtering and live search

The category and tag dropdowns on the Blog page are custom button+list widgets, not `<select>` elements — a native select's open popup is browser chrome that can't be restyled to match the theme. `setupDropdown(root, onSelect, onClear)` wires up one dropdown: a trigger button, a `role="listbox"` menu, and a small × button that only appears once a value is picked (living *inside* the same pill as the trigger, not a separate "clear all" button).

A text search box sits alongside the two dropdowns and filters the same grid live, on every keystroke (`input` event, no debounce needed — it's a plain array of ~10 cards). Each card carries a `data-search` attribute that Liquid bakes at build time from its title, summary, category, and tags (lowercased, HTML-stripped), so matching at runtime is just `card.dataset.search.includes(query)` — no DOM text extraction on every keystroke. All three filters (category, tag, search) combine with AND: a card only shows if it passes all of the currently-active ones.

Filtering itself just toggles `.d-none` on each post card client-side and re-runs `assignRevealDirections()` since the visible set (and so each card's row) just changed; an empty result shows a "No posts match that filter" message. The current category/tag/search state is mirrored into the URL query string (`syncUrl`, via `history.replaceState`, search as `?q=`) so a filtered view is shareable/bookmarkable, and read back out on page load. The featured post at the top is never affected by any of this filtering — it's shown unconditionally, independent of the grid below it.

<figure>
  <img src="/docs/assets/screenshots/blog-filter-open.png" alt="Blog page with the category filter dropdown open, showing the custom listbox menu and the search box">
  <figcaption>The category dropdown open — a custom `role="listbox"` menu, not a native `&lt;select&gt;` — next to the live search box.</figcaption>
</figure>

<figure>
  <img src="/docs/assets/screenshots/blog-search-live.png" alt="Blog page with a search query typed in, showing the grid narrowed to matching posts">
  <figcaption>Typing into the search box narrows the grid live, no submit button — matches here are against title, summary, category, and tags.</figcaption>
</figure>

## Reading progress

`readingProgress`/`readingProgressFill` (present on blog post and publication pages only, injected by `_layouts/default.html`) track scroll position on every `scroll` event: the pill gains `.is-visible` once the reader has scrolled past 80px, and the fill's `width` is set to `(scrollY / (documentHeight - viewportHeight)) * 100`, clamped to 0–100. It starts off-screen rather than fully visible on load, since there's nothing "read" yet the moment the page appears. See [Reading progress](/docs/sections-components.html#reading-progress) on the Sections & Components page for the visual/layout side.

## Card/list view toggle

`setupViewToggle(btn, grid, storageKey)` wires up one button+grid pair, cycling through `VIEW_MODES` (`card`, `list`) on click: it sets `grid.dataset.view` (which CSS keys its layout off), updates the button's own label, and re-runs `assignRevealDirections()` since switching modes reflows every card into new rows/columns. The Blog (`postViewToggle`/`postGrid`) and Publications (`pubViewToggle`/`pubGrid`) grids each get their own instance with their own `localStorage` key (`nk-blog-view`, `nk-pub-view`), so a visitor's chosen view for one page doesn't affect the other, and persists across page loads via `localStorage` (falling back silently if storage is unavailable, e.g. private browsing).

## Publication TOC: scrollspy and mobile collapse

The publication article TOC (`#pubTocList`) is built from the article body's own `h2`/`h3` elements rather than a hand-maintained list — kramdown already assigns each heading a stable `id`, so the script just walks `#pubBody h2[id], #pubBody h3[id]` and generates one link per heading (h3s get a `.pub-toc-h3` class for the extra indent).

Which link is highlighted as "active" is **not** driven directly by `IntersectionObserver`'s `isIntersecting` — that approach made a heading's link go dark again the moment the heading scrolled past a fixed activation band, well before the reader had actually finished that section. Instead, every time any heading crosses an 88px-from-top activation line, the whole set is recomputed: the *last* heading whose top has scrolled above that line is the active one, and it stays active for that section's entire length until the next heading crosses.

Below 900px, the same TOC collapses into a single tap-to-expand toggle (`#pubTocToggle` / `#pubTocInner`, CSS-driven via `.is-open`), since the sticky sidebar layout drops out entirely at that width (see [the `.pub-shell` layout](/docs/sections-components.html#publication-layout-toc--article-shell)). Tapping a link inside the open list also closes it again, so a reader who jumps to a section isn't left with the list still covering the top of the article they just navigated to.

## Contact form

The Contact page's form posts to Formspree; `js/site.js` progressively enhances that plain POST-and-redirect into an in-page `fetch` submit so a successful send shows an inline confirmation message instead of leaving the page. On success it resets the form and shows a thank-you message; on a rejected submission it reads Formspree's error response (which comes back in one of two different shapes depending on the failure — a `{ errors: [{ message }] }` array for validation failures, or a single `{ error }` string for account-level rejections) and surfaces whatever Formspree actually said rather than a generic fallback. If `fetch` itself fails (e.g. no network), the form still works via its native `action`/`method`, a real page navigation.

## Nav scroll state

`site.js` toggles `.scrolled` on `#siteNav` once `window.scrollY > 24`, which is what switches the nav from transparent-over-the-hero to a solid background with the logo/links flipping from light to dark text (all handled in CSS via `.site-nav.scrolled` variants). It also keeps a `--nav-h` CSS custom property in sync with the nav's actual rendered height (recalculated on scroll and resize) — used by `.section-subnav`'s `top: var(--nav-h, 69px)` so the About page's sticky jump-nav sits flush under the main nav at any width rather than at a hardcoded offset.
