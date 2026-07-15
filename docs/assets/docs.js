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
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const match = links.find((l) => l.heading === entry.target);
          if (match) match.link.classList.toggle('is-active', entry.isIntersecting);
        });
      }, { rootMargin: '-80px 0px -70% 0px' });
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
