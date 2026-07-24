document.addEventListener('DOMContentLoaded', () => {
  // Sticky "back to top" control (Blog / Research listings): revealed once
  // the page has scrolled past ~a screenful, smooth-scrolls back up on click.
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    const toggleScrollTop = () => scrollTopBtn.classList.toggle('is-visible', window.scrollY > 600);
    toggleScrollTop();
    window.addEventListener('scroll', toggleScrollTop, { passive: true });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Contact form: progressively enhances the plain POST-and-redirect
  // Formspree form into an in-page submit, so a successful send shows an
  // inline confirmation instead of leaving the page. Falls back to the
  // form's native action/method (a real page navigation) if fetch fails
  // for a reason other than Formspree itself rejecting the request, e.g.
  // no network at all.
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const statusEl = document.getElementById('contactStatus');
    const submitBtn = document.getElementById('contactSubmit');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.classList.remove('is-success', 'is-error');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      })
        .then((response) => {
          if (response.ok) {
            statusEl.textContent = "Thanks — your message has been sent. I'll get back to you soon.";
            statusEl.classList.add('is-success');
            contactForm.reset();
          } else {
            return response.json().then((data) => {
              // Formspree's error shape varies: validation failures come back
              // as { errors: [{ message }] }, but account-level rejections
              // (e.g. the destination email hasn't been confirmed yet) come
              // back as a single { error } string instead - check both so
              // whatever Formspree actually says reaches the visitor instead
              // of a generic fallback that hides the real reason.
              let message = 'Something went wrong sending that. Please try again.';
              if (data && Array.isArray(data.errors) && data.errors.length) {
                message = data.errors.map((err) => err.message).join(', ');
              } else if (data && data.error) {
                message = data.error;
              }
              throw new Error(message);
            });
          }
        })
        .catch((err) => {
          statusEl.textContent = err.message || 'Something went wrong sending that. Please try again.';
          statusEl.classList.add('is-error');
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send message';
        });
    });
  }

  // The hero intro's one-shot entrance animations use fill-mode `both` so
  // the button holds its final position during the delay and doesn't snap
  // back afterwards - but that same fill-mode keeps the animation "in
  // effect" on `transform` forever, which silently blocks the ordinary
  // hover-lift transition every other button on the site has. Release it
  // once the entrance animation actually finishes.
  document.querySelectorAll('.hero-btn-left, .hero-btn-right, .scroll-hint').forEach((el) => {
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

  // Icon draw-on: stat-icon and post-card-icon only - heading-icon (page
  // headers, section headings, the Blog featured card) is deliberately
  // left out of this entirely, rendering as a normal icon with no
  // animation. These start hidden via plain CSS (stroke-dasharray/
  // dashoffset - see custom.css), so this only ever has to reveal each
  // one once, the first time it scrolls into view. Each
  // shape's dasharray/dashoffset is first swapped, inline, from custom.css's
  // generic 300 placeholder to its own real getTotalLength() - otherwise
  // the 1s transition would finish "drawing" as soon as the offset passed
  // the shape's actual (much shorter) length, well before the full second
  // was up, and just sit fully-drawn for the remainder unseen. The reveal
  // itself is done the same way, inline, rather than via a class: once an
  // element's dashoffset has been set inline once, only another inline
  // write can change it back - a class-based CSS rule would never win
  // against it.
  //
  // Deliberately a much stricter threshold than the [data-reveal] observer
  // above (0.6 visible, no rootMargin) rather than reusing its 0.1/-40px
  // config: that config was tuned for whole cards/sections, where 10% is
  // still a substantial, noticeable sliver. For a 26-40px icon, 10% is
  // 2-4px - the reveal fired the instant the icon merely grazed the edge
  // of the screen, so by the time it was actually sitting in view the
  // whole 1s draw had long since finished unseen.
  const iconEls = document.querySelectorAll('.stat-icon, .post-card-icon');
  if (iconEls.length) {
    // A stroke-dashoffset reveal reads fine on an actual line, but on a
    // very short path - several of the icon set's shapes are little
    // arcs/dots a couple of pixels across - the growing arc looks like a
    // rapid, jittery flicker rather than a draw. Below this length, skip
    // the animation entirely and just let the shape pop in with the rest
    // of the icon.
    const NO_DRAW_LENGTH = 10;
    // Beyond a few shapes, even shapes individually long enough to draw
    // smoothly add up to a busy icon (the "tree" icon - 4 branches + 4
    // leaf dots - kept reading as frantic no matter how the remaining
    // shapes were staggered or slowed). Past this count, skip the
    // animation for the WHOLE icon rather than trying to tune it further.
    const MAX_ANIMATED_SHAPES = 4;
    const iconShapes = new Map();
    iconEls.forEach((svg) => {
      const shapes = Array.from(svg.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse'));
      // Some sections (Publications' "By the Numbers" stat row - see
      // data-icon-fade-only) want every icon inside them to just fade in
      // as a group, not only the ones that happen to cross the
      // shape-count line below - a lone simple icon fading in right next
      // to a compound one popping/drawing on its own timeline still read
      // as mismatched, so the whole section opts out of drawing.
      const fadeOnly = !!svg.closest('[data-icon-fade-only]');
      const tooManyShapes = fadeOnly || shapes.length > MAX_ANIMATED_SHAPES;
      shapes.forEach((shape) => {
        if (typeof shape.getTotalLength === 'function') {
          const len = shape.getTotalLength();
          const tiny = tooManyShapes || (len > 0 && len < NO_DRAW_LENGTH);
          shape.dataset.tinyShape = tiny ? '1' : '';
          if (tiny) {
            // Skipping the stroke-draw for these - cancel the dash-hidden
            // state entirely (a plain continuous stroke) and hide/reveal
            // with opacity instead, a plain fade rather than a hard pop.
            shape.style.strokeDasharray = 'none';
            shape.style.strokeDashoffset = '0';
            shape.style.opacity = '0';
          } else {
            shape.style.strokeDasharray = len;
            shape.style.strokeDashoffset = len;
          }
        }
      });
      iconShapes.set(svg, shapes);
    });
    // Two layers of stagger, both applied only at reveal time (not at
    // setup) since the second one depends on how many OTHER icons enter
    // view in the same moment: SHAPE_STAGGER spaces out a compound icon's
    // own shapes (e.g. "team": circle+path+circle+path - drawing all 4 at
    // once read as busy/frantic rather than one calm reveal); ICON_STAGGER
    // additionally spaces out whichever icons the observer reports
    // intersecting in the same callback batch - a whole row of 6-8 stat
    // icons otherwise all start (and keep repainting their stroke every
    // frame) at once, which is real concurrent paint load, not just a
    // visual preference, and reads as jank on top of the count-up numbers
    // already animating in that same section. Icons past MAX_ANIMATED_
    // SHAPES (e.g. "tree") skip both layers - all their shapes just fade
    // in together, once, at the icon's own batch delay.
    const SHAPE_STAGGER_MS = 90;
    const ICON_STAGGER_MS = 130;
    const drawIcon = (svg, iconDelayMs) => {
      (iconShapes.get(svg) || []).forEach((shape, i) => {
        if (shape.dataset.tinyShape === '1') {
          shape.style.transitionDelay = iconDelayMs + 'ms';
          shape.style.opacity = '1';
        } else {
          shape.style.transitionDelay = (iconDelayMs + i * SHAPE_STAGGER_MS) + 'ms';
          shape.style.strokeDashoffset = '0';
        }
      });
    };
    if (!('IntersectionObserver' in window)) {
      iconEls.forEach((el, i) => drawIcon(el, i * ICON_STAGGER_MS));
    } else {
      const iconIo = new IntersectionObserver((entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            drawIcon(entry.target, i * ICON_STAGGER_MS);
            iconIo.unobserve(entry.target);
          });
      }, { threshold: 0.6 });
      iconEls.forEach(el => iconIo.observe(el));
    }
  }

  // Blog category/tag/search filtering: two custom dropdowns plus a live
  // text search filter the post grid client-side (no server, so this has
  // to run in the browser rather than Jekyll generating per-tag pages).
  // Plain <select> elements couldn't be made to match the theme once
  // opened - the popup itself is browser chrome, not stylable - so the
  // dropdowns are button+list combos instead. Each trigger doubles as the
  // active-filter indicator: once a value is picked it shows a small
  // x-in-a-circle right inside the same pill to clear just that filter,
  // rather than a separate "clear all" button. The search box matches
  // against each card's pre-baked data-search string (title + summary +
  // category + tags, lowercased at build time by Liquid) so filtering as
  // you type is a plain substring check, no runtime text extraction. All
  // three filters combine with AND. The featured post always stays
  // visible regardless of filtering (it's no longer duplicated into the
  // grid).
  const categoryDropdown = document.querySelector('[data-filter="category"]');
  const tagDropdown = document.querySelector('[data-filter="tag"]');
  if (categoryDropdown && tagDropdown) {
    const grid = document.getElementById('postGrid');
    const heading = document.getElementById('postGridHeading');
    const empty = document.getElementById('postGridEmpty');
    const cards = Array.from(grid.querySelectorAll(':scope > [data-category]'));

    let categoryValue = '';
    let tagValue = '';
    let searchValue = '';

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
      const search = searchValue;
      const filtering = !!(cat || tag || search);

      let visibleCount = 0;
      cards.forEach((card) => {
        const matches = !cat || card.dataset.category === cat;
        const matchesTag = !tag || card.dataset.tags.split('|').includes(tag);
        const matchesSearch = !search || card.dataset.search.includes(search);
        const show = matches && matchesTag && matchesSearch;
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
      if (searchValue) next.set('q', searchValue);
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

    const searchInput = document.getElementById('postSearchInput');
    const searchClear = document.getElementById('postSearchClear');
    searchInput.addEventListener('input', () => {
      searchValue = searchInput.value.trim().toLowerCase();
      searchClear.classList.toggle('d-none', !searchValue);
      applyFilters();
      syncUrl();
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchValue = '';
      searchClear.classList.add('d-none');
      applyFilters();
      syncUrl();
      searchInput.focus();
    });

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
    if (params.get('q')) {
      searchValue = params.get('q').trim().toLowerCase();
      searchInput.value = params.get('q');
      searchClear.classList.remove('d-none');
    }
    applyFilters();
  }

  // Publications grid category/species/search filtering: same custom
  // dropdown + live-search pattern as the Blog page, but both dropdowns
  // filter against a list (a publication can have several keywords and
  // several species) rather than a single value, so both use the same
  // "is this value in the list" check the Blog page's tag filter uses.
  // Kept as its own independent block (own setupDropdown copy) rather
  // than sharing the Blog page's, since the two pages never render
  // together and duplicating ~15 lines is simpler than threading a
  // shared helper through two unrelated call sites.
  const pubKeywordDropdown = document.querySelector('[data-filter="keyword"]');
  const pubSpeciesDropdown = document.querySelector('[data-filter="species"]');
  if (pubKeywordDropdown && pubSpeciesDropdown) {
    const grid = document.getElementById('pubGrid');
    const heading = document.getElementById('pubGridHeading');
    const empty = document.getElementById('pubGridEmpty');
    const cards = Array.from(grid.querySelectorAll(':scope > [data-keywords]'));

    let keywordValue = '';
    let speciesValue = '';
    let pubSearchValue = '';

    const pubDropdownApis = [];
    const closeAllPubDropdowns = () => pubDropdownApis.forEach((d) => d.close());

    const setupPubDropdown = (root, onSelect, onClear) => {
      const pill = root.querySelector('.filter-select');
      const btn = root.querySelector('.filter-select-btn');
      const label = root.querySelector('.filter-select-label');
      const clearBtn = root.querySelector('.filter-pill-x');
      const menu = root.querySelector('.filter-menu');
      const options = Array.from(menu.querySelectorAll('[role="option"]'));
      const defaultLabel = label.textContent;

      const close = () => { menu.hidden = true; pill.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
      const open = () => { closeAllPubDropdowns(); menu.hidden = false; pill.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };

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
      pubDropdownApis.push(api);
      return api;
    };

    const applyPubFilters = () => {
      const kw = keywordValue;
      const sp = speciesValue;
      const search = pubSearchValue;
      const filtering = !!(kw || sp || search);

      let visibleCount = 0;
      cards.forEach((card) => {
        const matchesKeyword = !kw || card.dataset.keywords.split('|').includes(kw);
        const matchesSpecies = !sp || card.dataset.species.split('|').includes(sp);
        const matchesSearch = !search || card.dataset.search.includes(search);
        const show = matchesKeyword && matchesSpecies && matchesSearch;
        card.classList.toggle('d-none', !show);
        if (show) {
          visibleCount++;
          card.classList.add('is-visible');
        }
      });

      empty.classList.toggle('d-none', !filtering || visibleCount > 0);
      heading.textContent = filtering ? 'Publications' : 'All publications';
      assignRevealDirections();
    };

    const syncPubUrl = () => {
      const next = new URLSearchParams();
      if (keywordValue) next.set('category', keywordValue);
      if (speciesValue) next.set('species', speciesValue);
      if (pubSearchValue) next.set('q', pubSearchValue);
      const qs = next.toString();
      history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    };

    const keywordApi = setupPubDropdown(
      pubKeywordDropdown,
      (value) => { keywordValue = value; applyPubFilters(); syncPubUrl(); },
      () => { keywordValue = ''; keywordApi.setValue(''); applyPubFilters(); syncPubUrl(); }
    );
    const speciesApi = setupPubDropdown(
      pubSpeciesDropdown,
      (value) => { speciesValue = value; applyPubFilters(); syncPubUrl(); },
      () => { speciesValue = ''; speciesApi.setValue(''); applyPubFilters(); syncPubUrl(); }
    );

    const pubSearchInput = document.getElementById('pubSearchInput');
    const pubSearchClear = document.getElementById('pubSearchClear');
    pubSearchInput.addEventListener('input', () => {
      pubSearchValue = pubSearchInput.value.trim().toLowerCase();
      pubSearchClear.classList.toggle('d-none', !pubSearchValue);
      applyPubFilters();
      syncPubUrl();
    });
    pubSearchClear.addEventListener('click', () => {
      pubSearchInput.value = '';
      pubSearchValue = '';
      pubSearchClear.classList.add('d-none');
      applyPubFilters();
      syncPubUrl();
      pubSearchInput.focus();
    });

    document.addEventListener('click', (e) => {
      if (!pubKeywordDropdown.contains(e.target) && !pubSpeciesDropdown.contains(e.target)) closeAllPubDropdowns();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllPubDropdowns();
    });

    const pubParams = new URLSearchParams(window.location.search);
    if (pubParams.get('category')) {
      keywordValue = pubParams.get('category');
      keywordApi.setValue(keywordValue);
    }
    if (pubParams.get('species')) {
      speciesValue = pubParams.get('species');
      speciesApi.setValue(speciesValue);
    }
    if (pubParams.get('q')) {
      pubSearchValue = pubParams.get('q').trim().toLowerCase();
      pubSearchInput.value = pubParams.get('q');
      pubSearchClear.classList.remove('d-none');
    }
    applyPubFilters();
  }

  // Card/List view toggle for the Blog and Research grids: a single pill
  // button cycles between the two layouts (see the [data-view] CSS in
  // custom.css), remembering the visitor's choice in localStorage so it
  // sticks across visits. Both pages use the same two-mode list and the
  // same button/grid pairing pattern, so one helper wires up whichever
  // pair exists on the current page.
  const VIEW_MODES = [
    { key: 'card', label: 'Card' },
    { key: 'list', label: 'List' },
  ];
  const setupViewToggle = (btn, grid, storageKey) => {
    if (!btn || !grid) return;
    const labelEl = btn.querySelector('.view-toggle-label');
    let stored = null;
    try { stored = window.localStorage.getItem(storageKey); } catch (e) { /* private mode, etc. */ }
    let index = Math.max(0, VIEW_MODES.findIndex((m) => m.key === stored));

    const apply = () => {
      const mode = VIEW_MODES[index];
      grid.dataset.view = mode.key;
      labelEl.textContent = `View: ${mode.label}`;
      // Switching modes reflows every card into new rows/columns, so each
      // one's reveal-entrance direction needs recalculating too.
      assignRevealDirections();
    };
    apply();

    btn.addEventListener('click', () => {
      index = (index + 1) % VIEW_MODES.length;
      apply();
      try { window.localStorage.setItem(storageKey, VIEW_MODES[index].key); } catch (e) { /* ignore */ }
    });
  };
  setupViewToggle(document.getElementById('postViewToggle'), document.getElementById('postGrid'), 'nk-blog-view');
  setupViewToggle(document.getElementById('pubViewToggle'), document.getElementById('pubGrid'), 'nk-pub-view');

  // Publication article sticky TOC: built from the article body's own h2/h3
  // headings rather than a hand-maintained list, since kramdown already
  // assigns each heading a stable id - same approach as the docs site's
  // on-page TOC (docs/assets/docs.js), reimplemented here so it picks up
  // this site's own theme instead of the docs-only stylesheet.
  const pubTocList = document.getElementById('pubTocList');
  const pubHeadings = document.querySelectorAll('#pubBody h2[id], #pubBody h3[id]');
  if (pubTocList && pubHeadings.length) {
    const pubLinks = [];
    pubHeadings.forEach((h) => {
      const li = document.createElement('li');
      if (h.tagName === 'H3') li.className = 'pub-toc-h3';
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      pubTocList.appendChild(li);
      pubLinks.push({ heading: h, link: a });
    });

    if ('IntersectionObserver' in window) {
      // Toggling `is-active` straight off `entry.isIntersecting` only lit up
      // a heading's TOC link while the heading itself sat inside the
      // shrunk-root band - so the highlight vanished the moment you scrolled
      // past a short heading, well before you'd finished reading its
      // section. Instead, every time any heading crosses the activation
      // line, recompute which section we're actually in: the last heading
      // whose top has scrolled above that line. That link stays active for
      // the section's full length, right up until the next heading crosses.
      const activationLine = 88; // px from viewport top - matches rootMargin below
      const updateActive = () => {
        let current = null;
        pubLinks.forEach((l) => {
          if (l.heading.getBoundingClientRect().top - activationLine <= 0) current = l;
        });
        pubLinks.forEach((l) => l.link.classList.toggle('is-active', l === current));
      };
      const io = new IntersectionObserver(updateActive, { rootMargin: `-${activationLine}px 0px -70% 0px` });
      pubHeadings.forEach((h) => io.observe(h));
    }
  } else if (pubTocList) {
    pubTocList.closest('.pub-toc').style.display = 'none';
  }

  // Mobile-only collapse for the publication TOC above (see .pub-toc-toggle
  // in custom.css) - above 900px the button is just a static-looking label
  // over an always-expanded list, unchanged from before; this only matters
  // once that breakpoint drops the sticky sidebar and the full link list
  // would otherwise sit fully expanded above the article on every load.
  const pubTocToggle = document.getElementById('pubTocToggle');
  const pubTocInner = document.getElementById('pubTocInner');
  if (pubTocToggle && pubTocInner) {
    pubTocToggle.addEventListener('click', () => {
      const isOpen = pubTocInner.classList.toggle('is-open');
      pubTocToggle.setAttribute('aria-expanded', String(isOpen));
    });
    // Jumping to a section via a tapped link should leave the list closed
    // again rather than sitting open (and covering the top of the article)
    // once the reader has already gone where they meant to go.
    pubTocInner.querySelectorAll('.pub-toc-list a').forEach((a) => {
      a.addEventListener('click', () => {
        pubTocInner.classList.remove('is-open');
        pubTocToggle.setAttribute('aria-expanded', 'false');
      });
    });
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
      // The CTA headings (data-tw-static) keep the trailing blinking
      // cursor as a small decorative touch, but skip the letter-by-letter
      // reveal itself - full text, cursor appended right after it, no
      // animation timeline to run at all.
      const cursorOnly = el.hasAttribute('data-tw-static');
      el.textContent = '';
      // The CSS hides [data-typewriter] text by default (via .js-tw) to
      // avoid a flash of the full static text before this runs; restore
      // visibility now that the content has been cleared synchronously,
      // so the browser never gets a chance to paint that in-between state.
      el.style.opacity = '1';

      if (cursorOnly) {
        el.textContent = text;
        const cursor = document.createElement('span');
        cursor.className = 'tw-cursor tw-cursor--blink';
        cursor.textContent = '_';
        el.appendChild(cursor);
        return;
      }

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
  // Read by the network canvas below: counting writes 8 elements' textContent
  // every frame for its whole 1.4s run, and on the home page that window
  // often lands while the hero (behind the sliding stats cover) hasn't
  // scrolled fully out of view yet, so its node-network canvas is still
  // redrawing too - two independent per-frame animators competing for the
  // same main thread right as the numbers land is a plausible source of a
  // dropped frame on slower hardware. Pausing the canvas for that one short
  // window costs nothing visible (it just holds its last frame briefly).
  let statsCounting = false;
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
        counters.forEach((el, i) => {
          el.style.opacity = '1';
          renderCount(el, targets[i]);
        });
        return;
      }

      counters.forEach(el => { el.style.opacity = '1'; });
      // Reserve each counter's final rendered width up front. Even with
      // tabular figures, specific digit combinations (adjacent same-digit
      // runs, digits either side of the thousands comma) still shape a
      // px or two narrower/wider than their neighbours in this font - a
      // per-frame width flicker that visibly re-centres the icon+number
      // pair on every change, since they sit inline in a centred row.
      // Measuring the end state and locking it in as min-width removes
      // the box-size change at the source instead of chasing font shaping.
      counters.forEach((el, i) => {
        renderCount(el, targets[i]);
        el.style.minWidth = el.getBoundingClientRect().width + 'px';
        renderCount(el, 0);
      });
      statsCounting = true;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / COUNT_DURATION, 1);
        const eased = easeOutCubic(progress);
        counters.forEach((el, i) => renderCount(el, Math.round(targets[i] * eased)));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          statsCounting = false;
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

  // About page's sticky section jump-nav (.section-subnav) sits directly
  // under the main nav once pinned, so anything scrolled to underneath it -
  // section headings, the keyboard section-nav's stops - needs to clear its
  // height too, not just the main nav's. Synced the same way as --nav-h,
  // since the pill row can wrap to two lines at narrower widths.
  const subnav = document.querySelector('.section-subnav');
  if (subnav) {
    const syncSubnavHeight = () => document.documentElement.style.setProperty('--subnav-h', subnav.getBoundingClientRect().height + 'px');
    syncSubnavHeight();
    window.addEventListener('resize', syncSubnavHeight);
  }

  // Reading-progress pill (post/publication pages only - see _layouts/
  // default.html). Tracked against the article body itself - .post-body-inner
  // on blog posts, .pub-body on publications - rather than the whole
  // document, so 0%/100% land on the article's own first and last line
  // instead of the page's header and footer. Stays off-screen until the
  // visitor has actually started scrolling, and hides again REVEAL_PX past
  // "done" rather than lingering fixed over the CTA/footer once there's
  // nothing left to track. Re-measures the article's position on every tick
  // rather than caching it at load - a post's featured image (loaded lazily,
  // no explicit width/height) can still be growing the article's height for
  // a moment after the page first settles, and a stale measurement would
  // throw off exactly where "100%" and the post-completion hide point land.
  const readingProgress = document.getElementById('readingProgress');
  const readingProgressFill = document.getElementById('readingProgressFill');
  const articleEl = document.querySelector('.post-body-inner, .pub-body');
  if (readingProgress && readingProgressFill && articleEl) {
    const REVEAL_PX = 80;
    const updateReadingProgress = () => {
      const rect = articleEl.getBoundingClientRect();
      const articleStart = rect.top + window.scrollY;
      const articleEnd = articleStart + articleEl.offsetHeight - window.innerHeight;
      const span = Math.max(1, articleEnd - articleStart);
      const pct = Math.min(100, Math.max(0, ((window.scrollY - articleStart) / span) * 100));
      readingProgressFill.style.width = pct + '%';
      const visible = window.scrollY > REVEAL_PX && window.scrollY < articleEnd + REVEAL_PX;
      readingProgress.classList.toggle('is-visible', visible);
    };
    updateReadingProgress();
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('resize', updateReadingProgress);
  }

  const navMenu = document.getElementById('navMenu');
  if (nav && navMenu) {
    navMenu.addEventListener('show.bs.collapse', () => nav.classList.add('menu-open'));
    navMenu.addEventListener('hidden.bs.collapse', () => nav.classList.remove('menu-open'));
  }

  const scrollHint = document.getElementById('scrollHint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      const hero = document.querySelector('.pin-cover-wrap') || document.querySelector('header');
      const next = hero ? hero.nextElementSibling : null;
      if (next) {
        const top = next.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // Pin + cover header: --pin-cover-h drives .pin-cover-wrap's height and
  // .pin-cover-section's negative margin (see custom.css) so any page's
  // header stays pinned for exactly as long as it takes the section
  // immediately after it to slide up and fully cover it. Measured rather
  // than assumed to be a fixed 100vh, since very short or zoomed
  // viewports can make the header's real content taller than that. Only
  // ever one such header per page, so a single shared variable is enough.
  const pinCoverHeader = document.querySelector('.pin-cover-header');
  if (pinCoverHeader) {
    let pinCoverSyncWidth = window.innerWidth;
    const syncPinCoverHeight = () => {
      document.documentElement.style.setProperty('--pin-cover-h', pinCoverHeader.getBoundingClientRect().height + 'px');
    };
    syncPinCoverHeight();
    // Mobile browsers fire resize repeatedly as their address bar hides
    // and shows *during* scroll, changing the reported viewport height
    // (and so the header's own min-vh-100 height) without the page
    // actually being resized. Reacting to that would yank --pin-cover-h -
    // and with it the wrap's height and the cover section's negative
    // margin/min-height - around mid-scroll, which reads as the whole
    // section repeatedly jerking. A genuine resize or orientation change
    // always changes the width too, so only that is trusted here.
    window.addEventListener('resize', () => {
      if (window.innerWidth !== pinCoverSyncWidth) {
        pinCoverSyncWidth = window.innerWidth;
        syncPinCoverHeight();
      }
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncPinCoverHeight);
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

    // A page's pin-cover header (see .pin-cover-section in custom.css) has
    // its wave built as a clipPath (objectBoundingBox, 0-1 space) driving a
    // real CSS-background div rather than an SVG fill, so its grid/dot
    // texture renders at true pixels instead of being squeezed through a
    // divider's non-uniform viewBox scale. It still rides the same drift
    // system as the rest, just normalized to 0-1. Only ever one per page.
    const pinCoverClipPath = document.querySelector('#pinCoverWaveClip path');
    // The home hero pairs the clip with .pin-cover-wave-fill; the Research
    // stats section reuses the same #pinCoverWaveClip via .research-stats-wave.
    // Whichever is present is the (single) element that rides this
    // normalized drift.
    const pinCoverWaveFill = document.querySelector('.pin-cover-wave-fill, .research-stats-wave');
    if (pinCoverClipPath && pinCoverWaveFill) {
      waves.push({
        svg: pinCoverWaveFill,
        path: pinCoverClipPath,
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

  // Keyboard section navigation (desktop): ArrowRight/ArrowLeft step through
  // a page's own major sections - marked with [data-kbd-stop] per layout -
  // interleaved with any finer-grained sub-stops that exist on that page:
  // each job-role entry on the About page (.info-card/.subrole), and each
  // on-page-TOC heading inside a publication's body. Interleaving both kinds
  // in one sorted-by-position list, rather than keeping them separate, is
  // what makes "next section" and "next job role"/"next heading" the same
  // keypress: pressing right just walks to whatever the next stop down the
  // page happens to be, section or sub-stop alike.
  const kbdStopEls = document.querySelectorAll('[data-kbd-stop]');
  if (kbdStopEls.length) {
    const SUBSTOP_SELECTOR = '.info-card, .subrole, #pubBody h2[id], #pubBody h3[id]';
    // A stop counts as "already reached" once its own scroll-margin-adjusted
    // position (i.e. exactly where scrollIntoView would land it) is at or
    // above this small, fixed slack - not the nav height itself. Reading
    // each element's live computed scroll-margin-top rather than
    // replicating the --nav-h/--subnav-h math here means this stays correct
    // even though --nav-h itself shrinks once the nav's .scrolled state
    // kicks in mid-scroll: re-deriving that number after the fact (rather
    // than reading what the browser actually used) once caused a stop to
    // stop counting as "reached" a keypress after landing on it, since the
    // nav had shrunk in between and the activation math no longer agreed
    // with where the element had actually settled.
    const REACHED_SLACK = 20;
    const isTypingTarget = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    const getStops = () => {
      const els = Array.from(kbdStopEls).concat(Array.from(document.querySelectorAll(SUBSTOP_SELECTOR)));
      return els
        .map((el) => {
          const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
          return { el, effectiveTop: el.getBoundingClientRect().top - marginTop };
        })
        .sort((a, b) => a.effectiveTop - b.effectiveTop);
    };

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isTypingTarget(document.activeElement)) return;
      const stops = getStops();
      // The current stop is the last one whose effective position has
      // already crossed the slack line - same "recompute on every check"
      // approach as the publication TOC's scrollspy, rather than trusting a
      // cached position.
      let currentIndex = -1;
      stops.forEach((s, i) => { if (s.effectiveTop <= REACHED_SLACK) currentIndex = i; });
      const target = e.key === 'ArrowRight'
        ? stops[currentIndex + 1]
        : (currentIndex > 0 ? stops[currentIndex - 1] : null);
      if (!target) return;
      e.preventDefault();
      target.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      dismissKbdHint();
    });
  }

  // Discreet keyboard-shortcut hint: only worth showing on pages the nav
  // above actually does something on, so it never advertises a shortcut
  // that wouldn't do anything here. Fades in shortly after load, fades back
  // out the moment the visitor actually uses the keys or scrolls down, and
  // fades back in on an upward scroll - the same hide-on-scroll-down/show-
  // on-scroll-up idea as a lot of mobile browser chrome - rather than
  // sitting on screen (or gone for good) regardless of what the visitor's
  // doing.
  const kbdHint = document.getElementById('kbdHint');
  const dismissKbdHint = () => {
    if (kbdHint) kbdHint.classList.remove('is-visible');
  };
  if (kbdHint && kbdStopEls.length) {
    setTimeout(() => kbdHint.classList.add('is-visible'), 900);

    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > lastScrollY + 4) dismissKbdHint();
      else if (y < lastScrollY - 4) kbdHint.classList.add('is-visible');
      lastScrollY = y;
    }, { passive: true });
  }
});

