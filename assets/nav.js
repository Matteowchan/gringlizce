/* Gri English . paylasimli nav (kendini enjekte eder)
   Her sayfaya:  <script src="assets/curriculum.js"></script><script src="assets/nav.js"></script>
   Index nav yapisi (dropdown ve alt menuler) + tema secici, Aa, gece modu, avatar.
   Menu window.GRI_NAV'dan gelir (curriculum.js). Tema localStorage'da. Build yok. */
(function () {
  "use strict";

  var CSS = [
    ":root{--gri-bg:#F1EAD9;--gri-surface:#FBF6EC;--gri-surface-2:#F4EDDC;--gri-ink:#241E17;--gri-ink-soft:#6E6353;--gri-ink-faint:#9A8E7B;--gri-line:#E3D8C3;--gri-line-soft:#EDE4D2;--gri-gold:#B78A2E;--gri-accent:#2E6E6A;--gri-accent-soft:#DDEBE8;--gri-accent-deep:#123C39;--gri-info:#6E4A8E;--gri-info-ink:#F5EEFB;--gri-nav-bg:#F7F1E4;--gri-shadow:0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.06)}",
    "[data-theme='erik']{--bg:#F1E7EC;--bg-soft:#F7EEF2;--teal:#8A4A63;--teal-deep:#5C3042;--teal-soft:rgba(138,74,99,.13);--cat-accent:#8A4A63;--gri-bg:#F1E7EC;--gri-surface:#FAF3F6;--bg-card:#FAF3F6;--gri-surface-2:#F3E7EC;--gri-accent:#8A4A63;--gri-accent-soft:#F0DFE6;--gri-accent-deep:#5C3042}",
    "[data-theme='orman']{--bg:#E8EEE5;--bg-soft:#F0F4EE;--teal:#3E6B4A;--teal-deep:#20402B;--teal-soft:rgba(62,107,74,.13);--cat-accent:#3E6B4A;--gri-bg:#E8EEE5;--gri-surface:#F2F6F0;--bg-card:#F2F6F0;--gri-surface-2:#E6EDE4;--gri-accent:#3E6B4A;--gri-accent-soft:#DFEBE1;--gri-accent-deep:#20402B}",
    "[data-theme='kum']{--bg:#F3EAD6;--bg-soft:#F8F1E2;--teal:#A9772E;--teal-deep:#6E4B18;--teal-soft:rgba(169,119,46,.14);--cat-accent:#A9772E;--gri-bg:#F3EAD6;--gri-surface:#FAF3E4;--bg-card:#FAF3E4;--gri-surface-2:#F3EAD4;--gri-accent:#A9772E;--gri-accent-soft:#F3E7CD;--gri-accent-deep:#6E4B18}","[data-theme='okyanus']{--bg:#E7EDF3;--bg-soft:#F0F4F9;--teal:#2E5E8A;--teal-deep:#1E3E5C;--teal-soft:rgba(46,94,138,.13);--cat-accent:#2E5E8A;--gri-bg:#E7EDF3;--gri-surface:#F2F6FA;--bg-card:#F2F6FA;--gri-surface-2:#E4EDF4;--gri-accent:#2E5E8A;--gri-accent-soft:#DBE6F0;--gri-accent-deep:#1E3E5C}","[data-theme='gul']{--bg:#F3E9EE;--bg-soft:#F9F1F5;--teal:#B0567A;--teal-deep:#7E3A56;--teal-soft:rgba(176,86,122,.13);--cat-accent:#B0567A;--gri-bg:#F3E9EE;--gri-surface:#FAF3F6;--bg-card:#FAF3F6;--gri-surface-2:#F3E7EE;--gri-accent:#B0567A;--gri-accent-soft:#F1DFE8;--gri-accent-deep:#7E3A56}","[data-theme='bordo']{--bg:#F1E8EA;--bg-soft:#F8F1F2;--teal:#8E3B4C;--teal-deep:#5E2632;--teal-soft:rgba(142,59,76,.13);--cat-accent:#8E3B4C;--gri-bg:#F1E8EA;--gri-surface:#FAF2F4;--bg-card:#FAF2F4;--gri-surface-2:#F2E6E9;--gri-accent:#8E3B4C;--gri-accent-soft:#EFDCE1;--gri-accent-deep:#5E2632}","[data-theme='lavanta']{--bg:#ECE9F3;--bg-soft:#F4F2F9;--teal:#6E5AA0;--teal-deep:#493A6E;--teal-soft:rgba(110,90,160,.13);--cat-accent:#6E5AA0;--gri-bg:#ECE9F3;--gri-surface:#F5F3FA;--bg-card:#F5F3FA;--gri-surface-2:#E9E5F2;--gri-accent:#6E5AA0;--gri-accent-soft:#E4DEF0;--gri-accent-deep:#493A6E}",
    "[data-theme='dark']{--gri-bg:#151210;--gri-surface:#201C17;--gri-surface-2:#1B1813;--gri-ink:#F1E9D9;--gri-ink-soft:#B7AB96;--gri-ink-faint:#7E7362;--gri-line:#332C22;--gri-line-soft:#2A241C;--gri-gold:#D8B25A;--gri-accent:#6FB6AF;--gri-accent-soft:#22322F;--gri-accent-deep:#A9D6D1;--gri-info:#8B6BA9;--gri-nav-bg:#1C1813;--gri-shadow:0 2px 4px rgba(0,0,0,.3),0 12px 32px rgba(0,0,0,.4)}",
    ".gri-nav{position:sticky;top:0;z-index:60;background:var(--gri-surface);border-bottom:1px solid var(--gri-line);font-family:Inter,sans-serif}",
    ".gri-nav .in{max-width:1200px;margin:0 auto;padding:0 26px;display:flex;align-items:center;gap:20px;height:66px}",
    ".gri-nav .brand{display:flex;align-items:baseline;font-family:'Playfair Display',serif;font-weight:600;font-size:1.45rem;letter-spacing:-.01em;white-space:nowrap;color:var(--gri-ink);text-decoration:none}",
    ".gri-nav .brand .it{font-style:italic;font-weight:400;color:var(--gri-accent);margin-left:.32em}",
    ".gri-nav .links,.gri-nav .links .gri-dd>button{font-family:'Crimson Pro',Georgia,serif}",".gri-nav .links{display:flex;align-items:stretch;gap:1.5rem;margin-left:10px}",
    ".gri-nav .links>a,.gri-nav .links .gri-dd>button{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:0;line-height:1.2;color:var(--gri-ink-soft);background:none;border:none;border-bottom:1.5px solid transparent;cursor:pointer;padding:5px 0;white-space:nowrap;text-decoration:none;font-family:'Crimson Pro',Georgia,serif}",".gri-nav .nw1{font-family:'Crimson Pro',Georgia,serif;font-size:13px;font-weight:500;color:var(--gri-ink-soft);display:inline-flex;align-items:center;gap:4px}",".gri-nav .nw2{font-family:'Crimson Pro',Georgia,serif;font-size:13px;font-weight:500;color:var(--gri-ink-soft)}",
    ".gri-nav .links>a:hover,.gri-dd:hover>button,.gri-nav .links>a.here,.gri-dd.here>button{border-bottom-color:var(--gri-gold)}",".gri-nav .links>a:hover .nw1,.gri-dd:hover .nw1,.gri-nav .links>a.here .nw1,.gri-dd.here .nw1,.gri-nav .links>a:hover .nw2,.gri-dd:hover .nw2,.gri-nav .links>a.here .nw2,.gri-dd.here .nw2{color:var(--gri-accent)}",
    
    ".gri-dd{position:relative}",
    ".gri-dd .cv{width:8px;height:8px;opacity:.5;transition:.2s}.gri-dd.open .cv,.gri-dd:hover .cv{transform:rotate(180deg)}",
    ".gri-dd-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:210px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:14px;box-shadow:var(--gri-shadow);padding:8px;display:none;z-index:70}",
    ".gri-dd.open .gri-dd-menu,.gri-dd:hover .gri-dd-menu{display:block}",
    ".gri-dd-menu a{display:block;padding:8px 11px;border-radius:9px;color:var(--gri-ink-soft);text-decoration:none;font-size:13.5px;white-space:nowrap}",
    ".gri-dd-menu a:hover{background:var(--gri-surface-2);color:var(--gri-ink)}",
    ".gri-grp{padding:4px 0}.gri-grp+.gri-grp{border-top:1px solid var(--gri-line-soft);margin-top:4px}",
    ".gri-grp>.gh{font-weight:700;color:var(--gri-ink);font-size:12.5px}",
    ".gri-grp .gri-sub a{padding-left:22px;font-size:13.5px;color:var(--gri-ink-soft)}",
    ".gri-nav .right{margin-left:auto;display:flex;align-items:center;gap:9px}",
    ".gri-themes{display:flex;gap:5px;background:var(--gri-surface-2);border:1px solid var(--gri-line);border-radius:20px;padding:4px}",
    ".gri-themes button{width:20px;height:20px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:.15s}",
    ".gri-themes button[data-t='krem']{background:#2E6E6A}.gri-themes button[data-t='erik']{background:#8A4A63}.gri-themes button[data-t='orman']{background:#3E6B4A}.gri-themes button[data-t='kum']{background:#A9772E}",
    ".gri-themes button.on{border-color:var(--gri-ink-faint);transform:scale(1.12)}",
    ".gri-ico{width:34px;height:34px;border-radius:50%;border:1px solid var(--gri-line);background:var(--gri-surface);color:var(--gri-ink-soft);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:12.5px}",
    ".gri-ico:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",
    ".gri-avatar{width:34px;height:34px;border-radius:50%;background:var(--gri-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:14px}",".gri-user-mount{display:flex;align-items:center}",".gri-giris{display:inline-flex;align-items:center;background:var(--gri-accent);color:#fff;border-radius:20px;padding:8px 16px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;text-decoration:none}.gri-giris:hover{background:var(--gri-accent-deep)}",".gri-rdd{position:relative}",".gri-rdd>button{display:flex;align-items:center;gap:6px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:20px;padding:7px 13px;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;color:var(--gri-ink-soft)}",".gri-rdd>button:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",".gri-user-dd>button{background:none;border:none;padding:0}",".gri-rdd>button .cv{width:9px;height:9px;opacity:.6;transition:.2s}.gri-rdd.open>button .cv{transform:rotate(180deg)}",".gri-rdd-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:186px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:14px;box-shadow:var(--gri-shadow);padding:8px;display:none;z-index:80}",".gri-rdd.open .gri-rdd-menu{display:block}",".gri-rdd-menu a{display:block;padding:9px 11px;border-radius:9px;color:var(--gri-ink-soft);text-decoration:none;font-family:Inter,sans-serif;font-size:13.5px}",".gri-rdd-menu a:hover{background:var(--gri-surface-2);color:var(--gri-ink)}",".gri-th-opt{display:flex;align-items:center;gap:9px;width:100%;padding:8px 11px;border:none;background:none;cursor:pointer;border-radius:9px;font-family:Inter,sans-serif;font-size:13.5px;color:var(--gri-ink-soft);text-align:left}",".gri-th-opt:hover{background:var(--gri-surface-2);color:var(--gri-ink)}.gri-th-opt.on{color:var(--gri-ink);font-weight:600}",".gri-th-opt .dot{width:14px;height:14px;border-radius:50%;flex:none;border:1px solid rgba(0,0,0,.12)}",".gri-th-lbl{font-family:Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gri-ink-faint);padding:6px 11px 4px}",
    ".gri-burger{display:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--gri-line);background:var(--gri-surface);cursor:pointer;align-items:center;justify-content:center}",
    ".gri-burger svg{width:18px;height:18px;color:var(--gri-ink)}",
    ".gri-mmenu{display:none}",
    "@media(max-width:1080px){.gri-nav .links,.gri-rdd,.gri-ico{display:none}.gri-burger{display:flex}",
    ".gri-mmenu.open{display:block;border-top:1px solid var(--gri-line);background:var(--gri-nav-bg);max-height:70vh;overflow:auto}",
    ".gri-mmenu .in{max-width:1200px;margin:0 auto;padding:10px 22px 20px}",
    ".gri-mrow{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gri-line-soft);font-size:15px;font-weight:500;color:var(--gri-ink-soft);cursor:pointer}",
    ".gri-mrow a{color:inherit;text-decoration:none;flex:1}.gri-mrow .cv{width:12px;height:12px;transition:.2s}.gri-msec.open .gri-mrow .cv{transform:rotate(180deg)}",
    ".gri-msub{display:none;padding:2px 0 8px 12px}.gri-msec.open .gri-msub{display:block}",
    ".gri-msub a{display:block;padding:9px 0;font-size:14px;color:var(--gri-ink-faint);text-decoration:none}",
    ".gri-mth{display:flex;gap:8px;margin-top:16px;align-items:center}.gri-mth button{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer}}"
  ].join("");

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="cat-face" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><circle cx="10" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="14" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><path d="M10.5 16 Q11.2 16.8 12 16.4 Q12.8 16.8 13.5 16"/></g></symbol>' +
    '<symbol id="cat-happy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><path d="M9 12.5 Q10 11.5 11 12.5"/><path d="M13 12.5 Q14 11.5 15 12.5"/><path d="M10 15.5 Q12 17.5 14 15.5"/></g></symbol>' +
    '<symbol id="cat-sleep" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><path d="M9 12.5 Q10 11.8 11 12.5"/><path d="M13 12.5 Q14 11.8 15 12.5"/><path d="M11 16 L13 16"/><path d="M17 6 L19 4"/><path d="M18 8 L20 6"/></g></symbol>' +
    "</svg>";

  var CVDOWN = '<svg class="cv" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var THEMES = [
    { t: "krem", name: "Krem", dot: "#2E6E6A" }, { t: "erik", name: "Erik", dot: "#8A4A63" },
    { t: "orman", name: "Orman", dot: "#3E6B4A" }, { t: "kum", name: "Kum", dot: "#A9772E" },
    { t: "okyanus", name: "Okyanus", dot: "#2E5E8A" }, { t: "gul", name: "Gül", dot: "#B0567A" },
    { t: "bordo", name: "Bordo", dot: "#8E3B4C" }, { t: "lavanta", name: "Lavanta", dot: "#6E5AA0" },
    { t: "dark", name: "Gece", dot: "#201C17" }
  ];
  function themeOptsHtml(){ return THEMES.map(function(x){ return "<button class='gri-th-opt' data-t='"+x.t+"'><span class='dot' style='background:"+x.dot+"'></span>"+x.name+"</button>"; }).join(""); }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function twoline(label, caret) { var i = label.indexOf(" "); var w1 = i === -1 ? label : label.slice(0, i); var w2 = i === -1 ? "" : label.slice(i + 1); return '<span class="nw1">' + esc(w1) + (caret ? CVDOWN : "") + '</span>' + (w2 ? '<span class="nw2">' + esc(w2) + "</span>" : ""); }

  function readTheme() { try { return localStorage.getItem("gri-theme") || "krem"; } catch (e) { return "krem"; } }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("gri-theme", t); } catch (e) {}
    var b = document.querySelectorAll(".gri-th-opt");
    for (var i = 0; i < b.length; i++) b[i].classList.toggle("on", b[i].getAttribute("data-t") === t);
  }
  document.documentElement.setAttribute("data-theme", readTheme());

  var st = document.createElement("style"); st.setAttribute("data-gri-nav", ""); st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);

  function hrefsOf(item, acc) { if (item.href) acc.push(item.href.toLowerCase().split("/").pop()); if (item.children) item.children.forEach(function (c) { hrefsOf(c, acc); }); return acc; }

  function build() {
    if (document.querySelector(".gri-nav")) return;
    var _segs = location.pathname.split("/").filter(Boolean);
    var _inDir = location.pathname.slice(-1) === "/" ? _segs.length : _segs.length - 1;
    var BASE = _inDir > 0 ? new Array(_inDir + 1).join("../") : "";
    function href(h){ return esc((/^(https?:|\/|#)/.test(h) ? "" : BASE) + h); }
    var MENU = window.GRI_NAV || [];
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    var links = MENU.map(function (it) {
      var active = hrefsOf(it, []).indexOf(here) !== -1;
      if (!it.children) return '<a href="' + href(it.href) + '"' + (active ? ' class="here"' : "") + ">" + twoline(it.label, false) + "</a>";
      var groups = it.children.map(function (ch) {
        if (ch.children) {
          var subs = ch.children.map(function (g) { return '<a href="' + href(g.href) + '">' + esc(g.label) + "</a>"; }).join("");
          return '<div class="gri-grp"><a class="gh" href="' + href(ch.href) + '">' + esc(ch.label) + '</a><div class="gri-sub">' + subs + "</div></div>";
        }
        return '<a href="' + href(ch.href) + '">' + esc(ch.label) + "</a>";
      }).join("");
      return '<div class="gri-dd' + (active ? " here" : "") + '"><button type="button" data-dd>' + twoline(it.label, true) + '</button><div class="gri-dd-menu">' + groups + "</div></div>";
    }).join("");

    var mrows = MENU.map(function (it) {
      if (!it.children) return '<div class="gri-mrow"><a href="' + href(it.href) + '">' + esc(it.label) + "</a></div>";
      var subs = it.children.map(function (ch) {
        var head = '<a href="' + href(ch.href) + '">' + esc(ch.label) + "</a>";
        var gk = ch.children ? ch.children.map(function (g) { return '<a href="' + href(g.href) + '">' + esc(g.label) + "</a>"; }).join("") : "";
        return head + gk;
      }).join("");
      return '<div class="gri-msec"><div class="gri-mrow" data-msec><span>' + esc(it.label) + "</span>" + CVDOWN + '</div><div class="gri-msub">' + subs + "</div></div>";
    }).join("");

    var tOpts = themeOptsHtml();

    var frag = document.createElement("div");
    frag.insertAdjacentHTML("beforeend", SPRITE);


    frag.insertAdjacentHTML("beforeend",
      '<header class="gri-nav"><div class="in">' +
      '<a href="' + BASE + 'index.html" class="brand">Gri<span class="it">English</span></a>' +
      '<nav class="links">' + links + "</nav>" +
      '<div class="right">' +
      '<div class="gri-rdd gri-theme-dd"><button type="button" data-dd>Tema' + CVDOWN + '</button><div class="gri-rdd-menu">' + tOpts + '</div></div>' +
      "<button class='gri-ico aa' id='gri-fs' title='Yazi boyutu'>Aa</button>" +
      "<button class='gri-ico' id='gri-dark' title='Gece modu'><svg viewBox='0 0 20 20' width='16' height='16' fill='currentColor'><path d='M13 2a8 8 0 105 14A7 7 0 0113 2z'/></svg></button>" +
      '<div id="navUserMount" class="gri-user-mount"></div>' +
      "<button class='gri-burger' id='gri-burger'><svg viewBox='0 0 24 24' fill='none'><path d='M4 7h16M4 12h16M4 17h16' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg></button>" +
      "</div></div>" +
      '<div class="gri-mmenu" id="gri-mmenu"><div class="in">' + mrows +
      '<a class="gri-mrow" href="' + BASE + 'panelim.html">Çalışma Masam</a><div class="gri-th-lbl">Tema</div>' + tOpts + "</div></div></header>");

    var _lb = document.querySelector(".launch-banner");
    var _ref = (_lb && _lb.parentNode === document.body) ? _lb.nextSibling : document.body.firstChild;
    if (_ref && _ref.parentNode !== document.body) _ref = null; // gecersiz referansta basa/sona guvenli ekle
    while (frag.firstChild) document.body.insertBefore(frag.firstChild, _ref);
    applyTheme(readTheme());
    var _mnt = document.getElementById("navUserMount");
    if (_mnt && !_mnt.innerHTML.trim()) _mnt.innerHTML = '<a href="' + BASE + 'giris.html" class="gri-giris">Giriş</a>';

    document.addEventListener("click", function (e) {
      var t = e.target;
      var themeBtn = t.closest && t.closest(".gri-th-opt[data-t]");
      if (themeBtn) { applyTheme(themeBtn.getAttribute("data-t"));
        document.querySelectorAll(".gri-dd.open,.gri-rdd.open").forEach(function (x) { x.classList.remove("open"); }); return; }
      var dd = t.closest && t.closest("[data-dd]");
      if (dd) { var box = dd.closest(".gri-dd,.gri-rdd"); var wasOpen = box.classList.contains("open");
        document.querySelectorAll(".gri-dd.open,.gri-rdd.open").forEach(function (x) { x.classList.remove("open"); });
        if (!wasOpen) box.classList.add("open"); e.stopPropagation(); return; }
      var ms = t.closest && t.closest("[data-msec]");
      if (ms && !t.closest("a")) { ms.parentNode.classList.toggle("open"); return; }
      if (!(t.closest && (t.closest(".gri-dd-menu") || t.closest(".gri-rdd-menu")))) {
        document.querySelectorAll(".gri-dd.open,.gri-rdd.open").forEach(function (x) { x.classList.remove("open"); });
      }
    });
    var dark = document.getElementById("gri-dark");
    if (dark) dark.addEventListener("click", function () { applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "krem" : "dark"); });
    var SIZES = ["15px", "16.5px", "18px"], fs = document.getElementById("gri-fs");
    try { var sf = localStorage.getItem("gri-fs"); if (sf) document.documentElement.style.fontSize = sf; } catch (e) {}
    if (fs) fs.addEventListener("click", function () {
      var cur = (document.documentElement.style.fontSize || "16.5px");
      var i = (SIZES.indexOf(cur) + 1) % SIZES.length;
      document.documentElement.style.fontSize = SIZES[i];
      try { localStorage.setItem("gri-fs", SIZES[i]); } catch (e) {}
    });
    var burger = document.getElementById("gri-burger");
    if (burger) burger.addEventListener("click", function () { document.getElementById("gri-mmenu").classList.toggle("open"); });
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
})();
