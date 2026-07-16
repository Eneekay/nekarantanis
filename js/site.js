document.addEventListener('DOMContentLoaded', () => {
  // The hero intro's one-shot entrance animations use fill-mode `both` so
  // the button holds its final position during the delay and doesn't snap
  // back afterwards - but that same fill-mode keeps the animation "in
  // effect" on `transform` forever, which silently blocks the ordinary
  // hover-lift transition every other button on the site has. Release it
  // once the entrance animation actually finishes.
  document.querySelectorAll('.hero-btn-left, .hero-btn-blog, .hero-btn-right, .scroll-hint').forEach((el) => {
    el.addEventListener('animationend', (e) => {
      if (e.animationName === 'scrollBounce') return; // still running - leave it alone
      el.style.animation = el.classList.contains('scroll-hint')
        ? 'scrollBounce 1.8s ease-in-out infinite'
        : 'none';
    });
  });

  // Position-aware entrance direction for [data-reveal-grid] cards: whatever
  // sits at the left/right edge of its rendered row slides in from that
  // side, anything else (a middle column, or a lone item stacked into a
  // single column on narrow viewports) slides up - same feel as the hero
  // button row, but figured out from the live layout instead of assuming a
  // fixed column count, so it keeps working as the grid reflows or is
  // filtered down to a different set of visible cards.
  const gridEls = document.querySelectorAll('[data-reveal-grid]');
  let assignRevealDirections = () => {};
  if (gridEls.length) {
    const gridParents = new Set(Array.from(gridEls).map(el => el.parentElement));
    assignRevealDirections = () => {
      gridParents.forEach(parent => {
        const items = Array.from(parent.children).filter(el => el.hasAttribute('data-reveal-grid') && el.offsetParent !== null);
        const rows = new Map();
        items.forEach(el => {
          const top = el.offsetTop;
          if (!rows.has(top)) rows.set(top, []);
          rows.get(top).push(el);
        });
        rows.forEach(rowItems => {
          rowItems.sort((a, b) => a.offsetLeft - b.offsetLeft);
          rowItems.forEach((el, i) => {
            const dir = rowItems.length === 1 ? 'up' : i === 0 ? 'left' : i === rowItems.length - 1 ? 'right' : 'up';
            el.dataset.revealDir = dir;
          });
        });
      });
    };
    assignRevealDirections();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(assignRevealDirections, 150);
    });
  }

  const revealEls = document.querySelectorAll('[data-reveal], [data-reveal-grid], [data-reveal-split]');
  if (revealEls.length) {
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(el => io.observe(el));
    }
  }

  // Blog category/tag filtering: two custom dropdowns filter the post grid
  // client-side (no server, so this has to run in the browser rather than
  // Jekyll generating per-tag pages). Plain <select> elements couldn't be
  // made to match the theme once opened - the popup itself is browser
  // chrome, not stylable - so these are button+list combos instead. Each
  // trigger doubles as the active-filter indicator: once a value is picked
  // it shows a small x-in-a-circle right inside the same pill to clear
  // just that filter, rather than a separate "clear all" button. The
  // featured post always stays visible regardless of filtering (it's no
  // longer duplicated into the grid).
  const categoryDropdown = document.querySelector('[data-filter="category"]');
  const tagDropdown = document.querySelector('[data-filter="tag"]');
  if (categoryDropdown && tagDropdown) {
    const grid = document.getElementById('postGrid');
    const heading = document.getElementById('postGridHeading');
    const empty = document.getElementById('postGridEmpty');
    const cards = Array.from(grid.querySelectorAll(':scope > [data-category]'));

    let categoryValue = '';
    let tagValue = '';

    const dropdownApis = [];
    const closeAllDropdowns = () => dropdownApis.forEach((d) => d.close());

    const setupDropdown = (root, onSelect, onClear) => {
      const pill = root.querySelector('.filter-select');
      const btn = root.querySelector('.filter-select-btn');
      const label = root.querySelector('.filter-select-label');
      const clearBtn = root.querySelector('.filter-pill-x');
      const menu = root.querySelector('.filter-menu');
      const options = Array.from(menu.querySelectorAll('[role="option"]'));
      const defaultLabel = label.textContent;

      const close = () => { menu.hidden = true; pill.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
      const open = () => { closeAllDropdowns(); menu.hidden = false; pill.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };

      btn.setAttribute('aria-haspopup', 'listbox');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => { menu.hidden ? open() : close(); });
      clearBtn.addEventListener('click', () => { close(); onClear(); });

      options.forEach((opt) => {
        opt.addEventListener('click', () => {
          const value = opt.dataset.value;
          options.forEach((o) => o.classList.toggle('is-active', o === opt));
          label.textContent = value ? opt.textContent : defaultLabel;
          clearBtn.classList.toggle('d-none', !value);
          close();
          onSelect(value);
        });
      });

      const api = {
        close,
        setValue(value) {
          const match = options.find((o) => o.dataset.value === value) || options[0];
          options.forEach((o) => o.classList.toggle('is-active', o === match));
          label.textContent = value ? match.textContent : defaultLabel;
          clearBtn.classList.toggle('d-none', !value);
        },
      };
      dropdownApis.push(api);
      return api;
    };

    const applyFilters = () => {
      const cat = categoryValue;
      const tag = tagValue;
      const filtering = !!(cat || tag);

      let visibleCount = 0;
      cards.forEach((card) => {
        const matches = !cat || card.dataset.category === cat;
        const matchesTag = !tag || card.dataset.tags.split('|').includes(tag);
        const show = matches && matchesTag;
        card.classList.toggle('d-none', !show);
        if (show) {
          visibleCount++;
          card.classList.add('is-visible');
        }
      });

      empty.classList.toggle('d-none', !filtering || visibleCount > 0);
      heading.textContent = filtering ? 'Posts' : 'All posts';

      // The set of visible cards (and so their row/column layout) just
      // changed, so re-figure each one's entrance direction.
      assignRevealDirections();
    };

    const syncUrl = () => {
      const next = new URLSearchParams();
      if (categoryValue) next.set('category', categoryValue);
      if (tagValue) next.set('tag', tagValue);
      const qs = next.toString();
      history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    };

    const categoryApi = setupDropdown(
      categoryDropdown,
      (value) => { categoryValue = value; applyFilters(); syncUrl(); },
      () => { categoryValue = ''; categoryApi.setValue(''); applyFilters(); syncUrl(); }
    );
    const tagApi = setupDropdown(
      tagDropdown,
      (value) => { tagValue = value; applyFilters(); syncUrl(); },
      () => { tagValue = ''; tagApi.setValue(''); applyFilters(); syncUrl(); }
    );

    document.addEventListener('click', (e) => {
      if (!categoryDropdown.contains(e.target) && !tagDropdown.contains(e.target)) closeAllDropdowns();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllDropdowns();
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) {
      categoryValue = params.get('category');
      categoryApi.setValue(categoryValue);
    }
    if (params.get('tag')) {
      tagValue = params.get('tag');
      tagApi.setValue(tagValue);
    }
    applyFilters();
  }

  // Typewriter effect: reveals text one character at a time as each element
  // scrolls into view. The character just typed sits in the accent colour
  // until the next one appears, at which point it settles to the normal
  // text colour; once the final character has likewise settled, only the
  // underscore cursor is left, blinking at the same 75ms cadence as typing.
  document.querySelectorAll('.post-body-inner blockquote p').forEach(p => p.setAttribute('data-typewriter', ''));
  const twEls = document.querySelectorAll('[data-typewriter]');
  if (twEls.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = 40;

    const runTypewriter = (el) => {
      const text = el.textContent.trim();
      if (!text) return;
      el.textContent = '';
      // The CSS hides [data-typewriter] text by default (via .js-tw) to
      // avoid a flash of the full static text before this runs; restore
      // visibility now that the content has been cleared synchronously,
      // so the browser never gets a chance to paint that in-between state.
      el.style.opacity = '1';

      if (reduceMotion) {
        el.textContent = text;
        return;
      }

      // Lay out every character up front (invisible but taking up its normal
      // space) so the element is already its final width/height from frame
      // one - this keeps centred text anchored in its final position instead
      // of the line widening outward as characters are revealed.
      const chars = Array.from(text).map(ch => {
        const span = document.createElement('span');
        span.className = 'tw-char tw-char--pending';
        span.textContent = ch;
        el.appendChild(span);
        return span;
      });

      // The cursor is positioned absolutely and tracks each character's
      // location rather than being inserted into the text flow - an inline
      // cursor glyph would occasionally push a line just over its wrap
      // width, causing a visible stutter as a word jumped to the next line
      // and back while the cursor passed through it.
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const cursor = document.createElement('span');
      cursor.className = 'tw-cursor';
      cursor.textContent = '_';
      cursor.style.position = 'absolute';
      el.appendChild(cursor);

      const placeCursor = (afterSpan) => {
        const elRect = el.getBoundingClientRect();
        const spanRect = afterSpan.getBoundingClientRect();
        cursor.style.left = (spanRect.right - elRect.left) + 'px';
        cursor.style.top = (spanRect.top - elRect.top) + 'px';
      };
      placeCursor(chars[0]);
      cursor.style.left = (chars[0].getBoundingClientRect().left - el.getBoundingClientRect().left) + 'px';

      let i = 0;
      let prevSpan = null;

      const tick = () => {
        if (i < chars.length) {
          const span = chars[i];
          span.classList.remove('tw-char--pending');
          span.classList.add('tw-char--accent');
          placeCursor(span);
          if (prevSpan) prevSpan.classList.remove('tw-char--accent');
          prevSpan = span;
          i++;
          setTimeout(tick, SPEED);
        } else {
          setTimeout(() => {
            if (prevSpan) prevSpan.classList.remove('tw-char--accent');
            cursor.classList.add('tw-cursor--blink');
          }, SPEED);
        }
      };
      tick();
    };

    // data-tw-delay lets a specific element (the homepage hero paragraph)
    // join the typewriter late, so it can be timed to start once the hero
    // intro's heading animation has landed rather than the instant the
    // element is visible.
    const startTypewriter = (el) => {
      const delay = reduceMotion ? 0 : (parseInt(el.dataset.twDelay, 10) || 0);
      if (delay) setTimeout(() => runTypewriter(el), delay);
      else runTypewriter(el);
    };

    if ('IntersectionObserver' in window) {
      const twIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startTypewriter(entry.target);
            twIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      twEls.forEach(el => twIo.observe(el));
    } else {
      twEls.forEach(startTypewriter);
    }
  }

  // Stat counters: every [data-count-to] inside a [data-count-group] counts
  // up from 0 together, sharing one start time and duration so - regardless
  // of how large each individual number is - they all land on their final
  // value at the same moment.
  const countGroups = document.querySelectorAll('[data-count-group]');
  if (countGroups.length) {
    const countReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COUNT_DURATION = 1400;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const renderCount = (el, value) => {
      const prefix = el.dataset.countPrefix || '';
      const suffix = el.dataset.countSuffix || '';
      const formatted = value >= 1000 ? value.toLocaleString('en-GB') : String(value);
      el.textContent = prefix + formatted + suffix;
    };

    const animateGroup = (group) => {
      const counters = Array.from(group.querySelectorAll('[data-count-to]'));
      if (!counters.length) return;
      const targets = counters.map(el => parseFloat(el.dataset.countTo));

      if (countReduceMotion) {
        counters.forEach((el, i) => renderCount(el, targets[i]));
        return;
      }

      counters.forEach(el => { el.style.opacity = '1'; });
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / COUNT_DURATION, 1);
        const eased = easeOutCubic(progress);
        counters.forEach((el, i) => renderCount(el, Math.round(targets[i] * eased)));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Little punctuation mark once every number has landed: a quick
          // scale bounce so the figures pop rather than just stopping dead.
          counters.forEach(el => {
            el.classList.add('count-done');
            el.addEventListener('animationend', () => el.classList.remove('count-done'), { once: true });
          });
        }
      };
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const countIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateGroup(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      countGroups.forEach(g => countIo.observe(g));
    } else {
      countGroups.forEach(animateGroup);
    }
  }

  const nav = document.getElementById('siteNav');
  if (nav) {
    const syncNavHeight = () => document.documentElement.style.setProperty('--nav-h', nav.getBoundingClientRect().height + 'px');
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 24);
      syncNavHeight();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', syncNavHeight);
  }

  const navMenu = document.getElementById('navMenu');
  if (nav && navMenu) {
    navMenu.addEventListener('show.bs.collapse', () => nav.classList.add('menu-open'));
    navMenu.addEventListener('hidden.bs.collapse', () => nav.classList.remove('menu-open'));
  }

  const scrollHint = document.getElementById('scrollHint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      const hero = document.querySelector('.hero-sticky-wrap') || document.querySelector('header');
      const next = hero ? hero.nextElementSibling : null;
      if (next) {
        const top = next.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // Hero pin + cover: --hero-h drives .hero-sticky-wrap's height and
  // .stats-cover's negative margin (see custom.css) so the hero stays
  // pinned for exactly as long as it takes the Impact Stats section to
  // slide up and fully cover it. Measured rather than assumed to be a
  // fixed 100vh, since very short or zoomed viewports can make the
  // hero's real content taller than that.
  const heroSticky = document.querySelector('.hero-sticky');
  if (heroSticky) {
    let heroSyncWidth = window.innerWidth;
    const syncHeroHeight = () => {
      document.documentElement.style.setProperty('--hero-h', heroSticky.getBoundingClientRect().height + 'px');
    };
    syncHeroHeight();
    // Mobile browsers fire resize repeatedly as their address bar hides
    // and shows *during* scroll, changing the reported viewport height
    // (and so the hero's own min-vh-100 height) without the page
    // actually being resized. Reacting to that would yank --hero-h -
    // and with it the wrap's height and the stats section's negative
    // margin/min-height - around mid-scroll, which reads as the whole
    // section repeatedly jerking. A genuine resize or orientation change
    // always changes the width too, so only that is trusted here.
    window.addEventListener('resize', () => {
      if (window.innerWidth !== heroSyncWidth) {
        heroSyncWidth = window.innerWidth;
        syncHeroHeight();
      }
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeroHeight);
    }
  }

  // Animated wave dividers: each one is a smooth, hand-drawn-feeling curve
  // (a spline through a few points, not a dense polyline) drifting right to
  // left, like a swell moving across a lake. Scrolling accelerates that
  // drift; it eases back to its normal slow pace once scrolling stops.
  const waveSvgs = Array.from(document.querySelectorAll('svg.wave-divider'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (waveSvgs.length && !reduceMotion) {
    const waves = waveSvgs
      .map((svg, i) => {
        const seed = (i * 0.618033988749895) % 1; // golden-ratio scatter: deterministic, well-spread per wave
        return {
          svg,
          path: svg.querySelector('path'),
          visible: true,
          phase1: (i * 1.9 + seed * 3) % (Math.PI * 2),
          phase2: (i * 3.1 + seed * 5) % (Math.PI * 2),
          speed1: 0.29 + seed * 0.29,                // primary drift, rad/s (slow at rest)
          speed2: 0.44 + (1 - seed) * 0.39,           // secondary drift, rad/s
          freqRatio: 1.4 + seed * 0.6,                // secondary swell wavelength vs primary
          ampMain: 21 + seed * 11,                    // primary swell, within the 0-100 viewBox
          ampRatio: 0.3 + (1 - seed) * 0.22,          // secondary swell as a fraction of primary
          cyclesMult: 0.9 + seed * 0.5,                // per-wave wavelength character
        };
      })
      .filter(w => w.path);

    // The stats section's wave is a clipPath (objectBoundingBox, 0-1 space)
    // driving a real CSS-background div rather than an SVG fill, so its
    // grid renders at true pixels instead of being squeezed through the
    // divider's non-uniform viewBox scale (see .stats-wave-fill). It still
    // rides the same drift system as the rest, just normalized to 0-1.
    // Its shadow (see .stats-wave-shadow in custom.css) is a second,
    // separate path tracing the same curve in the un-normalized 1440x100
    // space, but its 'd' is intentionally left static (set once in the
    // HTML) rather than kept in sync with this animated one every frame -
    // recomputing a drop-shadow filter against a constantly-changing path
    // is expensive, and cheap to avoid here since the shadow is a soft,
    // secondary effect that doesn't need to track the live wave exactly
    // to still read correctly.
    const statsClipPath = document.querySelector('#statsWaveClip path');
    const statsWaveFill = document.querySelector('.stats-wave-fill');
    if (statsClipPath && statsWaveFill) {
      waves.push({
        svg: statsWaveFill,
        path: statsClipPath,
        visible: true,
        normalized: true,
        phase1: 1.2,
        phase2: 2.4,
        speed1: 0.35,
        speed2: 0.5,
        freqRatio: 1.6,
        ampMain: 25,
        ampRatio: 0.35,
        cyclesMult: 1.1,
      });
    }

    if ('IntersectionObserver' in window) {
      const waveIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const w = waves.find(w => w.svg === entry.target);
          if (w) w.visible = entry.isIntersecting;
        });
      });
      waves.forEach(w => waveIo.observe(w.svg));
    }

    const VELOCITY_FOR_FULL_BOOST = 1.4; // px/ms of scroll speed that maxes out the acceleration
    let intensity = 0;        // 0 = normal drift speed, 1 = fully accelerated
    let targetIntensity = 0;
    let scrolling = false;
    let scrollIdleTimer = null;
    let lastScrollY = null;   // set on first event, so scroll restoration on load isn't read as a huge jump
    let lastScrollT = performance.now();

    window.addEventListener('scroll', () => {
      const now = performance.now();
      if (lastScrollY !== null) {
        const dt = Math.max(now - lastScrollT, 1);
        const velocity = Math.abs(window.scrollY - lastScrollY) / dt; // px per ms
        targetIntensity = Math.min(velocity / VELOCITY_FOR_FULL_BOOST, 1);
      }
      lastScrollY = window.scrollY;
      lastScrollT = now;

      // Held/continuous scrolling (e.g. a touchpad drag) keeps firing scroll
      // events, so keep re-arming this timer; only once it elapses without a
      // new event do we treat the gesture as finished and start relaxing.
      scrolling = true;
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => { scrolling = false; }, 180);
    }, { passive: true });

    // Catmull-Rom -> cubic Bezier: turns a handful of points into one flowing
    // curve through all of them, instead of the faceted look of straight
    // segments — this is what gives it the same curvy feel as the original
    // hand-drawn dividers.
    const smoothPath = (pts, precision) => {
      let d = 'M' + pts[0][0].toFixed(precision) + ',' + pts[0][1].toFixed(precision);
      const n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < n ? i + 2 : n - 1];
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += 'C' + c1x.toFixed(precision) + ',' + c1y.toFixed(precision) + ' ' + c2x.toFixed(precision) + ',' + c2y.toFixed(precision) + ' ' + p2[0].toFixed(precision) + ',' + p2[1].toFixed(precision);
      }
      return d;
    };

    const buildWavePath = (w) => {
      // Normalized waves (the stats clipPath) are built in the same 1440x100
      // space as everyone else, then scaled to 0-1 at the end - keeps the
      // amplitude/frequency tuning above meaningful in both coordinate
      // spaces instead of needing a second set of tiny numbers.
      const W = 1440, MID = 45, N = 72;
      const sx = w.normalized ? 1 / W : 1;
      const sy = w.normalized ? 1 / 100 : 1;
      const precision = w.normalized ? 4 : 1;
      const ampSecondary = w.ampMain * w.ampRatio;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const x = (W * i) / N;
        const t = i / N;
        // Adding phase (rather than subtracting) moves crests toward smaller
        // x as time passes — i.e. right to left.
        const y = MID
          + w.ampMain * Math.sin(t * Math.PI * 2 * w.cyclesMult + w.phase1)
          + ampSecondary * Math.sin(t * Math.PI * 2 * w.cyclesMult * w.freqRatio + w.phase2);
        pts.push([x * sx, y * sy]);
      }
      const endX = (W * sx).toFixed(precision), endY = (100 * sy).toFixed(precision), startY = (0).toFixed(precision);
      return smoothPath(pts, precision) + 'L' + endX + ',' + endY + 'L' + startY + ',' + endY + 'Z';
    };

    let prevFrame = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - prevFrame) / 1000, 0.1);
      prevFrame = now;
      // While actively scrolling, chase the current scroll-driven target
      // (no decay); only once the gesture has genuinely stopped does the
      // drift ease back down to its normal calm pace.
      if (!scrolling) targetIntensity += (0 - targetIntensity) * Math.min(dt * 0.9, 1);
      intensity += (targetIntensity - intensity) * Math.min(dt * 6, 1);
      const rate = 1 + intensity * 5; // scrolling can speed the drift up to ~6x
      waves.forEach(w => {
        w.phase1 += w.speed1 * rate * dt;
        w.phase2 += w.speed2 * rate * dt;
        if (w.visible) w.path.setAttribute('d', buildWavePath(w));
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Network canvas: a faint, slow-drifting node graph layered over each dark
  // dotted section, behind the real content - same discreet, minimal feel as
  // the static dot texture already there, just gently alive. Skipped
  // entirely under reduced motion rather than shown static, since a frozen
  // half-connected graph reads as broken rather than intentional.
  const networkSections = Array.from(document.querySelectorAll('.section-dark-dotted'));
  if (networkSections.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const CONNECT_DIST = 175;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const networks = networkSections.map((section) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'network-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      section.insertBefore(canvas, section.firstChild);
      return { section, canvas, ctx: canvas.getContext('2d'), nodes: [], visible: true, width: 0, height: 0 };
    });

    // The pinned hero stays "intersecting" the viewport (still occupying
    // screen 0-height, per IntersectionObserver) for its whole pin
    // duration, even once the Impact Stats section has scrolled up far
    // enough to completely hide it - so without this, its network canvas
    // would keep computing every node pair and redrawing every frame the
    // entire time, for a section that's 100% invisible behind an opaque
    // overlay. That's wasted main-thread work stacking up right as the
    // stat counters (their own per-frame DOM writes) are also running,
    // worth skipping outright rather than paying for on a slower device.
    const heroNet = networks.find((n) => n.section.classList.contains('hero-sticky'));
    let heroCoverThreshold = Infinity;
    if (heroNet) {
      const refreshHeroCoverThreshold = () => {
        const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-h'));
        heroCoverThreshold = isNaN(v) ? Infinity : v;
      };
      refreshHeroCoverThreshold();
      window.addEventListener('resize', refreshHeroCoverThreshold);
    }

    const seedNodes = (net) => {
      const area = net.width * net.height;
      const count = Math.max(24, Math.min(110, Math.round(area / 8500)));
      // Jittered grid rather than pure random placement: a handful of random
      // draws can clump by chance and leave a whole edge (often the right
      // side, on a wide section) looking empty. Spreading one node per cell
      // - with randomness only inside the cell - guarantees even coverage
      // edge to edge while still looking organic rather than gridded.
      const cols = Math.max(1, Math.round(Math.sqrt((count * net.width) / net.height)));
      const rows = Math.max(1, Math.ceil(count / cols));
      const cellW = net.width / cols;
      const cellH = net.height / rows;
      const nodes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (nodes.length >= count) break;
          nodes.push({
            x: c * cellW + Math.random() * cellW,
            y: r * cellH + Math.random() * cellH,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
          });
        }
      }
      net.nodes = nodes;
    };

    const resize = (net) => {
      const rect = net.section.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      net.width = rect.width;
      net.height = rect.height;
      net.canvas.width = rect.width * dpr;
      net.canvas.height = rect.height * dpr;
      net.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes(net);
    };

    networks.forEach(resize);
    // Web fonts loading can reflow section heights after the initial layout
    // pass; re-measure once they've settled so canvases aren't stuck at a
    // stale size.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => networks.forEach(resize));
    }

    let netResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(netResizeTimer);
      netResizeTimer = setTimeout(() => networks.forEach(resize), 200);
    });

    if ('IntersectionObserver' in window) {
      const netIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const net = networks.find((n) => n.canvas === entry.target);
          if (net) net.visible = entry.isIntersecting;
        });
      });
      networks.forEach((net) => netIo.observe(net.canvas));
    }

    let netPrevT = performance.now();
    const netTick = (now) => {
      const dt = Math.min((now - netPrevT) / 1000, 0.1);
      netPrevT = now;
      networks.forEach((net) => {
        if (!net.visible || !net.nodes.length) return;
        if (net === heroNet && window.scrollY >= heroCoverThreshold) return;
        const { ctx, width, height, nodes } = net;
        nodes.forEach((n) => {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (n.x < 0) { n.x = 0; n.vx *= -1; }
          if (n.x > width) { n.x = width; n.vx *= -1; }
          if (n.y < 0) { n.y = 0; n.vy *= -1; }
          if (n.y > height) { n.y = height; n.vy *= -1; }
        });

        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECT_DIST) {
              ctx.strokeStyle = 'rgba(234, 235, 236,' + (0.16 * (1 - dist / CONNECT_DIST)) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.fillStyle = 'rgba(234, 235, 236, 0.4)';
        nodes.forEach((n) => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      requestAnimationFrame(netTick);
    };
    requestAnimationFrame(netTick);
  }
});
