// ═══════════════════════════════════════
// SHARED JS — m-session marketing site
// Theme, scroll reveal, logo, menu, PJAX
// ═══════════════════════════════════════

// Internal namespace for cross-module communication
var __ms = {};

// Theme persistence — apply before render to prevent flash
(function () {
  var html = document.documentElement;
  if (localStorage.getItem('m-session-theme') === 'light') {
    html.classList.add('light');
  }
})();

// Theme toggle
(function () {
  var toggle = document.getElementById('theme-toggle');
  var html = document.documentElement;
  if (!toggle) return;

  function switchTheme() {
    html.classList.add('theme-transitioning');
    html.classList.toggle('light');
    localStorage.setItem(
      'm-session-theme',
      html.classList.contains('light') ? 'light' : 'dark'
    );
    setTimeout(function () {
      html.classList.remove('theme-transitioning');
    }, 550);
  }

  toggle.addEventListener('click', switchTheme);
  toggle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchTheme();
    }
  });
})();

// Scroll reveal (reinitable for PJAX)
(function () {
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );
  __ms.initScrollReveal = function () {
    document.querySelectorAll('.rv:not(.visible)').forEach(function (el) {
      if (!el.closest('.hero') && !el.closest('.page-hero')) obs.observe(el);
    });
  };
  __ms.initScrollReveal();
})();

// Logo animation: MDMA-SESSION <-> M-SESSION
(function () {
  var dma = document.getElementById('logo-dma');
  var hyphen = document.getElementById('logo-hyphen');
  if (!dma || !hyphen) return;
  var collapsed = false;
  function toggle() {
    collapsed = !collapsed;
    if (collapsed) {
      dma.classList.add('collapsed');
      hyphen.classList.add('visible');
    } else {
      dma.classList.remove('collapsed');
      hyphen.classList.remove('visible');
    }
  }
  function cycle() {
    toggle();
    setTimeout(function () {
      toggle();
      setTimeout(cycle, 3000);
    }, 2500);
  }
  setTimeout(cycle, 2500);
})();

// FAQ accordion (reinitable for PJAX)
(function () {
  __ms.initFaqAccordion = function () {
    document.querySelectorAll('.faq-question').forEach(function (q) {
      if (q._faqBound) return;
      q._faqBound = true;
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        document.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other !== item) other.classList.remove('open');
        });
        item.classList.toggle('open');
      });
    });
  };
  __ms.initFaqAccordion();
})();

