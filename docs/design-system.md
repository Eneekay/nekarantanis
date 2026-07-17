---
layout: docs
title: Design System
next_title: Sections & Components
next_url: /docs/sections-components.html
---

Everything visual on the site traces back to `css/custom.css` — one hand-written stylesheet, no CSS framework beyond Bootstrap's grid/utility classes for layout. This page covers the palette, type scale, and the small utility/component classes built on top of them.

## Color palette

Every color on the site is a CSS custom property defined once on `:root`, named `--nk-c0` through `--nk-c4` (dark to light) plus a gold accent. Nothing else hardcodes a hex value — components reference these variables so a palette change only ever happens in one place. `--nk-c1` (kingfisher) has strong contrast on dark sections but fails AA on light ones, so it's only ever used on dark backgrounds or as a solid button's own fill; `--nk-c2` (deep teal) is the accent used against paper/stone.

<div class="docs-swatch-row">
  <div class="docs-swatch">
    <div class="docs-swatch-color" style="background:#12181D;"></div>
    <div class="docs-swatch-name">--nk-c0</div>
    <div class="docs-swatch-hex">#12181D · ink / body text</div>
  </div>
  <div class="docs-swatch">
    <div class="docs-swatch-color" style="background:#3FD0C4;"></div>
    <div class="docs-swatch-name">--nk-c1</div>
    <div class="docs-swatch-hex">#3FD0C4 · kingfisher accent, dark sections only</div>
  </div>
  <div class="docs-swatch">
    <div class="docs-swatch-color" style="background:#1E6E66;"></div>
    <div class="docs-swatch-name">--nk-c2</div>
    <div class="docs-swatch-hex">#1E6E66 · deep teal accent</div>
  </div>
  <div class="docs-swatch">
    <div class="docs-swatch-color" style="background:#E4DFD3;"></div>
    <div class="docs-swatch-name">--nk-c3</div>
    <div class="docs-swatch-hex">#E4DFD3 · stone surface</div>
  </div>
  <div class="docs-swatch">
    <div class="docs-swatch-color" style="background:#F5F2EA;border:1px solid #d8d8d8;"></div>
    <div class="docs-swatch-name">--nk-c4</div>
    <div class="docs-swatch-hex">#F5F2EA · paper surface</div>
  </div>
  <div class="docs-swatch">
    <div class="docs-swatch-color" style="background:#E8A13D;"></div>
    <div class="docs-swatch-name">--nk-gold</div>
    <div class="docs-swatch-hex">#E8A13D · marigold, eyebrow/accent on dark</div>
  </div>
</div>

`--nk-c1` and `--nk-c2` each have a `-h` hover variant (`--nk-c1h`, `--nk-c2h`) that's a slightly darker shade, used on `:hover` states instead of relying on `opacity` or `filter`. There are also `-rgb` variants (`--nk-c0-rgb`, `--nk-c1-rgb`, `--nk-c4-rgb`) holding the same colors as comma-separated R,G,B numbers, so they can be dropped into `rgba(var(--nk-c0-rgb), 0.1)` wherever a translucent tint is needed (borders, subtle fills) — a plain custom property can't be given an alpha channel on its own.

Beyond the five core surfaces, there's a small set of muted text tones for body copy (`--nk-text-muted`, `--nk-text-faint`, `--nk-text-faint-dark`, `--nk-text-cream`, `--nk-text-cream-strong`, `--nk-text-body-dark`) and three shadow presets (`--nk-shadow-btn`, `--nk-shadow-pill`, `--nk-shadow-card`) used by every hover-lift and card.

**Utility classes**, all just aliasing a variable:

```css
.bg-c0 / .bg-c1 / .bg-c2 / .bg-c3 / .bg-c4        /* background-color */
.text-c0 / .text-c1 / .text-c2 / .text-c3 / .text-c4  /* color */
.text-muted-warm / .text-faint / .text-faint-dark
.text-cream / .text-cream-strong / .text-body-dark / .text-gold
.fill-c0 / .fill-c1 / .fill-c3 / .fill-c4          /* SVG fill */
```

## Typography

Two font families, both loaded from Google Fonts in `_layouts/default.html`:

