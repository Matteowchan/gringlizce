/* Gri English - icerik kopya korumasi (dengeli / caydirici)
   - contextmenu, copy, cut, dragstart engellenir (form alanlari haric)
   - metin secimi kapatilir; ANCAK gri-sozluk (kelime arama) yuklu sayfalarda
     secim acik birakilir ki sozluk calissin (kopya yine engellidir)
   Not: bu bir caydiricidir; devtools/kaynak-goruntule ile asilabilir. */
(function () {
  'use strict';
  function editable(el) {
    if (!el || !el.closest) return false;
    return !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
  }
  // gri-sozluk kelime-arama secim gerektirir; varsa secimi kapatma
  var hasDict = !!(window.GriSozluk || document.querySelector('script[src*="gri-sozluk"]'));
  var css =
    (hasDict ? '' :
      'body{-webkit-user-select:none;-ms-user-select:none;user-select:none;}' +
      'input,textarea,select,[contenteditable="true"],.allow-select,[data-allow-select] *{-webkit-user-select:text;-ms-user-select:text;user-select:text;}') +
    'img{-webkit-user-drag:none;user-drag:none;}';
  try { var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st); } catch (e) {}

  var toast, tHide;
  function ping() {
    try {
      if (!toast) {
        toast = document.createElement('div');
        toast.setAttribute('role', 'status');
        toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(20,20,20,.92);color:#fff;padding:.55rem 1rem;border-radius:10px;font:600 13px/1.3 system-ui,-apple-system,sans-serif;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw;text-align:center;';
        toast.textContent = "Bu içerik Gri English'e aittir · kopyalama kapalı";
        (document.body || document.documentElement).appendChild(toast);
      }
      toast.style.opacity = '1';
      clearTimeout(tHide);
      tHide = setTimeout(function () { toast.style.opacity = '0'; }, 1400);
    } catch (e) {}
  }
  function guard(e) {
    if (editable(e.target)) return;
    e.preventDefault();
    ping();
    return false;
  }
  document.addEventListener('contextmenu', guard);
  document.addEventListener('copy', guard);
  document.addEventListener('cut', guard);
  document.addEventListener('dragstart', function (e) { if (!editable(e.target)) e.preventDefault(); });
})();
