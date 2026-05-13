/* ============================================================
   GRI ENGLISH — Theme toggle
   ============================================================ */
(function() {
  var THEME_KEY = 'gri-theme';

  // Toggle button injection on DOM ready
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

    // Insert before the "Materyal Girişi" CTA so toggle sits left of it
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

  // Sync across tabs
  window.addEventListener('storage', function(e) {
    if (e.key !== THEME_KEY || !e.newValue) return;
    document.documentElement.setAttribute('data-theme', e.newValue);
  });
})();
