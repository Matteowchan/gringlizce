/* Gri English . paylasimli nav (kendini enjekte eder)
   Her sayfaya tek satirla eklenir:  <script src="nav.js" defer></script>
   Placeholder gerekmez. Nav, mor bilgi bari, tema sistemi ve Gri kedi sprite'i tek kaynak.
   Tema secimi localStorage'da tutulur, sayfalar arasi korunur. Build yok. */
(function () {
  "use strict";

  /* ---------- tema token'lari ve nav stilleri (gri- namespace, cakisma yok) ---------- */
  var CSS = [
    ":root{--gri-bg:#F1EAD9;--gri-surface:#FBF6EC;--gri-surface-2:#F4EDDC;--gri-ink:#241E17;--gri-ink-soft:#6E6353;--gri-ink-faint:#9A8E7B;--gri-line:#E3D8C3;--gri-line-soft:#EDE4D2;--gri-gold:#B78A2E;--gri-accent:#2E6E6A;--gri-accent-soft:#DDEBE8;--gri-accent-deep:#123C39;--gri-info:#6E4A8E;--gri-info-ink:#F5EEFB;--gri-nav-bg:#F7F1E4;--gri-shadow:0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.06);--gri-shadow-lg:0 8px 20px rgba(40,30,20,.09),0 26px 64px rgba(40,30,20,.10)}",
    "[data-theme='erik']{--gri-accent:#8A4A63;--gri-accent-soft:#F0DFE6;--gri-accent-deep:#5C3042}",
    "[data-theme='orman']{--gri-accent:#3E6B4A;--gri-accent-soft:#DFEBE1;--gri-accent-deep:#20402B}",
    "[data-theme='kum']{--gri-accent:#A9772E;--gri-accent-soft:#F3E7CD;--gri-accent-deep:#6E4B18}",
    "[data-theme='gece']{--gri-bg:#151210;--gri-surface:#201C17;--gri-surface-2:#1B1813;--gri-ink:#F1E9D9;--gri-ink-soft:#B7AB96;--gri-ink-faint:#7E7362;--gri-line:#332C22;--gri-line-soft:#2A241C;--gri-gold:#D8B25A;--gri-accent:#6FB6AF;--gri-accent-soft:#22322F;--gri-accent-deep:#A9D6D1;--gri-info:#8B6BA9;--gri-nav-bg:#1C1813;--gri-shadow:0 2px 4px rgba(0,0,0,.3),0 12px 32px rgba(0,0,0,.4);--gri-shadow-lg:0 8px 20px rgba(0,0,0,.45),0 26px 64px rgba(0,0,0,.55)}",
    ".gri-infobar{background:var(--gri-info);color:var(--gri-info-ink);font-family:Inter,sans-serif;font-size:13px}",
    ".gri-infobar .in{max-width:1200px;margin:0 auto;padding:0 22px;display:flex;align-items:center;gap:12px;height:38px}",
    ".gri-infobar .tag{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:rgba(255,255,255,.18);padding:2px 8px;border-radius:20px}",
    ".gri-infobar .msg{flex:1;opacity:.96}.gri-infobar a{color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:2px}",
    ".gri-infobar .x{cursor:pointer;opacity:.75;font-size:16px;line-height:1}",
    ".gri-nav{position:sticky;top:0;z-index:50;background:var(--gri-nav-bg);border-bottom:1px solid var(--gri-line);box-shadow:0 1px 0 rgba(40,30,20,.03),0 6px 18px rgba(40,30,20,.04);font-family:Inter,sans-serif}",
    ".gri-nav .in{max-width:1200px;margin:0 auto;padding:0 22px;display:flex;align-items:center;gap:24px;height:62px}",
    ".gri-nav .brand{display:flex;align-items:center;font-family:'Playfair Display',serif;font-weight:800;font-size:1.3rem;letter-spacing:-.01em;white-space:nowrap;color:var(--gri-ink);text-decoration:none}",
    ".gri-nav .brand .it{font-style:italic;font-weight:600;color:var(--gri-accent);margin-left:.28em}",
    ".gri-nav .links{display:flex;gap:20px;margin-left:6px;font-size:13.5px;font-weight:500}",
    ".gri-nav .links a{color:var(--gri-ink-soft);padding:6px 0;position:relative;white-space:nowrap;text-decoration:none}",
    ".gri-nav .links a:hover{color:var(--gri-ink)}",
    ".gri-nav .links a.here{color:var(--gri-ink);font-weight:600}",
    ".gri-nav .links a.here::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--gri-accent);border-radius:2px}",
    ".gri-nav .right{margin-left:auto;display:flex;align-items:center;gap:10px}",
    ".gri-themes{display:flex;gap:5px;background:var(--gri-surface-2);border:1px solid var(--gri-line);border-radius:20px;padding:4px}",
    ".gri-themes button{width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:.15s}",
    ".gri-themes button[data-t='krem']{background:#2E6E6A}.gri-themes button[data-t='erik']{background:#8A4A63}.gri-themes button[data-t='orman']{background:#3E6B4A}.gri-themes button[data-t='kum']{background:#A9772E}",
    ".gri-themes button.on{border-color:var(--gri-ink-faint);transform:scale(1.12)}",
    ".gri-ico{width:36px;height:36px;border-radius:50%;border:1px solid var(--gri-line);background:var(--gri-surface);color:var(--gri-ink-soft);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:13px;transition:.15s}",
    ".gri-ico:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",
    ".gri-avatar{width:36px;height:36px;border-radius:50%;background:var(--gri-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:14px}",
    ".gri-burger{display:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--gri-line);background:var(--gri-surface);cursor:pointer;align-items:center;justify-content:center}",
    ".gri-burger svg{width:18px;height:18px;color:var(--gri-ink)}",
    ".gri-mmenu{display:none}",
    "@media(max-width:920px){.gri-nav .links{display:none}.gri-themes,.gri-ico.aa{display:none}.gri-burger{display:flex}.gri-mmenu.open{display:block;border-top:1px solid var(--gri-line);background:var(--gri-nav-bg)}.gri-mmenu .in{max-width:1200px;margin:0 auto;padding:14px 22px 20px}.gri-mmenu a{display:block;padding:11px 0;font-family:Inter,sans-serif;font-size:15px;font-weight:500;color:var(--gri-ink-soft);border-bottom:1px solid var(--gri-line-soft);text-decoration:none}.gri-mmenu .mth{display:flex;gap:8px;margin-top:14px}.gri-mmenu .mth button{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer}}"
  ].join("");

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="cat-face" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><circle cx="10" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="14" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><path d="M10.5 16 Q11.2 16.8 12 16.4 Q12.8 16.8 13.5 16"/></g></symbol>' +
    '<symbol id="cat-happy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><path d="M9 12.5 Q10 11.5 11 12.5"/><path d="M13 12.5 Q14 11.5 15 12.5"/><path d="M10 15.5 Q12 17.5 14 15.5"/></g></symbol>' +
    '<symbol id="cat-sleep" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><path d="M9 12.5 Q10 11.8 11 12.5"/><path d="M13 12.5 Q14 11.8 15 12.5"/><path d="M11 16 L13 16"/><path d="M17 6 L19 4"/><path d="M18 8 L20 6"/></g></symbol>' +
    "</svg>";

  /* ---------- tema, sayfa boyanmadan uygula (flash yok) ---------- */
  function readTheme() {
    try { return localStorage.getItem("gri-theme") || "krem"; } catch (e) { return "krem"; }
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("gri-theme", t); } catch (e) {}
    var btns = document.querySelectorAll(".gri-themes button, .gri-mmenu .mth button");
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("on", btns[i].getAttribute("data-t") === t);
  }
  document.documentElement.setAttribute("data-theme", readTheme());

  var style = document.createElement("style");
  style.setAttribute("data-gri-nav", "");
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  /* ---------- nav'i insa et ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function build() {
    if (document.querySelector(".gri-nav")) return; /* iki kez enjekte etme */
    var links = window.GRI_NAV_LINKS || [{ label: "Ogrenme Haritasi", href: "ogrenme-haritasi.html" }];
    var info = window.GRI_INFO || null;
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    var frag = document.createElement("div");
    frag.insertAdjacentHTML("beforeend", SPRITE);

    /* mor bilgi bari (admin baglanabilir; window.GRI_INFO ile beslenir) */
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("gri-info-x") === "1"; } catch (e) {}
    if (info && !dismissed) {
      frag.insertAdjacentHTML("beforeend",
        '<div class="gri-infobar" id="gri-infobar"><div class="in">' +
        '<span class="tag">' + esc(info.tag) + '</span>' +
        '<span class="msg">' + esc(info.message) + (info.linkText ? ' <a href="' + esc(info.linkHref || "#") + '">' + esc(info.linkText) + "</a>" : "") + "</span>" +
        '<span class="x" id="gri-info-x" title="Kapat">&times;</span></div></div>');
    }

    var linkHtml = links.map(function (l) {
      var cur = (l.href || "").toLowerCase().split("/").pop() === here ? " here" : "";
      return '<a href="' + esc(l.href) + '" class="' + cur.trim() + '">' + esc(l.label) + "</a>";
    }).join("");

    frag.insertAdjacentHTML("beforeend",
      '<header class="gri-nav"><div class="in">' +
      '<a href="ogrenme-haritasi.html" class="brand">Gri<span class="it">English</span></a>' +
      '<nav class="links">' + linkHtml + "</nav>" +
      '<div class="right">' +
      '<div class="gri-themes" id="gri-themes">' +
      "<button data-t='krem' title='Krem'></button><button data-t='erik' title='Erik'></button><button data-t='orman' title='Orman'></button><button data-t='kum' title='Kum'></button></div>" +
      "<button class='gri-ico aa' id='gri-fs' title='Yazi boyutu'>Aa</button>" +
      "<button class='gri-ico' id='gri-dark' title='Gece modu'><svg viewBox='0 0 20 20' width='16' height='16' fill='currentColor'><path d='M13 2a8 8 0 105 14A7 7 0 0113 2z'/></svg></button>" +
      "<div class='gri-avatar'>M</div>" +
      "<button class='gri-burger' id='gri-burger'><svg viewBox='0 0 24 24' fill='none'><path d='M4 7h16M4 12h16M4 17h16' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg></button>" +
      "</div></div>" +
      '<div class="gri-mmenu" id="gri-mmenu"><div class="in">' + linkHtml +
      '<div class="mth"><button data-t="krem" style="background:#2E6E6A"></button><button data-t="erik" style="background:#8A4A63"></button><button data-t="orman" style="background:#3E6B4A"></button><button data-t="kum" style="background:#A9772E"></button><button data-t="gece" style="background:#201C17"></button></div>' +
      "</div></div></header>");

    while (frag.firstChild) document.body.insertBefore(frag.firstChild, document.body.firstChild);

    applyTheme(readTheme());

    /* olaylar */
    document.addEventListener("click", function (e) {
      var tb = e.target.closest && e.target.closest(".gri-themes button[data-t], .gri-mmenu .mth button[data-t]");
      if (tb) { applyTheme(tb.getAttribute("data-t")); return; }
    });
    var dark = document.getElementById("gri-dark");
    if (dark) dark.addEventListener("click", function () { applyTheme(document.documentElement.getAttribute("data-theme") === "gece" ? "krem" : "gece"); });
    var SIZES = ["17px", "18px", "20px"];
    var fs = document.getElementById("gri-fs");
    try { var sf = localStorage.getItem("gri-fs"); if (sf) document.documentElement.style.setProperty("--fs", sf); } catch (e) {}
    if (fs) fs.addEventListener("click", function () {
      var cur = (getComputedStyle(document.documentElement).getPropertyValue("--fs") || "18px").trim();
      var i = (SIZES.indexOf(cur) + 1) % SIZES.length;
      document.documentElement.style.setProperty("--fs", SIZES[i]);
      try { localStorage.setItem("gri-fs", SIZES[i]); } catch (e) {}
    });
    var burger = document.getElementById("gri-burger");
    if (burger) burger.addEventListener("click", function () { document.getElementById("gri-mmenu").classList.toggle("open"); });
    var ix = document.getElementById("gri-info-x");
    if (ix) ix.addEventListener("click", function () {
      var b = document.getElementById("gri-infobar"); if (b) b.style.display = "none";
      try { sessionStorage.setItem("gri-info-x", "1"); } catch (e) {}
    });
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
})();
