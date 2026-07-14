function syncLogoWidths() {
  document.querySelectorAll('.logo-slot').forEach(slot => {
    const title = slot.nextElementSibling;
    if (!title) return;
    const clone = title.cloneNode(true);
    clone.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;height:auto;width:auto;white-space:nowrap;';
    document.body.appendChild(clone);
    const naturalWidth = clone.getBoundingClientRect().width;
    clone.remove();
    const parentWidth = slot.parentElement.getBoundingClientRect().width;
    const width = Math.min(naturalWidth, parentWidth);
    if (width > 0) slot.style.width = Math.round(width) + 'px';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  syncLogoWidths();
  window.addEventListener('resize', syncLogoWidths);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncLogoWidths);

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
});
