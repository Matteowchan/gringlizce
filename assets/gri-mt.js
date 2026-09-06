/* ============================================================
   GriMT — "EN pill = her şey İngilizce". Google YOK.
   Öncelik: GÖMÜLÜ sözlük window.__MTMAP (assets/gri-i18n-map.js) → anında, ağsız.
   Sözlükte olmayan (nadir/yeni) Türkçe metinler: OpenAI 'translate' edge fn ile
   bir kez çevrilir, localStorage'a önbelleklenir (sonraki sefer anında).
   Küratörlü [data-blog-lang]/[data-i18n] içeriğe dokunmaz. MutationObserver ile
   JS-üretilen/geç-render içerikleri de yakalar. TR'de orijinali geri yükler.
   ============================================================ */
(function () {
  if (window.GriMT) return;
  var EP = "https://vazbvbqgvtlaqkytfsbi.supabase.co/functions/v1/translate";
  var AK = "sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g";
  var LS = "gri-mt-en-v1";
  var lc = {};
  try { lc = JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) {}
  function saveLC() { try { localStorage.setItem(LS, JSON.stringify(lc)); } catch (e) {} }
  function look(k) {
    var m = window.__MTMAP;
    if (m && Object.prototype.hasOwnProperty.call(m, k)) return m[k];
    if (Object.prototype.hasOwnProperty.call(lc, k)) return lc[k];
    return null;
  }

  var handled = [], attrHandled = [], queued = new WeakSet();
  var active = false, obs = null, flushTimer = null;
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1 };
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];

  function skip(el) {
    while (el && el.nodeType) {
      if (el.nodeType === 1) {
        if (SKIP_TAGS[el.tagName]) return true;
        if (el.namespaceURI === "http://www.w3.org/2000/svg") return true;
        if (el.hasAttribute) {
          if (el.hasAttribute("data-blog-lang") || el.hasAttribute("data-i18n") ||
              el.hasAttribute("data-i18n-tr") || el.hasAttribute("data-mt-skip") ||
              el.getAttribute("translate") === "no") return true;
          if (el !== document.documentElement && el !== document.body &&
              el.getAttribute("lang") === "en" && !el.hasAttribute("data-blog-lang")) return true;
        }
        var c = el.className;
        if (typeof c === "string" && /\bgri-nav\b|\bgri-lang\b|\bgri-mmenu\b/.test(c)) return true;
      }
      el = el.parentNode;
    }
    return false;
  }
  function ok(t) {
    var s = t.replace(/\s+/g, " ").trim();
    if (s.length < 2 || s.length > 3000) return false;
    if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) return false;
    if (/^[0-9\s.,:;/%+\-()]+$/.test(s)) return false;
    return true;
  }
  function keyOf(s) { return s.replace(/\s+/g, " ").trim(); }
  function setNode(node, orig, en) {
    var lead = (orig.match(/^\s*/) || [""])[0], trail = (orig.match(/\s*$/) || [""])[0];
    try { node.nodeValue = lead + en + trail; } catch (e) {}
  }

  function passNodes(root) {
    var w;
    try { w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false); } catch (e) { return; }
    var n, missKeys = {}, missBy = {};
    while ((n = w.nextNode())) {
      if (queued.has(n)) continue;
      var orig = n.nodeValue;
      if (!orig || !ok(orig)) continue;
      if (skip(n.parentNode)) continue;
      queued.add(n);
      var k = keyOf(orig), en = look(k);
      if (en != null) { if (en !== k) { handled.push({ node: n, orig: orig }); setNode(n, orig, en); } }
      else { missKeys[k] = true; (missBy[k] = missBy[k] || []).push({ node: n, orig: orig }); }
    }
    fetchMiss(Object.keys(missKeys), function (k, en) {
      (missBy[k] || []).forEach(function (r) { if (r.node && r.node.parentNode) { handled.push({ node: r.node, orig: r.orig }); setNode(r.node, r.orig, en); } });
    });
  }
  function passAttrs() {
    var els = document.querySelectorAll("[placeholder],[title],[aria-label],[alt]");
    var missKeys = {}, missBy = {};
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (skip(el)) continue;
      for (var a = 0; a < ATTRS.length; a++) {
        var attr = ATTRS[a]; if (!el.hasAttribute(attr)) continue;
        var mark = "data-mt-a" + a; if (el.getAttribute(mark) === "1") continue;
        var v = el.getAttribute(attr); if (!v || !ok(v)) continue;
        el.setAttribute(mark, "1");
        var k = keyOf(v), en = look(k);
        if (en != null) { if (en !== k) { attrHandled.push({ el: el, attr: attr, orig: v }); try { el.setAttribute(attr, en); } catch (e) {} } }
        else { missKeys[k] = true; (missBy[k] = missBy[k] || []).push({ el: el, attr: attr, orig: v }); }
      }
    }
    fetchMiss(Object.keys(missKeys), function (k, en) {
      (missBy[k] || []).forEach(function (r) { attrHandled.push({ el: r.el, attr: r.attr, orig: r.orig }); try { r.el.setAttribute(r.attr, en); } catch (e) {} });
    });
  }

  var inflight = {};
  function fetchMiss(keys, onEach) {
    keys = keys.filter(function (k) { return !inflight[k]; });
    if (!keys.length) return;
    for (var i = 0; i < keys.length; i += 80) {
      (function (chunk) {
        chunk.forEach(function (k) { inflight[k] = 1; });
        fetch(EP, { method: "POST", headers: { "Content-Type": "application/json", "apikey": AK, "Authorization": "Bearer " + AK }, body: JSON.stringify({ texts: chunk }) })
          .then(function (r) { return r.json(); }).then(function (res) {
            var tr = (res && res.translations) || {}, changed = false;
            chunk.forEach(function (k) {
              delete inflight[k];
              var en = tr[k]; if (en == null) return;
              lc[k] = en; changed = true;
              if (active && en !== k) onEach(k, en);
            });
            if (changed) saveLC();
          }).catch(function () { chunk.forEach(function (k) { delete inflight[k]; }); });
      })(keys.slice(i, i + 80));
    }
  }

  function pass() { passNodes(document.body); passAttrs(); }
  function schedule() { if (flushTimer) return; flushTimer = setTimeout(function () { flushTimer = null; if (active) pass(); }, 250); }
  function startObs() { if (obs) return; try { obs = new MutationObserver(function () { if (active) schedule(); }); obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
  function stopObs() { if (obs) { try { obs.disconnect(); } catch (e) {} obs = null; } }
  function restore() {
    active = false; stopObs(); if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    for (var i = 0; i < handled.length; i++) { var h = handled[i]; if (h.node && h.node.parentNode) { try { h.node.nodeValue = h.orig; } catch (e) {} } }
    for (var j = 0; j < attrHandled.length; j++) { var x = attrHandled[j]; if (x.el) { try { x.el.setAttribute(x.attr, x.orig); } catch (e) {} } }
  }
  function apply(lang) {
    if (lang === "en") {
      if (active) { schedule(); return; }
      active = true; pass(); startObs();
      setTimeout(function () { if (active) pass(); }, 800);
      setTimeout(function () { if (active) pass(); }, 2400);
    } else { restore(); }
  }
  window.GriMT = { apply: apply };
})();
