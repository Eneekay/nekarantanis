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

  // Typewriter effect: reveals text one character at a time as each element
  // scrolls into view. The character just typed sits in the accent colour
  // until the next one appears, at which point it settles to the normal
  // text colour; once the final character has likewise settled, only the
  // underscore cursor is left, blinking at the same 75ms cadence as typing.
  document.querySelectorAll('.post-body-inner blockquote p').forEach(p => p.setAttribute('data-typewriter', ''));
  const twEls = document.querySelectorAll('[data-typewriter]');
  if (twEls.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = 60;

    const runTypewriter = (el) => {
      const text = el.textContent.trim();
      if (!text) return;
      // Reserve the element's fully-typed height up front, so the section
      // doesn't grow taller line by line as the text wraps while typing.
      el.style.minHeight = el.getBoundingClientRect().height + 'px';
      el.textContent = '';

      const cursor = document.createElement('span');
      cursor.className = 'tw-cursor';
      cursor.textContent = '_';
      el.appendChild(cursor);

      if (reduceMotion) {
        cursor.remove();
        el.textContent = text;
        return;
      }

      const chars = Array.from(text);
      let i = 0;
      let prevSpan = null;

      const tick = () => {
        if (i < chars.length) {
          const span = document.createElement('span');
          span.className = 'tw-char tw-char--accent';
          span.textContent = chars[i];
          el.insertBefore(span, cursor);
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

    if ('IntersectionObserver' in window) {
      const twIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runTypewriter(entry.target);
            twIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      twEls.forEach(el => twIo.observe(el));
    } else {
      twEls.forEach(runTypewriter);
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
          speed1: 0.22 + seed * 0.22,                // primary drift, rad/s (slow at rest)
          speed2: 0.34 + (1 - seed) * 0.3,            // secondary drift, rad/s
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
