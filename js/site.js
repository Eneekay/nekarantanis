document.addEventListener('DOMContentLoaded', () => {
  const revealEls = document.querySelectorAll('[data-reveal]');
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

  // Blog category/tag filtering: two dropdowns filter the post grid
  // client-side (no server, so this has to run in the browser rather than
  // Jekyll generating per-tag pages). The URL's ?category=/&tag= params
  // both seed the filter on load and get updated on change, so links from
  // an article's category/tag straight into a filtered view work, and the
  // filtered view itself is shareable/bookmarkable.
  const categoryFilter = document.getElementById('categoryFilter');
  const tagFilter = document.getElementById('tagFilter');
  if (categoryFilter && tagFilter) {
    const grid = document.getElementById('postGrid');
    const featuredSection = document.getElementById('featuredSection');
    const heading = document.getElementById('postGridHeading');
    const empty = document.getElementById('postGridEmpty');
    const clearBtn = document.getElementById('clearFilters');
    const cards = Array.from(grid.querySelectorAll(':scope > [data-category]'));

    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) categoryFilter.value = params.get('category');
    if (params.get('tag')) tagFilter.value = params.get('tag');

    const applyFilters = () => {
      const cat = categoryFilter.value;
      const tag = tagFilter.value;
      const filtering = !!(cat || tag);

      featuredSection.classList.toggle('d-none', filtering);

      let visibleCount = 0;
      cards.forEach(card => {
        const isFeaturedDup = card.hasAttribute('data-featured-dup');
        const matches = filtering
          && (!cat || card.dataset.category === cat)
          && (!tag || card.dataset.tags.split('|').includes(tag));
        const show = filtering ? matches : !isFeaturedDup;
        card.classList.toggle('d-none', !show);
        if (show) {
          visibleCount++;
          card.classList.add('is-visible');
        }
      });

      empty.classList.toggle('d-none', !filtering || visibleCount > 0);
      clearBtn.classList.toggle('filter-clear-btn--hidden', !filtering);

      if (cat && tag) heading.textContent = `Category: ${cat} · Tag: ${tag}`;
      else if (cat) heading.textContent = `Category: ${cat}`;
      else if (tag) heading.textContent = `Tag: ${tag}`;
      else heading.textContent = 'All posts';
    };

    const syncUrl = () => {
      const next = new URLSearchParams();
      if (categoryFilter.value) next.set('category', categoryFilter.value);
      if (tagFilter.value) next.set('tag', tagFilter.value);
      const qs = next.toString();
      history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    };

    categoryFilter.addEventListener('change', () => { applyFilters(); syncUrl(); });
    tagFilter.addEventListener('change', () => { applyFilters(); syncUrl(); });
    clearBtn.addEventListener('click', () => {
      categoryFilter.value = '';
      tagFilter.value = '';
      applyFilters();
      syncUrl();
    });
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
        if (progress < 1) requestAnimationFrame(tick);
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
      const hero = document.querySelector('header');
      const next = hero ? hero.nextElementSibling : null;
      if (next) {
        const top = next.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
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
    const smoothPath = (pts) => {
      let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
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
        d += 'C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
      }
      return d;
    };

    const buildWavePath = (w) => {
      const W = 1440, MID = 45, N = 72;
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
        pts.push([x, y]);
      }
      return smoothPath(pts) + 'L' + W + ',100L0,100Z';
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
});
