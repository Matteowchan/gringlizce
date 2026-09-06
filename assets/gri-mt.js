/* ============================================================
   GriMT — sayfa-içi TR->EN makine çevirisi (OpenAI edge fn, Google YOK)
   Küratörlü [data-blog-lang]/[data-i18n] içeriğin KAPSAMADIĞI her Türkçe metni
   (JS ile üretilen dahil) EN modunda çevirir; TR'ye dönünce orijinali geri yükler.
   Oturum-güvenli (aynı alan adı), önbellekli (localStorage + sunucu mt_cache).
   nav.js applyLang() içinden GriMT.apply(lang) ile çağrılır.
   ============================================================ */
(function () {
  if (window.GriMT) return;
  var EP = "https://vazbvbqgvtlaqkytfsbi.supabase.co/functions/v1/translate";
  var AK = "sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g";
  var LS = "gri-mt-en-v1";
  var cache = {};
  try { cache = JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) {}
  function saveCache() { try { localStorage.setItem(LS, JSON.stringify(cache)); } catch (e) {} }

  var handled = [];              // {node, orig} — TR'ye dönüş için
  var queued = new WeakSet();    // sıraya alınmış/işlenmiş text node'lar
  var active = false, obs = null, pending = false, flushTimer = null;
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1, OPTION: 0 };

  function skip(el) {
    while (el && el.nodeType) {
      if (el.nodeType === 1) {
        if (SKIP_TAGS[el.tagName]) return true;
        if (el.tagName === "svg" || el.namespaceURI === "http://www.w3.org/2000/svg") return true;
        if (el.hasAttribute) {
          if (el.hasAttribute("data-blog-lang") || el.hasAttribute("data-i18n") ||
              el.hasAttribute("data-i18n-tr") || el.hasAttribute("data-mt-skip") ||
              el.getAttribute("translate") === "no") return true;
          // yalnız KÖK-olmayan, açıkça İngilizce işaretli öğeleri atla (html lang="en" değil)
          if (el !== document.documentElement && el !== document.body && el.getAttribute("lang") === "en" && !el.hasAttribute("data-blog-lang")) return true;
        }
        var c = el.className;
        if (typeof c === "string" && (/\bgri-nav\b|\bgri-lang\b|\bgri-mmenu\b|\bgoog-/.test(c))) return true;
      }
      el = el.parentNode;
    }
    return false;
  }
  function ok(t) {
    var s = t.replace(/\s+/g, " ").trim();
    if (s.length < 2) return false;
    if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) return false; // harf içermeli
    if (/^[0-9\s.,:;/%+\-()]+$/.test(s)) return false;   // salt sayı/simge
    return true;
  }
  function collect(root) {
    var out = [];
    try {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var n;
      while ((n = w.nextNode())) {
        if (queued.has(n)) continue;
        if (!n.nodeValue || !ok(n.nodeValue)) continue;
        if (skip(n.parentNode)) continue;
        out.push(n);
      }
    } catch (e) {}
    return out;
  }
  function keyOf(s) { return s.replace(/\s+/g, " ").trim(); }

  function processNodes(nodes) {
    if (!nodes.length) return;
    var need = {};      // key -> true (cache miss)
    var byKey = {};     // key -> [ {node, orig} ]
    nodes.forEach(function (node) {
      queued.add(node);
      var orig = node.nodeValue;
      var k = keyOf(orig);
      (byKey[k] = byKey[k] || []).push({ node: node, orig: orig });
      handled.push({ node: node, orig: orig });
      if (cache[k] != null) {
        applyTo(node, orig, cache[k]);
      } else {
        need[k] = true;
      }
    });
    var miss = Object.keys(need);
    if (!miss.length) return;
    // sunucuya gönder (parça parça)
    for (var i = 0; i < miss.length; i += 90) {
      (function (chunk) {
        fetch(EP, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": AK, "Authorization": "Bearer " + AK },
          body: JSON.stringify({ texts: chunk })
        }).then(function (r) { return r.json(); }).then(function (res) {
          var tr = (res && res.translations) || {};
          var changed = false;
          chunk.forEach(function (k) {
            var en = tr[k];
            if (en == null) return;
            cache[k] = en; changed = true;
            if (!active) return;
            (byKey[k] || []).forEach(function (rec) {
              if (rec.node && rec.node.parentNode) applyTo(rec.node, rec.orig, en);
            });
          });
          if (changed) saveCache();
        }).catch(function () {});
      })(miss.slice(i, i + 90));
    }
  }
  // orijinaldeki baştaki/sondaki boşlukları koruyarak EN'i yerleştir
  function applyTo(node, orig, en) {
    if (!node) return;
    var lead = (orig.match(/^\s*/) || [""])[0];
    var trail = (orig.match(/\s*$/) || [""])[0];
    try { node.nodeValue = lead + en + trail; } catch (e) {}
  }

  // ---- Öznitelik çevirisi (placeholder/title/aria-label/alt) ----
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];
  var attrHandled = []; // {el, attr, orig}
  var attrQueued = new WeakSet();
  function collectAttrs() {
    var jobs = []; // {el, attr, val}
    var els = document.querySelectorAll("[placeholder],[title],[aria-label],[alt]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (skip(el)) continue;
      for (var a = 0; a < ATTRS.length; a++) {
        var attr = ATTRS[a];
        if (!el.hasAttribute(attr)) continue;
        var key = attr + "|" + (el.__mtA = el.__mtA || Math.random());
        if (attrQueued.has(el) && el.getAttribute("data-mt-a-" + a) === "1") continue;
        var v = el.getAttribute(attr);
        if (!v || !ok(v)) continue;
        jobs.push({ el: el, attr: attr, val: v, ai: a });
      }
    }
    return jobs;
  }
  function processAttrs(jobs) {
    if (!jobs.length) return;
    var byKey = {}; var need = {};
    jobs.forEach(function (j) {
      try { j.el.setAttribute("data-mt-a-" + j.ai, "1"); } catch (e) {}
      attrHandled.push({ el: j.el, attr: j.attr, orig: j.val });
      var k = keyOf(j.val);
      (byKey[k] = byKey[k] || []).push(j);
      if (cache[k] != null) { try { j.el.setAttribute(j.attr, cache[k]); } catch (e) {} }
      else need[k] = true;
    });
    var miss = Object.keys(need);
    for (var i = 0; i < miss.length; i += 90) {
      (function (chunk) {
        fetch(EP, { method: "POST", headers: { "Content-Type": "application/json", "apikey": AK, "Authorization": "Bearer " + AK }, body: JSON.stringify({ texts: chunk }) })
          .then(function (r) { return r.json(); }).then(function (res) {
            var tr = (res && res.translations) || {}; var changed = false;
            chunk.forEach(function (k) { var en = tr[k]; if (en == null) return; cache[k] = en; changed = true;
              if (!active) return;
              (byKey[k] || []).forEach(function (j) { try { j.el.setAttribute(j.attr, en); } catch (e) {} });
            });
            if (changed) saveCache();
          }).catch(function () {});
      })(miss.slice(i, i + 90));
    }
  }
  function restoreAttrs() {
    for (var i = 0; i < attrHandled.length; i++) {
      var h = attrHandled[i];
      try { if (h.el) h.el.setAttribute(h.attr, h.orig); } catch (e) {}
    }
  }

  function flush() {
    flushTimer = null;
    if (!active) return;
    processNodes(collect(document.body));
    processAttrs(collectAttrs());
  }
  function schedule() { if (flushTimer) return; flushTimer = setTimeout(flush, 250); }

  function startObs() {
    if (obs) return;
    try {
      obs = new MutationObserver(function () { if (active) schedule(); });
      obs.observe(document.body, { childList: true, subtree: true, characterData: false });
    } catch (e) {}
  }
  function stopObs() { if (obs) { try { obs.disconnect(); } catch (e) {} obs = null; } }

  function restore() {
    active = false; stopObs();
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    for (var i = 0; i < handled.length; i++) {
      var h = handled[i];
      if (h.node && h.node.parentNode) { try { h.node.nodeValue = h.orig; } catch (e) {} }
    }
    restoreAttrs();
  }

  function pass() { processNodes(collect(document.body)); processAttrs(collectAttrs()); }
  function apply(lang) {
    if (lang === "en") {
      if (active) { schedule(); return; }
      active = true;
      pass();               // ilk geçiş
      startObs();
      setTimeout(function () { if (active) pass(); }, 900);   // geç-render JS içerik
      setTimeout(function () { if (active) pass(); }, 2500);
    } else {
      restore();
    }
  }

  window.GriMT = { apply: apply };
})();
