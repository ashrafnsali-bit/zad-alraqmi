/* =========================================================
   ZAD ALRAQMI — interactions
   ========================================================= */
(function () {
  'use strict';

  const header = document.getElementById('header');
  const progress = document.querySelector('.scroll-progress span');
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const toTop = document.getElementById('toTop');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header state + progress + to-top ---------- */
  let ticking = false;
  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    header.classList.toggle('scrolled', y > 24);
    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, y / max) : 0;
      progress.style.transform = 'scaleX(' + ratio + ')';
    }
    if (toTop) toTop.hidden = y < 700;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  if (navToggle && nav) {
    const setNav = (open) => {
      nav.classList.toggle('open', open);
      header.classList.toggle('nav-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    navToggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setNav(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && nav.classList.contains('open')) setNav(false);
    });
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- active nav link ---------- */
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- to top ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- lightbox ---------- */
  const gallery = document.getElementById('gallery');
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCount = document.getElementById('lbCount');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  if (gallery && lightbox && lbImage) {
    const buttons = Array.from(gallery.querySelectorAll('button[data-src]'));
    const sources = buttons.map(function (b) { return b.getAttribute('data-src'); });
    let index = 0;
    let lastFocus = null;

    function render() {
      lbImage.src = sources[index];
      lbCount.textContent = (index + 1) + ' / ' + sources.length;
    }
    function open(i) {
      index = i;
      lastFocus = document.activeElement;
      render();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }
    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    function step(dir) {
      index = (index + dir + sources.length) % sources.length;
      render();
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { open(i); });
    });
    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', function () { step(-1); });
    lbNext.addEventListener('click', function () { step(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });

    /* swipe on touch devices */
    let touchX = null;
    lightbox.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 45) step(dx > 0 ? -1 : 1);
      touchX = null;
    }, { passive: true });
  }

  /* ---------- video modal ---------- */
  const vModal = document.getElementById('videoModal');
  const vPlayer = document.getElementById('vmPlayer');
  const vTitle = document.getElementById('vmTitle');
  const vClose = document.getElementById('vmClose');
  const vBackdrop = document.getElementById('vmBackdrop');

  if (vModal && vPlayer) {
    let vFocus = null;

    function openVideo(src, title, poster) {
      vFocus = document.activeElement;
      vTitle.textContent = title || '';
      if (poster) vPlayer.setAttribute('poster', poster);
      vPlayer.src = src;
      vModal.hidden = false;
      document.body.style.overflow = 'hidden';
      const p = vPlayer.play();
      if (p && p.catch) p.catch(function () {});
      vClose.focus();
    }

    function closeVideo() {
      vPlayer.pause();
      vPlayer.removeAttribute('src');
      vPlayer.load();
      vModal.hidden = true;
      document.body.style.overflow = '';
      if (vFocus) vFocus.focus();
    }

    document.querySelectorAll('[data-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openVideo(
          btn.getAttribute('data-video'),
          btn.getAttribute('data-title'),
          btn.getAttribute('data-poster')
        );
      });
    });

    vClose.addEventListener('click', closeVideo);
    if (vBackdrop) vBackdrop.addEventListener('click', closeVideo);
    document.addEventListener('keydown', function (e) {
      if (!vModal.hidden && e.key === 'Escape') closeVideo();
    });
  }

  /* ---------- subtle tilt on hero frame (desktop only) ---------- */
  const frame = document.querySelector('.hero-visual');
  if (frame && window.matchMedia('(hover:hover) and (min-width:900px)').matches && !reduceMotion) {
    const visual = frame.querySelector('.frame');
    frame.addEventListener('mousemove', function (e) {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      visual.style.transform = 'perspective(1000px) rotateY(' + (x * -2.2) + 'deg) rotateX(' + (y * 1.6) + 'deg)';
    });
    frame.addEventListener('mouseleave', function () {
      visual.style.transform = '';
    });
  }
})();
