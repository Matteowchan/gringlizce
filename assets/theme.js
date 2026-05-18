/* ============================================================
   GRI ENGLISH — Theme toggle + mobile nav
   ============================================================ */

/* -------- Font size control (5 levels) -------- */
(function() {
  var FONT_KEY = 'gri-font-size';
  var LEVELS = ['xs', 's', 'm', 'l', 'xl'];
  var LABELS = { xs: 'Çok Küçük', s: 'Küçük', m: 'Normal', l: 'Büyük', xl: 'Çok Büyük' };

  // Pre-apply saved level before paint to avoid flash
  try {
    var saved = localStorage.getItem(FONT_KEY);
    if (saved && LEVELS.indexOf(saved) !== -1) {
      document.documentElement.setAttribute('data-font', saved);
    } else {
      document.documentElement.setAttribute('data-font', 'm');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-font', 'm');
  }

  function injectFontControl() {
    var navList = document.querySelector('.nav-links');
    if (!navList) return;
    if (document.getElementById('font-size-toggle')) return;

    var li = document.createElement('li');
    li.className = 'font-size-wrap';

    var btn = document.createElement('button');
    btn.id = 'font-size-toggle';
    btn.className = 'font-size-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Yazı boyutu');
    btn.setAttribute('title', 'Yazı boyutu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="font-size-toggle-label" aria-hidden="true"><span class="fs-a-small">A</span><span class="fs-a-big">a</span></span>';

    var pop = document.createElement('div');
    pop.className = 'font-size-pop';
    pop.setAttribute('role', 'menu');
    pop.setAttribute('aria-label', 'Yazı boyutu seçenekleri');
    var html = '<div class="font-size-pop-title">Yazı boyutu</div><div class="font-size-pop-row">';
    LEVELS.forEach(function(lv) {
      html += '<button type="button" class="font-size-opt" data-lv="' + lv + '" aria-label="' + LABELS[lv] + '" title="' + LABELS[lv] + '">A</button>';
    });
    html += '</div><div class="font-size-pop-hint">Tüm site için geçerli.</div>';
    pop.innerHTML = html;

    li.appendChild(btn);
    li.appendChild(pop);

    var themeToggle = navList.querySelector('.theme-toggle-wrap');
    if (themeToggle) {
      navList.insertBefore(li, themeToggle);
    } else {
      var cta = navList.querySelector('.btn-nav-cta');
      if (cta && cta.parentElement && cta.parentElement.tagName === 'LI') {
        navList.insertBefore(li, cta.parentElement);
      } else {
        navList.appendChild(li);
      }
    }

    function syncActive() {
      var current = document.documentElement.getAttribute('data-font') || 'm';
      pop.querySelectorAll('.font-size-opt').forEach(function(b) {
        b.classList.toggle('active', b.dataset.lv === current);
      });
    }
    syncActive();

    function openPop() {
      pop.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closePop() {
      pop.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    function togglePop() {
      if (pop.classList.contains('open')) closePop(); else openPop();
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      togglePop();
    });

    pop.addEventListener('click', function(e) {
      var opt = e.target.closest('.font-size-opt');
      if (!opt) return;
      var lv = opt.dataset.lv;
      if (LEVELS.indexOf(lv) === -1) return;
      document.documentElement.setAttribute('data-font', lv);
      try { localStorage.setItem(FONT_KEY, lv); } catch (err) {}
      syncActive();
    });

    document.addEventListener('click', function(e) {
      if (!pop.classList.contains('open')) return;
      if (li.contains(e.target)) return;
      closePop();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && pop.classList.contains('open')) closePop();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFontControl);
  } else {
    injectFontControl();
  }

  window.addEventListener('storage', function(e) {
    if (e.key !== FONT_KEY || !e.newValue) return;
    if (LEVELS.indexOf(e.newValue) === -1) return;
    document.documentElement.setAttribute('data-font', e.newValue);
    var pop = document.querySelector('.font-size-pop');
    if (pop) {
      pop.querySelectorAll('.font-size-opt').forEach(function(b) {
        b.classList.toggle('active', b.dataset.lv === e.newValue);
      });
    }
  });
})();


/* -------- Theme toggle -------- */
(function() {
  var THEME_KEY = 'gri-theme';

  function injectToggle() {
    var navList = document.querySelector('.nav-links');
    if (!navList) return;
    if (document.getElementById('theme-toggle')) return;

    var li = document.createElement('li');
    li.className = 'theme-toggle-wrap';
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Tema değiştir');
    btn.setAttribute('title', 'Tema değiştir');
    btn.innerHTML = ''
      + '<svg class="t-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>'
      + '<svg class="t-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    btn.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch(e) {}
    });

    li.appendChild(btn);

    var cta = navList.querySelector('.btn-nav-cta');
    if (cta && cta.parentElement && cta.parentElement.tagName === 'LI') {
      navList.insertBefore(li, cta.parentElement);
    } else {
      navList.appendChild(li);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToggle);
  } else {
    injectToggle();
  }

  window.addEventListener('storage', function(e) {
    if (e.key !== THEME_KEY || !e.newValue) return;
    document.documentElement.setAttribute('data-theme', e.newValue);
  });
})();