// Menu overlay
(function () {
  var toggle = document.getElementById('menu-toggle');
  var overlay = document.getElementById('menu-overlay');
  if (!toggle || !overlay) return;

  var body = document.body;
  var isOpen = false;
  var isClosing = false;
  var CLOSE_DURATION = 700;

  var pageMap = { '/': 'home', '/about': 'about', '/faq': 'faq', '/contribute': 'contribute', '/privacy': 'privacy' };

  __ms.updateMenuActive = function () {
    var path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (path === '/landing-page') path = '/';
    var currentPage = pageMap[path];
    overlay.querySelectorAll('.menu-link').forEach(function (link) {
      if (currentPage && link.getAttribute('data-page') === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };
  __ms.updateMenuActive();

  function openMenu() {
    if (isClosing) return;
    isOpen = true;
    body.classList.remove('menu-closing');
    body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    if (!isOpen || isClosing) return;
    isOpen = false;
    isClosing = true;
    // Move focus out of overlay before aria-hidden is set
    if (document.activeElement && overlay.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    body.classList.remove('menu-open');
    body.classList.add('menu-closing');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(function () {
      body.classList.remove('menu-closing');
      overlay.setAttribute('aria-hidden', 'true');
      isClosing = false;
    }, CLOSE_DURATION);
  }

  // Toggle on hamburger click
  toggle.addEventListener('click', function () {
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  // Close on backdrop click
  var backdrop = overlay.querySelector('.menu-overlay-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  // Nav links — use PJAX when available
  overlay.querySelectorAll('.menu-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (link.classList.contains('active')) {
        closeMenu();
        return;
      }
      var href = link.getAttribute('href');
      closeMenu();
      if (__ms.navigate) {
        __ms.navigate(href);
      } else {
        body.classList.add('page-leaving');
        setTimeout(function () { window.location.href = href; }, 300);
      }
    });
  });
})();

// PJAX Navigation — client-side content swap
(function () {
  var body = document.body;
  var main = document.querySelector('main');
  if (!main) return;

  // Create transition wrap (main + footer)
  var wrap = document.createElement('div');
  wrap.className = 'page-transition-wrap';
  main.parentNode.insertBefore(wrap, main);
  wrap.appendChild(main);
  var footer = document.querySelector('footer');
  if (footer) wrap.appendChild(footer);

  var isNavigating = false;
  var pageScripts = [];

  function normalizePath(p) {
    return p.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  }

  function isInternalPageLink(a) {
    if (!a.href) return false;
    if (a.target === '_blank') return false;
    if (a.hostname !== window.location.hostname) return false;
    var href = a.getAttribute('href');
    if (href.charAt(0) === '#') return false;
    // Skip Launch App buttons
    if (a.closest('.header-nav') && a.classList.contains('btn')) return false;
    if (href.indexOf('/app') === 0) return false;
    return true;
  }

  function navigate(href, isPop) {
    if (isNavigating) return;
    var targetPath = normalizePath(href);
    var currentPath = normalizePath(window.location.pathname);
    if (targetPath === currentPath && !isPop) return;

    isNavigating = true;
    body.classList.add('page-leaving');

    // Fetch new page + wait for leave animation (whichever is longer)
    var fetchDone = fetch(href).then(function (r) { return r.text(); });
    var timerDone = new Promise(function (resolve) { setTimeout(resolve, 300); });

    Promise.all([fetchDone, timerDone])
      .then(function (results) {
        var html = results[0];
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main');
        if (!newMain) {
          window.location.href = href;
          return;
        }

        // Remove previously injected page scripts
        pageScripts.forEach(function (s) {
          if (s.parentNode) s.parentNode.removeChild(s);
        });
        pageScripts = [];

        // Swap main content
        main.innerHTML = newMain.innerHTML;

        // Update document title
        var newTitle = doc.querySelector('title');
        if (newTitle) document.title = newTitle.textContent;

        // Update canonical link
        var canon = document.querySelector('link[rel="canonical"]');
        var newCanon = doc.querySelector('link[rel="canonical"]');
        if (canon && newCanon) canon.href = newCanon.href;

        // Update meta description
        var desc = document.querySelector('meta[name="description"]');
        var newDesc = doc.querySelector('meta[name="description"]');
        if (desc && newDesc) desc.setAttribute('content', newDesc.getAttribute('content'));

        // Update URL (skip for back/forward)
        if (!isPop) history.pushState(null, '', href);

        // Scroll to top
        window.scrollTo(0, 0);

        // Re-trigger enter animation
        body.classList.remove('page-leaving');
        wrap.style.animation = 'none';
        void wrap.offsetHeight;
        wrap.style.animation = '';

        // Reinit shared modules
        __ms.initScrollReveal();
        __ms.initFaqAccordion();
        __ms.updateMenuActive();

        // Execute page-specific inline scripts from new page body
        var newBody = doc.querySelector('body');
        if (newBody) {
          newBody.querySelectorAll('script').forEach(function (s) {
            if (s.src && s.src.indexOf('shared.js') !== -1) return;
            if (s.type === 'application/ld+json') return;
            if (!s.src && !s.textContent.trim()) return;
            var ns = document.createElement('script');
            if (s.src) {
              ns.src = s.src;
            } else {
              ns.textContent = s.textContent;
            }
            document.body.appendChild(ns);
            pageScripts.push(ns);
          });
        }

        isNavigating = false;
      })
      .catch(function () {
        window.location.href = href;
      });
  }

  __ms.navigate = navigate;

  // Intercept internal link clicks
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !isInternalPageLink(a)) return;
    if (a.classList.contains('menu-link')) return;
    var href = a.getAttribute('href');
    if (normalizePath(window.location.pathname) === normalizePath(href)) return;
    e.preventDefault();
    navigate(href, false);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', function () {
    navigate(window.location.pathname, true);
  });
})();