- **Space Grotesk** (500/600/700) — every heading (`h1`–`h4` are set to it globally), plus anywhere `.ff-grotesk` is applied to a non-heading element.
- **Inter** (400/500/600/700) — body text, the default on `<body>`.

Font sizes are all utility classes rather than one-off inline styles, named `.fs-<size>` after their pixel value (each also sets a matching `line-height`):

<div class="docs-fs-row">
  <div><span class="fs-13" style="font-family:'Inter',sans-serif;">Aa</span><span class="docs-fs-tag">.fs-13</span></div>
  <div><span class="fs-16" style="font-family:'Inter',sans-serif;">Aa</span><span class="docs-fs-tag">.fs-16</span></div>
  <div><span class="fs-19" style="font-family:'Inter',sans-serif;">Aa</span><span class="docs-fs-tag">.fs-19</span></div>
  <div><span class="fs-24" style="font-family:'Inter',sans-serif;">Aa</span><span class="docs-fs-tag">.fs-24</span></div>
  <div><span class="fs-30" style="font-family:'Inter',sans-serif;">Aa</span><span class="docs-fs-tag">.fs-30</span></div>
  <div><span class="fs-42" style="font-family:'Inter',sans-serif;">Aa</span><span class="docs-fs-tag">.fs-42</span></div>
</div>

Two sizes are fluid (`clamp()`) rather than fixed, so headline text scales smoothly with viewport width instead of jumping at breakpoints:

```css
.fs-hero       { font-size: clamp(36px, 6vw, 64px); }  /* home hero h1 */
.fs-post-title { font-size: clamp(28px, 4.5vw, 44px); } /* post title, CMS preview */
```

Letter-spacing utilities (`.ls-02`, `.ls-1`, `.ls-15`, `.ls-2`) exist mainly for the all-caps "eyebrow" labels and uppercase nav text, where a little extra tracking reads better.

## Buttons

Every button on the site is `.btn-nk` plus a color modifier and an optional size modifier:

```html
<a href="#" class="btn-nk btn-nk-solid-c1">View Full Credentials</a>
<a href="#" class="btn-nk btn-nk-outline btn-nk--lg">Read the Blog</a>
```

- **Color:** `.btn-nk-solid-c1` (cyan fill), `.btn-nk-solid-c2` (teal fill), `.btn-nk-outline` (transparent, for dark backgrounds)
- **Size:** `.btn-nk--nav` (compact, for the nav bar), `.btn-nk--sm`, `.btn-nk--lg` (default padding needs no modifier)

Every button lifts 3px and gains a drop shadow on `:hover` via a shared `transform`/`box-shadow` transition on the base `.btn-nk` class — colors only change the fill/border, never the hover *motion*, so the lift feels consistent everywhere. (This is also the interaction that the hero's entrance animation once silently broke — see [the animation-fill-mode note](/docs/javascript.html#hero-intro-sequence) on the JavaScript page.)

## Tags & pills

`.tag-pill` is the small rounded label used on post cards and the About page's certifications list; `.tag-pill.on-card` swaps its background for use on a card that's already `--nk-c4`, and `.tag-pill--dark` is the cream-on-translucent-white variant for dark sections. `.pill-link` is the larger, bordered pill used for the About page's section jump-nav — it lifts on hover the same way buttons do.

## Reveal-on-scroll utilities

Three attribute-based classes control the fade/slide-in-on-scroll animation (the actual triggering logic lives in `site.js` — see [JavaScript](/docs/javascript.html#scroll-reveals)):

```html
<div data-reveal>...</div>              <!-- fades up, no direction -->
<div data-reveal-grid>...</div>          <!-- direction assigned at runtime from its row position -->
<div data-reveal-split="left">...</div>  <!-- fixed left/right column, direction never changes -->
```

`[data-reveal-grid]` is for card grids (stats, pillars, blog posts) where which card is "leftmost" depends on however many columns actually fit at the current viewport width — so JavaScript works that out live rather than the class being hardcoded per card. `[data-reveal-split]` is for the About page's two-column timeline rows, where the left/right assignment is fixed by the layout and never needs to be recalculated.

Stagger delay classes (`.td-0` through `.td-24`) sit alongside these to offset a row of cards' entrance by a few hundredths of a second each, so a row cascades in rather than all appearing in one frame.
