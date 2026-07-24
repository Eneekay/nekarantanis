document.addEventListener('DOMContentLoaded', () => {
  // Highlight the sidebar link matching the current page.
  const here = window.location.pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.docs-nav-link').forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/index\.html$/, '/');
    if (linkPath === here) link.classList.add('is-active');
  });

  // Mobile nav drawer.
  const toggle = document.getElementById('docsNavToggle');
  const sidebar = document.getElementById('docsSidebar');
  const backdrop = document.getElementById('docsNavBackdrop');
  if (toggle && sidebar && backdrop) {
    const closeNav = () => {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('is-open');
      backdrop.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    backdrop.addEventListener('click', closeNav);
    sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
  }

  // Build the "on this page" TOC from the article's own h2/h3 headings -
  // kramdown auto-generates an id for every heading, so this just needs to
  // read them back rather than slugifying anything itself.
  const tocList = document.getElementById('docsTocList');
  const headings = document.querySelectorAll('.docs-content h2[id], .docs-content h3[id]');
  if (tocList && headings.length) {
    const links = [];
    headings.forEach((h) => {
      const li = document.createElement('li');
      if (h.tagName === 'H3') li.className = 'docs-toc-h3';
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
      links.push({ heading: h, link: a });
    });

    if ('IntersectionObserver' in window) {
      // Toggling `is-active` straight off `entry.isIntersecting` lit up a
      // heading's link only while the heading itself sat inside the shrunk
      // root band, so the highlight vanished the moment you scrolled past a
      // short section - well before you'd actually finished reading it (same
      // issue the publication TOC's scrollspy hit - see js/site.js). Instead,
      // every time any heading crosses the activation line, recompute which
      // section we're actually in: the last heading whose top has scrolled
      // above that line. That link stays active for the section's full
      // length, right up until the next heading crosses.
      const activationLine = 80; // px from viewport top - matches rootMargin below
      const updateActive = () => {
        let current = null;
        links.forEach((l) => {
          if (l.heading.getBoundingClientRect().top - activationLine <= 0) current = l;
        });
        links.forEach((l) => l.link.classList.toggle('is-active', l === current));
      };
      const io = new IntersectionObserver(updateActive, { rootMargin: `-${activationLine}px 0px -70% 0px` });
      headings.forEach((h) => io.observe(h));
    }
  } else if (tocList) {
    tocList.closest('.docs-toc').style.display = 'none';
  }

  // Small "Copy" button on every fenced code block.
  document.querySelectorAll('.docs-content pre').forEach((pre) => {
    const btn = document.createElement('button');
    btn.className = 'docs-copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.textContent : pre.textContent).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
    pre.appendChild(btn);
  });
});
