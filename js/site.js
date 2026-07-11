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