/* -------- Mobile menu (hamburger) -------- */
(function() {
  function injectMobileMenu() {
    var navContainer = document.querySelector('.site-header .nav');
    var navList = document.querySelector('.nav-links');
    if (!navContainer || !navList) return;
    if (document.getElementById('mobile-toggle')) return;

    var btn = document.createElement('button');
    btn.id = 'mobile-toggle';
    btn.className = 'mobile-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menü');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';

    navContainer.appendChild(btn);
    navList.classList.add('nav-mobile-drawer');

    function close() {
      navList.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = navList.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('menu-open', isOpen);
    });

    navList.addEventListener('click', function(e) {
      var a = e.target.closest && e.target.closest('a');
      if (a) close();
    });

    document.addEventListener('click', function(e) {
      if (!navList.classList.contains('open')) return;
      if (navList.contains(e.target) || btn.contains(e.target)) return;
      close();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navList.classList.contains('open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMobileMenu);
  } else {
    injectMobileMenu();
  }
})();


/* -------- Back button (mobile only, non-home pages) -------- */
(function() {
  function isHomePage() {
    var p = window.location.pathname.replace(/\/$/, '');
    return p === '' || p === '/' || p.endsWith('/index.html') || p.endsWith('/index');
  }

  function injectBackButton() {
    if (isHomePage()) return;
    if (document.getElementById('mobile-back')) return;

    var btn = document.createElement('button');
    btn.id = 'mobile-back';
    btn.className = 'mobile-back';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Geri');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg><span>Geri</span>';

    btn.addEventListener('click', function() {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        var path = window.location.pathname;
        if (path.indexOf('/urun/') !== -1 || path.indexOf('/calisma/') !== -1) {
          window.location.href = '../index.html';
        } else {
          window.location.href = 'index.html';
        }
      }
    });

    var header = document.querySelector('.site-header');
    if (header && header.nextElementSibling) {
      header.parentNode.insertBefore(btn, header.nextElementSibling);
    } else if (header) {
      header.parentNode.appendChild(btn);
    } else {
      document.body.insertBefore(btn, document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBackButton);
  } else {
    injectBackButton();
  }
})();



/* -------- Nav dropdown (Soru Bankası) -------- */
(function() {
  function initDropdowns() {
    var dropdowns = document.querySelectorAll('.nav-dropdown');
    if (!dropdowns.length) return;

    dropdowns.forEach(function(dd) {
      var trigger = dd.querySelector('.nav-dropdown-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = dd.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        // Close other dropdowns
        dropdowns.forEach(function(other) {
          if (other !== dd) {
            other.classList.remove('open');
            var ot = other.querySelector('.nav-dropdown-trigger');
            if (ot) ot.setAttribute('aria-expanded', 'false');
          }
        });
        // Close all submenus when toggling parent
        if (!isOpen) {
          dd.querySelectorAll('.nav-submenu.open').forEach(function(s) {
            s.classList.remove('open');
          });
        }
      });
    });

    // Submenu triggers (e.g. SAT inside dropdown)
    var submenus = document.querySelectorAll('.nav-submenu');
    submenus.forEach(function(sm) {
      var trigger = sm.querySelector('.nav-submenu-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function(e) {
        // On mobile drawer mode, prevent navigation and toggle submenu instead
        var inDrawer = sm.closest('.nav-mobile-drawer.open');
        if (inDrawer) {
          e.preventDefault();
          e.stopPropagation();
          sm.classList.toggle('open');
        }
        // On desktop: allow click-through (link to landing page) but also keep dropdown open
      });
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      dropdowns.forEach(function(dd) {
        if (!dd.contains(e.target) && dd.classList.contains('open')) {
          dd.classList.remove('open');
          var t = dd.querySelector('.nav-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
          dd.querySelectorAll('.nav-submenu.open').forEach(function(s) {
            s.classList.remove('open');
          });
        }
      });
    });

    // Close on escape
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      dropdowns.forEach(function(dd) {
        if (dd.classList.contains('open')) {
          dd.classList.remove('open');
          var t = dd.querySelector('.nav-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns);
  } else {
    initDropdowns();
  }
})();



/* -------- Nav dropdown hover with delay (prevents accidental close) -------- */
(function() {
  function initHoverDropdowns() {
    var dropdowns = document.querySelectorAll('.nav-dropdown');
    if (!dropdowns.length) return;

    // Skip on touch devices — click-only there
    if (!window.matchMedia('(hover: hover)').matches) return;

    var timers = new WeakMap();
    var CLOSE_DELAY = 250;

    function openDropdown(dd) {
      clearTimeout(timers.get(dd));
      dd.classList.add('open');
      var trigger = dd.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    function scheduleClose(dd) {
      clearTimeout(timers.get(dd));
      var t = setTimeout(function() {
        dd.classList.remove('open');
        var trigger = dd.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        dd.querySelectorAll('.nav-submenu.open').forEach(function(s) {
          s.classList.remove('open');
        });
      }, CLOSE_DELAY);
      timers.set(dd, t);
    }

    dropdowns.forEach(function(dd) {
      dd.addEventListener('mouseenter', function() { openDropdown(dd); });
      dd.addEventListener('mouseleave', function() { scheduleClose(dd); });
    });

    // Submenus get the same treatment
    var submenus = document.querySelectorAll('.nav-submenu');
    submenus.forEach(function(sm) {
      sm.addEventListener('mouseenter', function() {
        clearTimeout(timers.get(sm));
        sm.classList.add('open');
      });
      sm.addEventListener('mouseleave', function() {
        clearTimeout(timers.get(sm));
        var t = setTimeout(function() {
          sm.classList.remove('open');
        }, CLOSE_DELAY);
        timers.set(sm, t);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHoverDropdowns);
  } else {
    initHoverDropdowns();
  }
})();
