/* Gri English . paylasimli nav (kendini enjekte eder)
   Her sayfaya:  <script src="assets/curriculum.js"></script><script src="assets/nav.js"></script>
   Index nav yapisi (dropdown ve alt menuler) + tema secici, Aa, gece modu, avatar.
   Menu window.GRI_NAV'dan gelir (curriculum.js). Tema localStorage'da. Build yok. */
(function () {
  "use strict";

  var CSS = [
    ":root{--gri-bg:#F1EAD9;--gri-surface:#FBF6EC;--gri-surface-2:#F4EDDC;--gri-ink:#241E17;--gri-ink-soft:#6E6353;--gri-ink-faint:#877B67;--gri-line:#E3D8C3;--gri-line-soft:#EDE4D2;--gri-gold:#B78A2E;--gri-accent:#2E6E6A;--gri-accent-soft:#DDEBE8;--gri-accent-deep:#123C39;--gri-info:#6E4A8E;--gri-info-ink:#F5EEFB;--gri-nav-bg:#F7F1E4;--gri-shadow:0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.06)}",
    "[data-theme='erik']{--bg:#F1E7EC;--bg-soft:#F7EEF2;--teal:#8A4A63;--teal-deep:#5C3042;--teal-soft:rgba(138,74,99,.13);--cat-accent:#8A4A63;--gri-bg:#F1E7EC;--gri-surface:#FAF3F6;--bg-card:#FAF3F6;--gri-surface-2:#F3E7EC;--gri-accent:#8A4A63;--gri-accent-soft:#F0DFE6;--gri-accent-deep:#5C3042}",
    "[data-theme='orman']{--bg:#E8EEE5;--bg-soft:#F0F4EE;--teal:#3E6B4A;--teal-deep:#20402B;--teal-soft:rgba(62,107,74,.13);--cat-accent:#3E6B4A;--gri-bg:#E8EEE5;--gri-surface:#F2F6F0;--bg-card:#F2F6F0;--gri-surface-2:#E6EDE4;--gri-accent:#3E6B4A;--gri-accent-soft:#DFEBE1;--gri-accent-deep:#20402B}",
    "[data-theme='tiffany']{--bg:#E1F3F0;--bg-soft:#EFFAF8;--teal:#0B8C86;--teal-deep:#08615D;--teal-soft:rgba(11,140,134,.14);--cat-accent:#0B8C86;--gri-bg:#E1F3F0;--gri-surface:#EFFAF8;--bg-card:#EFFAF8;--gri-surface-2:#DBEFEB;--gri-accent:#0B8C86;--gri-accent-soft:#CDEBE7;--gri-accent-deep:#08615D}",
    "[data-theme='mocha']{--bg:#F1E8E2;--bg-soft:#F8F1EC;--teal:#8A5A44;--teal-deep:#5E3B2C;--teal-soft:rgba(138,90,68,.14);--cat-accent:#8A5A44;--gri-bg:#F1E8E2;--gri-surface:#F8F1EC;--bg-card:#F8F1EC;--gri-surface-2:#EFE3DA;--gri-accent:#8A5A44;--gri-accent-soft:#EBDDD3;--gri-accent-deep:#5E3B2C}",
    "[data-theme='visne']{--bg:#F5E7E8;--bg-soft:#FBF2F2;--teal:#B02A37;--teal-deep:#7E1D27;--teal-soft:rgba(176,42,55,.13);--cat-accent:#B02A37;--gri-bg:#F5E7E8;--gri-surface:#FBF2F2;--bg-card:#FBF2F2;--gri-surface-2:#F3E4E5;--gri-accent:#B02A37;--gri-accent-soft:#F0DADC;--gri-accent-deep:#7E1D27}",
    "[data-theme='persimmon']{--bg:#F6EAE1;--bg-soft:#FBF3ED;--teal:#BC5A2E;--teal-deep:#8A3E1C;--teal-soft:rgba(188,90,46,.13);--cat-accent:#BC5A2E;--gri-bg:#F6EAE1;--gri-surface:#FBF3ED;--bg-card:#FBF3ED;--gri-surface-2:#F3E6DA;--gri-accent:#BC5A2E;--gri-accent-soft:#F3DFD0;--gri-accent-deep:#8A3E1C}",
    "[data-theme='wasabi']{--bg:#EDF0DC;--bg-soft:#F5F6E8;--teal:#6F7D1C;--teal-deep:#4A5312;--teal-soft:rgba(111,125,28,.14);--cat-accent:#6F7D1C;--gri-bg:#EDF0DC;--gri-surface:#F5F6E9;--bg-card:#F5F6E9;--gri-surface-2:#E7ECD5;--gri-accent:#6F7D1C;--gri-accent-soft:#E4E8C9;--gri-accent-deep:#4A5312}",
    "[data-theme='okyanus']{--bg:#E7EDF3;--bg-soft:#F0F4F9;--teal:#2E5E8A;--teal-deep:#1E3E5C;--teal-soft:rgba(46,94,138,.13);--cat-accent:#2E5E8A;--gri-bg:#E7EDF3;--gri-surface:#F2F6FA;--bg-card:#F2F6FA;--gri-surface-2:#E4EDF4;--gri-accent:#2E5E8A;--gri-accent-soft:#DBE6F0;--gri-accent-deep:#1E3E5C}","[data-theme='gul']{--bg:#F3E9EE;--bg-soft:#F9F1F5;--teal:#B0567A;--teal-deep:#7E3A56;--teal-soft:rgba(176,86,122,.13);--cat-accent:#B0567A;--gri-bg:#F3E9EE;--gri-surface:#FAF3F6;--bg-card:#FAF3F6;--gri-surface-2:#F3E7EE;--gri-accent:#B0567A;--gri-accent-soft:#F1DFE8;--gri-accent-deep:#7E3A56}","[data-theme='bordo']{--bg:#F1E8EA;--bg-soft:#F8F1F2;--teal:#8E3B4C;--teal-deep:#5E2632;--teal-soft:rgba(142,59,76,.13);--cat-accent:#8E3B4C;--gri-bg:#F1E8EA;--gri-surface:#FAF2F4;--bg-card:#FAF2F4;--gri-surface-2:#F2E6E9;--gri-accent:#8E3B4C;--gri-accent-soft:#EFDCE1;--gri-accent-deep:#5E2632}","[data-theme='lavanta']{--bg:#ECE9F3;--bg-soft:#F4F2F9;--teal:#6E5AA0;--teal-deep:#493A6E;--teal-soft:rgba(110,90,160,.13);--cat-accent:#6E5AA0;--gri-bg:#ECE9F3;--gri-surface:#F5F3FA;--bg-card:#F5F3FA;--gri-surface-2:#E9E5F2;--gri-accent:#6E5AA0;--gri-accent-soft:#E4DEF0;--gri-accent-deep:#493A6E}",
    "[data-theme='matcha']{--bg:#EAF0E3;--bg-soft:#F3F7EC;--teal:#5B8C4E;--teal-deep:#3A6030;--teal-soft:rgba(91,140,78,.13);--cat-accent:#5B8C4E;--gri-bg:#EAF0E3;--gri-surface:#F3F7EC;--bg-card:#F3F7EC;--gri-surface-2:#E6EEDB;--gri-accent:#5B8C4E;--gri-accent-soft:#DEE8DC;--gri-accent-deep:#3A6030}","[data-theme='barbie']{--bg:#FBE6F1;--bg-soft:#FEF1F8;--teal:#E24E9C;--teal-deep:#B23C7E;--teal-soft:rgba(224,33,138,.13);--cat-accent:#E24E9C;--gri-bg:#FBE6F1;--gri-surface:#FEF1F8;--bg-card:#FEF1F8;--gri-surface-2:#F8E2EE;--gri-accent:#E24E9C;--gri-accent-soft:#F8D7E9;--gri-accent-deep:#B23C7E}","[data-theme='kobalt']{--bg:#E6EAF5;--bg-soft:#F1F3FB;--teal:#2E52C8;--teal-deep:#1E357E;--teal-soft:rgba(46,82,200,.13);--cat-accent:#2E52C8;--gri-bg:#E6EAF5;--gri-surface:#F1F3FB;--bg-card:#F1F3FB;--gri-surface-2:#E2E8F6;--gri-accent:#2E52C8;--gri-accent-soft:#D5DCF4;--gri-accent-deep:#1E357E}","[data-theme='somon']{--bg:#FBEAE3;--bg-soft:#FEF3EE;--teal:#E0705A;--teal-deep:#B04A38;--teal-soft:rgba(224,112,90,.13);--cat-accent:#E0705A;--gri-bg:#FBEAE3;--gri-surface:#FEF3EE;--bg-card:#FEF3EE;--gri-surface-2:#F8E5DC;--gri-accent:#E0705A;--gri-accent-soft:#F9E2DE;--gri-accent-deep:#B04A38}","[data-theme='karamel']{--bg:#F6EDDD;--bg-soft:#FCF5E9;--teal:#C07A34;--teal-deep:#8A521C;--teal-soft:rgba(192,122,52,.13);--cat-accent:#C07A34;--gri-bg:#F6EDDD;--gri-surface:#FCF5E9;--bg-card:#FCF5E9;--gri-surface-2:#F4E9D4;--gri-accent:#C07A34;--gri-accent-soft:#F2E4D6;--gri-accent-deep:#8A521C}","[data-theme='nane']{--bg:#E3F2EC;--bg-soft:#F0F9F4;--teal:#1FA98C;--teal-deep:#0E6E5A;--teal-soft:rgba(31,169,140,.13);--cat-accent:#1FA98C;--gri-bg:#E3F2EC;--gri-surface:#F0F9F4;--bg-card:#F0F9F4;--gri-surface-2:#DFF0E9;--gri-accent:#1FA98C;--gri-accent-soft:#D2EEE8;--gri-accent-deep:#0E6E5A}","[data-theme='fusya']{--bg:#F8E6F2;--bg-soft:#FDF1FA;--teal:#C64BB0;--teal-deep:#932A82;--teal-soft:rgba(198,75,176,.13);--cat-accent:#C64BB0;--gri-bg:#F8E6F2;--gri-surface:#FDF1FA;--bg-card:#FDF1FA;--gri-surface-2:#F6E2F0;--gri-accent:#C64BB0;--gri-accent-soft:#F4DBEF;--gri-accent-deep:#932A82}","[data-theme='gokyuzu']{--bg:#E5F0F8;--bg-soft:#F0F7FC;--teal:#2E86C6;--teal-deep:#1E5E90;--teal-soft:rgba(46,134,198,.13);--cat-accent:#2E86C6;--gri-bg:#E5F0F8;--gri-surface:#F0F7FC;--bg-card:#F0F7FC;--gri-surface-2:#E1EEF7;--gri-accent:#2E86C6;--gri-accent-soft:#D5E7F4;--gri-accent-deep:#1E5E90}","[data-theme='zeytin']{--bg:#EEEFDE;--bg-soft:#F6F6EB;--teal:#77803A;--teal-deep:#4E541F;--teal-soft:rgba(119,128,58,.13);--cat-accent:#77803A;--gri-bg:#EEEFDE;--gri-surface:#F6F6EB;--bg-card:#F6F6EB;--gri-surface-2:#E9EAD7;--gri-accent:#77803A;--gri-accent-soft:#E4E6D8;--gri-accent-deep:#4E541F}","[data-theme='pudra']{--bg:#FAECEF;--bg-soft:#FEF4F6;--teal:#D06A82;--teal-deep:#A24458;--teal-soft:rgba(208,106,130,.13);--cat-accent:#D06A82;--gri-bg:#FAECEF;--gri-surface:#FEF4F6;--bg-card:#FEF4F6;--gri-surface-2:#F8E5EA;--gri-accent:#D06A82;--gri-accent-soft:#F6E1E6;--gri-accent-deep:#A24458}",
    "[data-theme='indigo']{--bg:#E9E7F5;--bg-soft:#F3F2FB;--teal:#4B3B8F;--teal-deep:#31266B;--teal-soft:rgba(75,59,143,.13);--cat-accent:#4B3B8F;--gri-bg:#E9E7F5;--gri-surface:#F3F2FB;--bg-card:#F3F2FB;--gri-surface-2:#E4E2F2;--gri-accent:#4B3B8F;--gri-accent-soft:#DBD8E9;--gri-accent-deep:#31266B}","[data-theme='menekse']{--bg:#EFE7F3;--bg-soft:#F7F1FA;--teal:#7B3FA0;--teal-deep:#552A70;--teal-soft:rgba(123,63,160,.13);--cat-accent:#7B3FA0;--gri-bg:#EFE7F3;--gri-surface:#F7F1FA;--bg-card:#F7F1FA;--gri-surface-2:#EAE0F0;--gri-accent:#7B3FA0;--gri-accent-soft:#E5D9EC;--gri-accent-deep:#552A70}","[data-theme='seftali']{--bg:#FBEEE1;--bg-soft:#FEF6EE;--teal:#D9824A;--teal-deep:#A85B2C;--teal-soft:rgba(217,130,74,.13);--cat-accent:#D9824A;--gri-bg:#FBEEE1;--gri-surface:#FEF6EE;--bg-card:#FEF6EE;--gri-surface-2:#F8E9D9;--gri-accent:#D9824A;--gri-accent-soft:#F7E6DB;--gri-accent-deep:#A85B2C}","[data-theme='lacivert']{--bg:#E6EAF0;--bg-soft:#F1F3F7;--teal:#26426B;--teal-deep:#172A47;--teal-soft:rgba(38,66,107,.13);--cat-accent:#26426B;--gri-bg:#E6EAF0;--gri-surface:#F1F3F7;--bg-card:#F1F3F7;--gri-surface-2:#E1E6EE;--gri-accent:#26426B;--gri-accent-soft:#D4D9E1;--gri-accent-deep:#172A47}","[data-theme='bakir']{--bg:#F5E9E1;--bg-soft:#FBF3ED;--teal:#B05C36;--teal-deep:#7E3E20;--teal-soft:rgba(176,92,54,.13);--cat-accent:#B05C36;--gri-bg:#F5E9E1;--gri-surface:#FBF3ED;--bg-card:#FBF3ED;--gri-surface-2:#F2E4D9;--gri-accent:#B05C36;--gri-accent-soft:#EFDED7;--gri-accent-deep:#7E3E20}","[data-theme='sis']{--bg:#ECEEF0;--bg-soft:#F5F6F7;--teal:#5C6673;--teal-deep:#3A424C;--teal-soft:rgba(92,102,115,.13);--cat-accent:#5C6673;--gri-bg:#ECEEF0;--gri-surface:#F5F6F7;--bg-card:#F5F6F7;--gri-surface-2:#E4E7EA;--gri-accent:#5C6673;--gri-accent-soft:#DEE0E3;--gri-accent-deep:#3A424C}","[data-theme='bugday']{--bg:#F6EFDC;--bg-soft:#FCF6E8;--teal:#C7A24A;--teal-deep:#8E6E24;--teal-soft:rgba(199,162,74,.13);--cat-accent:#C7A24A;--gri-bg:#F6EFDC;--gri-surface:#FCF6E8;--bg-card:#FCF6E8;--gri-surface-2:#F3EBD3;--gri-accent:#C7A24A;--gri-accent-soft:#F4ECDB;--gri-accent-deep:#8E6E24}",
    "[data-theme='dark']{--gri-bg:#151210;--gri-surface:#201C17;--gri-surface-2:#1B1813;--gri-ink:#F1E9D9;--gri-ink-soft:#B7AB96;--gri-ink-faint:#918674;--gri-line:#332C22;--gri-line-soft:#2A241C;--gri-gold:#D8B25A;--gri-accent:#6FB6AF;--gri-accent-soft:#22322F;--gri-accent-deep:#A9D6D1;--gri-info:#8B6BA9;--gri-nav-bg:#1C1813;--teal:#6FB6AF;--teal-deep:#A9D6D1;--teal-soft:rgba(111,182,175,.16);--cat-accent:#6FB6AF;--gri-shadow:0 2px 4px rgba(0,0,0,.3),0 12px 32px rgba(0,0,0,.4)}",
    ".gri-nav{position:sticky;top:0;z-index:60;background:var(--gri-surface);border-bottom:1px solid var(--gri-line);font-family:Inter,sans-serif}",
    ".gri-nav .in{max-width:1200px;margin:0 auto 0 max(0px,calc((100% - 1200px)*0.35));padding:0 26px;display:flex;align-items:center;gap:20px;height:66px}",
    ".gri-nav .brand{display:flex;align-items:baseline;font-family:'Playfair Display',serif;font-weight:600;font-size:1.45rem;letter-spacing:-.01em;white-space:nowrap;color:var(--gri-ink);text-decoration:none}",
    ".gri-nav .brand .it{font-style:italic;font-weight:400;color:var(--gri-accent);margin-left:.32em}",
    ".gri-nav .links,.gri-nav .links .gri-dd>button{font-family:'Crimson Pro',Georgia,serif}",".gri-nav .links{display:flex;align-items:stretch;gap:1.5rem;margin-left:10px}",
    ".gri-nav .links>a,.gri-nav .links .gri-dd>button{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:5px;line-height:1.2;color:var(--gri-ink-soft);background:none;border:none;border-bottom:1.5px solid transparent;cursor:pointer;padding:5px 0;white-space:nowrap;text-decoration:none;font-family:'Crimson Pro',Georgia,serif}",".gri-nav .nw1{font-family:'Crimson Pro',Georgia,serif;font-size:15px;font-weight:500;color:var(--gri-ink-soft);display:inline-flex;align-items:center;gap:4px}",".gri-nav .nw2{font-family:'Crimson Pro',Georgia,serif;font-size:15px;font-weight:500;color:var(--gri-ink-soft)}",
    ".gri-nav .links>a:hover,.gri-dd:hover>button,.gri-nav .links>a.here,.gri-dd.here>button{border-bottom-color:var(--gri-gold)}",".gri-nav .links>a.gri-cta{background:var(--gri-gold);color:#241E17;border:none;border-radius:999px;padding:5px 15px;font-family:Inter,sans-serif;font-weight:800;font-size:12.5px;letter-spacing:.01em;gap:6px;box-shadow:0 3px 12px rgba(183,138,46,.4);transition:transform .15s ease,box-shadow .15s ease;align-self:center}",".gri-nav .links>a.gri-cta:hover{border-bottom-color:transparent;transform:translateY(-1px) scale(1.03);box-shadow:0 6px 18px rgba(183,138,46,.55);color:#241E17}",".gri-nav .links>a.gri-cta svg{color:#B02A37}",".gri-nav .links>a:hover .nw1,.gri-dd:hover .nw1,.gri-nav .links>a.here .nw1,.gri-dd.here .nw1,.gri-nav .links>a:hover .nw2,.gri-dd:hover .nw2,.gri-nav .links>a.here .nw2,.gri-dd.here .nw2{color:var(--gri-accent)}",
    
    ".gri-dd{position:relative}",
    ".gri-dd .cv{width:8px;height:8px;opacity:.5;transition:.2s}.gri-dd.open .cv{transform:rotate(180deg)}",
    ".gri-dd-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:210px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:14px;box-shadow:var(--gri-shadow);padding:8px;display:none;z-index:70}",
    ".gri-dd.open .gri-dd-menu{display:block}",
    ".gri-dd-menu a{display:block;padding:8px 11px;border-radius:9px;color:var(--gri-ink-soft);text-decoration:none;font-size:13.5px;white-space:nowrap}",
    ".gri-dd-menu a:hover{background:var(--gri-surface-2);color:var(--gri-ink)}",
    ".gri-grp{padding:4px 0}.gri-grp+.gri-grp{border-top:1px solid var(--gri-line-soft);margin-top:4px}",
    ".gri-grp>.gh{font-weight:700;color:var(--gri-ink);font-size:12.5px}",
    ".gri-grp .gri-sub a{padding-left:22px;font-size:13.5px;color:var(--gri-ink-soft)}",
    ".gri-dd-mega .gri-dd-menu{column-count:3;column-gap:10px;min-width:610px;max-width:min(94vw,770px);max-height:calc(100vh - 88px);overflow-y:auto;padding:14px}",
    ".gri-dd-mega .gri-grp{padding:10px 10px 6px;background:var(--gri-surface-2);border:1px solid var(--gri-line-soft);border-radius:14px;break-inside:avoid;-webkit-column-break-inside:avoid;margin-bottom:10px}.gri-dd-mega .gri-grp+.gri-grp{border-top:none;margin-top:0}",
    ".gri-dd-mega .gri-dd-menu a{padding:6px 9px;font-size:13px;border-radius:8px;color:var(--gri-ink-soft);transition:background .12s ease,color .12s ease}",
    ".gri-dd-mega .gri-dd-menu a:hover{background:var(--gri-surface);color:var(--gri-accent)}",
    ".gri-dd-mega .gri-grp>.gh{display:block;padding:0 3px 7px;margin-bottom:6px;font-family:Inter,sans-serif;font-size:12px;font-weight:800;letter-spacing:.02em;color:var(--gri-accent);white-space:normal;line-height:1.3;border-bottom:1px solid var(--gri-line-soft)}.gri-dd-mega .gri-sub a{padding-left:11px}",
    ".gri-dd-cols2 .gri-dd-menu{left:auto;right:0;grid-template-columns:repeat(2,minmax(134px,1fr));gap:0 4px;max-width:min(92vw,420px)}",
    ".gri-dd-menu .gri-grp-flat{padding:6px;background:var(--gri-surface-2);border:1px solid var(--gri-line-soft);border-radius:12px}",
    ".gri-dd:not(.gri-dd-mega) .gri-dd-menu a{display:block;padding:8px 11px;border-radius:8px;font-size:13px;color:var(--gri-ink-soft);transition:background .12s ease,color .12s ease}",
    ".gri-dd:not(.gri-dd-mega) .gri-dd-menu a:hover{background:var(--gri-surface);color:var(--gri-accent)}",
    ".gri-dd-cols2 .gri-grp-flat{display:grid;grid-template-columns:repeat(2,minmax(130px,1fr));gap:2px 6px}",
    ".gri-dd.gri-dd-mega.open>.gri-dd-menu{display:block}",".gri-dd.gri-dd-cols2.open>.gri-dd-menu{display:block}",
    ".gri-nav .right{margin-left:auto;display:flex;align-items:center;gap:9px}",
    ".gri-ico{width:34px;height:34px;border-radius:50%;border:1px solid var(--gri-line);background:var(--gri-surface);color:var(--gri-ink-soft);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:12.5px}",
    ".gri-ico:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",
    ".gri-avatar{width:34px;height:34px;border-radius:50%;background:var(--gri-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:14px}",".gri-user-mount{display:flex;align-items:center}",".gri-giris{display:inline-flex;align-items:center;background:var(--gri-accent);color:#fff;border-radius:20px;padding:8px 16px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;text-decoration:none}.gri-giris:hover{background:var(--gri-accent-deep)}",".gri-rdd{position:relative}",".gri-rdd>button{display:flex;align-items:center;gap:6px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:20px;padding:7px 13px;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;color:var(--gri-ink-soft)}",".gri-rdd>button:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",".gri-user-dd>button{background:none;border:none;padding:0}",".gri-rdd>button .cv{width:9px;height:9px;opacity:.6;transition:.2s}.gri-rdd.open>button .cv{transform:rotate(180deg)}",".gri-rdd-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:186px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:14px;box-shadow:var(--gri-shadow);padding:8px;display:none;z-index:80}",".gri-rdd.open .gri-rdd-menu{display:block}",".gri-rdd-menu a{display:block;padding:9px 11px;border-radius:9px;color:var(--gri-ink);font-weight:500;text-decoration:none;font-family:Inter,sans-serif;font-size:13.5px}",".gri-rdd-menu a:hover{background:var(--gri-surface-2);color:var(--gri-ink)}",".gri-thgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;min-width:276px}",".gri-th-opt{display:flex;flex-direction:column;align-items:center;gap:6px;width:auto;padding:9px 3px;border:none;background:none;cursor:pointer;border-radius:10px;font-family:Inter,sans-serif;font-size:10px;line-height:1.15;color:var(--gri-ink-soft);text-align:center;word-break:normal;overflow-wrap:break-word;hyphens:none}",".gri-th-opt:hover{background:var(--gri-surface-2);color:var(--gri-ink)}.gri-th-opt.on{color:var(--gri-ink);font-weight:600}",".gri-th-opt .dot{width:24px;height:24px;border-radius:50%;flex:none;border:1px solid rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,.28);transition:box-shadow .15s,transform .12s}",".gri-th-opt:hover .dot{transform:scale(1.1)}",".gri-th-opt.on .dot{box-shadow:0 0 0 2px var(--gri-surface),0 0 0 3.5px var(--gri-ink)}",".gri-th-lbl{font-family:Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gri-ink-faint);padding:6px 11px 4px}",
    /* ── Premium CTA + günlük seri (streak) — nav.js enjekte ── */
    ".gri-prem{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border-radius:999px;font-family:Inter,sans-serif;font-weight:800;font-size:12.5px;letter-spacing:.01em;white-space:nowrap;text-decoration:none;border:none;cursor:pointer;color:#3A2A05;background:linear-gradient(135deg,#F6D673,#D8A93C 55%,#B78A2E);box-shadow:0 2px 9px rgba(183,138,46,.38),inset 0 1px 0 rgba(255,255,255,.45);transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}",
    ".gri-prem:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(183,138,46,.5),inset 0 1px 0 rgba(255,255,255,.5);filter:brightness(1.03);color:#3A2A05}",
    ".gri-prem svg{width:15px;height:15px;flex:none}",
    ".gri-prem.is-pro{color:var(--gri-gold);background:transparent;border:1.5px solid var(--gri-gold);box-shadow:none}",
    ".gri-prem.is-pro:hover{transform:none;filter:none;box-shadow:none;background:var(--gri-accent-soft);color:var(--gri-gold)}",
    ".gri-streak{display:none;align-items:center;gap:5px;height:34px;padding:0 11px;border-radius:999px;font-family:Inter,sans-serif;font-weight:800;font-size:12.5px;white-space:nowrap;color:#B5460B;background:linear-gradient(135deg,#FCE6C2,#F7CE92);border:1px solid rgba(181,70,11,.18)}",
    ".gri-streak.show{display:inline-flex}",
    ".gri-streak svg{width:14px;height:14px;flex:none;color:#E8701A}",
    "[data-theme='dark'] .gri-streak{background:linear-gradient(135deg,#3A2A12,#241B10);color:#EDB65E;border-color:#4A3820}",
    "[data-theme='dark'] .gri-streak svg{color:#EDA24A}",
    ".gri-mprem{display:flex;align-items:center;gap:12px;padding:15px 16px;margin:2px 0 16px;border-radius:16px;text-decoration:none;color:#3A2A05;background:linear-gradient(135deg,#F6D673,#C79A34);box-shadow:0 6px 20px rgba(183,138,46,.3)}",
    ".gri-mprem:active{filter:brightness(.98)}",
    ".gri-mprem .ic{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.38);display:flex;align-items:center;justify-content:center;flex:none}",
    ".gri-mprem .ic svg{width:23px;height:23px}",
    ".gri-mprem .tx{display:flex;flex-direction:column;gap:2px;min-width:0}",
    ".gri-mprem .t{font-family:Inter,sans-serif;font-weight:800;font-size:15.5px;line-height:1.15}",
    ".gri-mprem .s{font-family:Inter,sans-serif;font-weight:600;font-size:12px;line-height:1.25;opacity:.82}",
    ".gri-mprem .go{margin-left:auto;font-size:26px;line-height:1;flex:none;opacity:.6}",
    ".gri-mprem.is-pro{background:var(--gri-surface);border:1.5px solid var(--gri-gold);color:var(--gri-ink);box-shadow:none}",
    ".gri-mprem.is-pro .ic{background:var(--gri-accent-soft);color:var(--gri-gold)}",
    ".gri-mstreak{display:none;align-items:center;gap:6px;width:100%;justify-content:center;padding:11px 14px;margin:0 0 16px;border-radius:13px;font-family:Inter,sans-serif;font-weight:700;font-size:14px;color:#B5460B;background:linear-gradient(135deg,#FCE6C2,#F7CE92);border:1px solid rgba(181,70,11,.18)}",
    ".gri-mstreak.show{display:flex}",
    ".gri-mstreak svg{width:17px;height:17px;flex:none;color:#E8701A}",
    ".gri-mstreak b{font-weight:800}",
    "[data-theme='dark'] .gri-mstreak{background:linear-gradient(135deg,#3A2A12,#241B10);color:#EDB65E;border-color:#4A3820}",
    "[data-theme='dark'] .gri-mstreak svg{color:#EDA24A}",
    "@media(max-width:1200px){.gri-streak-bar{display:none!important}.gri-prem{width:40px;padding:0;gap:0;justify-content:center}.gri-prem .pl{display:none}}",
    ".gri-burger{display:none;width:42px;height:42px;border-radius:10px;border:1px solid var(--gri-line);background:var(--gri-surface);cursor:pointer;align-items:center;justify-content:center}",
    ".gri-burger svg{width:18px;height:18px;color:var(--gri-ink)}",
    ".gri-mmenu{display:none}",
    "@media(min-width:1201px) and (max-width:1360px){.gri-nav .in{padding:0 18px;gap:14px}.gri-nav .links{gap:1rem}.gri-nav .right{gap:7px}}",
    "@media(max-width:1200px){.gri-nav .links,.gri-rdd,.gri-ico{display:none}.gri-burger{display:flex}",
    ".gri-mmenu.open{display:block;position:fixed;inset:0;z-index:950;background:var(--gri-nav-bg);overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:max(24px,env(safe-area-inset-bottom))}",
    ".gri-mmenu .in{max-width:640px;margin:0 auto;padding:0 18px 40px;display:block;height:auto}",
    ".gri-mclose{display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--gri-nav-bg);padding:15px 0 12px;border-bottom:1px solid var(--gri-line);margin-bottom:14px;z-index:2}",
    ".gri-mclose .brand{font-family:'Playfair Display',serif;font-size:1.35rem;color:var(--gri-ink);text-decoration:none;white-space:nowrap}",
    ".gri-mclose .brand .it{font-style:italic;color:var(--gri-accent);margin-left:.3em}",
    ".gri-mclose-x{width:42px;height:42px;border-radius:12px;border:1px solid var(--gri-line);background:var(--gri-surface);color:var(--gri-ink);font-size:24px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}",
    ".gri-mclose-x:active{background:var(--gri-surface-2)}",
    ".gri-mquick{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:0 0 18px}",
    ".gri-mquick a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:64px;padding:9px 3px;border:1px solid var(--gri-line);background:var(--gri-surface);border-radius:14px;text-decoration:none;color:var(--gri-ink-soft);font-family:Inter,sans-serif;font-size:10px;font-weight:600;letter-spacing:.01em;text-align:center;line-height:1.1;transition:background .15s,color .15s,border-color .15s}",
    ".gri-mquick a svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8}",
    ".gri-mquick a:active{background:var(--gri-surface-2)}",
    ".gri-mquick a.here{color:var(--gri-accent);border-color:var(--gri-accent);background:var(--gri-accent-soft)}",
    ".gri-th-lbl{font-family:Inter,sans-serif;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gri-ink-faint);padding:4px 2px 8px;display:block}",
    ".gri-mmenu #navUserMountSlot{margin:2px 0 16px}",
    ".gri-mmenu #navUserMountSlot .btn-nav-cta,.gri-mmenu #navUserMountSlot .gri-giris{display:block;text-align:center;padding:13px;border-radius:12px;font-size:15px}",
    ".gri-mmenu #navUserMountSlot .nav-user{display:block;position:static}",
    ".gri-mmenu #navUserMountSlot .nav-user-btn{display:none}",
    ".gri-mmenu #navUserMountSlot .nav-user-menu{position:static!important;display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;max-height:none!important;box-shadow:none;border:none;min-width:0;padding:0;margin:0}",
    ".gri-mcards{display:block;margin-top:2px}",
    ".gri-mcard{display:flex;align-items:center;min-height:54px;padding:14px 16px;margin-bottom:8px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:13px;text-decoration:none;color:var(--gri-ink);font-family:'Crimson Pro',Georgia,serif;font-size:16.5px;font-weight:600;line-height:1.25;transition:border-color .15s,color .15s,background .15s}",
    ".gri-mcard:active,.gri-mcard:hover{color:var(--gri-accent);border-color:var(--gri-accent)}",
    ".gri-mcard.here{color:var(--gri-accent);border-color:var(--gri-accent);box-shadow:inset 3px 0 0 var(--gri-accent)}",
    ".gri-mcard.sub{padding-left:22px;font-size:15px;font-weight:500;color:var(--gri-ink-faint)}",
    ".gri-msec{margin-bottom:8px}",
    ".gri-mrow{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:54px;padding:14px 16px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:13px;font-family:'Crimson Pro',Georgia,serif;font-size:16.5px;font-weight:600;color:var(--gri-ink);cursor:pointer;transition:border-color .15s,color .15s,background .15s}",
    ".gri-mrow:active{background:var(--gri-surface-2)}",
    ".gri-mrow .cv{width:14px;height:14px;flex:none;opacity:.55;transition:transform .2s}",
    ".gri-msec.open>.gri-mrow{border-color:var(--gri-accent);color:var(--gri-accent);border-bottom-left-radius:0;border-bottom-right-radius:0;background:var(--gri-accent-soft)}",
    ".gri-msec.open>.gri-mrow .cv{transform:rotate(180deg);opacity:.9}",
    ".gri-msec.here>.gri-mrow{box-shadow:inset 3px 0 0 var(--gri-accent)}",
    ".gri-msub{display:none;padding:4px 8px 8px;border:1px solid var(--gri-accent);border-top:none;border-bottom-left-radius:13px;border-bottom-right-radius:13px;background:var(--gri-surface);margin-top:-1px}",
    ".gri-msec.open>.gri-msub{display:block}",
    ".gri-msub a{display:flex;align-items:center;min-height:48px;padding:11px 14px;font-family:'Crimson Pro',Georgia,serif;font-size:15px;font-weight:500;color:var(--gri-ink-soft);text-decoration:none;border-radius:9px;border-bottom:1px solid var(--gri-line-soft)}",
    ".gri-msub a:last-child{border-bottom:none}",
    ".gri-msub a:active{background:var(--gri-surface-2);color:var(--gri-accent)}",
    ".gri-msub a.here{color:var(--gri-accent);font-weight:600}",
    ".gri-mgrp-h{font-family:Inter,sans-serif;font-size:12px;font-weight:800;letter-spacing:.02em;color:var(--gri-accent);padding:16px 2px 6px}",
    ".gri-mxlate{border-top:1px solid var(--gri-line);margin-top:16px;padding-top:6px}",
    ".gri-mxrow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:6px 0 8px}",
    ".gri-mxrow a{display:flex;align-items:center;justify-content:center;padding:13px 6px;border:1px solid var(--gri-line);background:var(--gri-surface);border-radius:12px;text-decoration:none;color:var(--gri-ink-soft);font-family:Inter,sans-serif;font-size:13.5px;font-weight:600}",
    ".gri-mxrow a.on{border-color:var(--gri-accent);color:var(--gri-accent);background:var(--gri-accent-soft)}",
    ".gri-mtheme{border-top:1px solid var(--gri-line);margin-top:16px;padding-top:4px}",
    ".gri-mtheme-h{display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;cursor:pointer;padding:16px 2px;font-family:'Crimson Pro',Georgia,serif;font-size:16.5px;font-weight:600;color:var(--gri-ink)}",
    ".gri-mtheme-h .cv{width:13px;height:13px;opacity:.6;transition:transform .2s}.gri-mtheme.open .gri-mtheme-h .cv{transform:rotate(180deg)}",
    ".gri-mtheme-body{display:none;padding:6px 0 8px}.gri-mtheme.open .gri-mtheme-body{display:block}",
    ".gri-mtheme-body .gri-thgrid{min-width:0}",
    ".gri-mth{display:flex;gap:8px;margin-top:16px;align-items:center}.gri-mth button{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer}}"
  ].join("");

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="cat-face" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><circle cx="10" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="14" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><path d="M10.5 16 Q11.2 16.8 12 16.4 Q12.8 16.8 13.5 16"/></g></symbol>' +
    '<symbol id="cat-happy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><path d="M9 12.5 Q10 11.5 11 12.5"/><path d="M13 12.5 Q14 11.5 15 12.5"/><path d="M10 15.5 Q12 17.5 14 15.5"/></g></symbol>' +
    '<symbol id="cat-sleep" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L7.5 9 L9.5 7 Z"/><path d="M19 5 L16.5 9 L14.5 7 Z"/><ellipse cx="12" cy="13" rx="6" ry="5.5"/><path d="M9 12.5 Q10 11.8 11 12.5"/><path d="M13 12.5 Q14 11.8 15 12.5"/><path d="M11 16 L13 16"/><path d="M17 6 L19 4"/><path d="M18 8 L20 6"/></g></symbol>' +
    "</svg>";

  var CVDOWN = '<svg class="cv" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CROWN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8l3.6 2.8L12 4l5.4 6.8L21 8l-1.8 10.4H4.8L3 8zm2.4 12.4h13.2v1.4H5.4v-1.4z"/></svg>';
  var FLAME = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2.5s.9 3.2-.9 5.4c-1.7 2-3.6 2.6-3.6 5.7A5.5 5.5 0 0 0 18 15c.5-3-1.2-4.6-1.2-4.6.1 1.4-.7 2.2-1.5 2.2-1 0-1.5-.8-1.4-2.2.2-3.7-.9-7.9-.9-7.9zM9.8 14.6c0 1.2.9 2 1.9 2-1 .2-1.9 1-1.9 2.2A2.2 2.2 0 0 0 12 21a2.2 2.2 0 0 0 2.2-2.2c0-1.2-.9-2-2-2.2 1.1 0 2-.8 2-2 0-1.5-2.2-2.6-2.2-2.6s-2.2 1.1-2.2 2.6z" opacity=".55"/><path d="M13 2.5s.9 3.2-.9 5.4c-1.7 2-3.6 2.6-3.6 5.7A5.5 5.5 0 0 0 18 15c.5-3-1.2-4.6-1.2-4.6.1 1.4-.7 2.2-1.5 2.2-1 0-1.5-.8-1.4-2.2.2-3.7-.9-7.9-.9-7.9z"/></svg>';

  var THEMES = [
    { t: "krem", name: "Zümrüt", ic: "💎", dot: "#2E6E6A" },
    { t: "erik", name: "Orkide", ic: "🪻", dot: "#8A4A63" },
    { t: "orman", name: "Avokado", ic: "🥑", dot: "#3E6B4A" },
    { t: "okyanus", name: "Denim", ic: "👖", dot: "#2E5E8A" },
    { t: "gul", name: "Gül Kurusu", ic: "🥀", dot: "#B0567A" },
    { t: "bordo", name: "Şarap", ic: "🍷", dot: "#8E3B4C" },
    { t: "lavanta", name: "Lila", ic: "💜", dot: "#6E5AA0" },
    { t: "tiffany", name: "Tiffany", ic: "💍", dot: "#0ABAB5" },
    { t: "mocha", name: "Mocha", ic: "☕", dot: "#A47864" },
    { t: "visne", name: "Nar", ic: "🍎", dot: "#C8303E" },
    { t: "persimmon", name: "Persimmon", ic: "🍊", dot: "#D2662F" },
    { t: "wasabi", name: "Wasabi", ic: "🥬", dot: "#8DA01F" },
    { t: "matcha", name: "Matcha", ic: "🍵", dot: "#5B8C4E" },
    { t: "barbie", name: "Barbie", ic: "🎀", dot: "#E24E9C" },
    { t: "kobalt", name: "Kobalt", ic: "🔵", dot: "#2E52C8" },
    { t: "somon", name: "Somon", ic: "🍣", dot: "#E0705A" },
    { t: "karamel", name: "Karamel", ic: "🍮", dot: "#C07A34" },
    { t: "nane", name: "Nane", ic: "🌿", dot: "#1FA98C" },
    { t: "fusya", name: "Fuşya", ic: "🌺", dot: "#C64BB0" },
    { t: "gokyuzu", name: "Gökyüzü", ic: "🌤️", dot: "#2E86C6" },
    { t: "zeytin", name: "Zeytin", ic: "🫒", dot: "#77803A" },
    { t: "pudra", name: "Pudra", ic: "🌸", dot: "#D06A82" },
    { t: "indigo", name: "İndigo", ic: "🔷", dot: "#4B3B8F" },
    { t: "menekse", name: "Menekşe", ic: "🟣", dot: "#7B3FA0" },
    { t: "seftali", name: "Şeftali", ic: "🍑", dot: "#D9824A" },
    { t: "lacivert", name: "Lacivert", ic: "🫐", dot: "#26426B" },
    { t: "bakir", name: "Bakır", ic: "🟤", dot: "#B05C36" },
    { t: "sis", name: "Sis", ic: "🌫️", dot: "#5C6673" },
    { t: "bugday", name: "Buğday", ic: "🌾", dot: "#C7A24A" },
    { t: "dark", name: "Gece", ic: "🌙", dot: "#201C17" }
  ];
  function themeOptsHtml(){ return "<div class='gri-thgrid'>"+THEMES.map(function(x){ return "<button class='gri-th-opt' data-t='"+x.t+"' title='"+x.name+"' aria-label='"+x.name+"'><span class='dot' style='background:"+x.dot+"'>"+(x.ic||"")+"</span>"+x.name+"</button>"; }).join("")+"</div>"; }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function twoline(label, caret) { var i = label.indexOf(" "); var w1 = i === -1 ? label : label.slice(0, i); var w2 = i === -1 ? "" : label.slice(i + 1); var cv = caret ? CVDOWN : ""; return '<span class="nw1">' + esc(w1) + (w2 ? "" : cv) + '</span>' + (w2 ? '<span class="nw2">' + esc(w2) + cv + "</span>" : ""); }

  /* ===== Site-geneli TR/EN dil değiştirici (native; tek anahtar: gri-blog-lang) ===== */
  var LANG_KEY = "gri-blog-lang";
  function getLang() { try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "tr"; } catch (e) { return "tr"; } }
  function setLangStore(v) { try { localStorage.setItem(LANG_KEY, v === "en" ? "en" : "tr"); } catch (e) {} }
  var HEART = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M12 21s-6.7-4.35-9.33-8.02C1.1 10.6 1.53 7.6 3.7 6.2c1.9-1.22 4.2-.6 5.3.98L12 11l3-3.82c1.1-1.58 3.4-2.2 5.3-.98 2.17 1.4 2.6 4.4.03 6.78C18.7 16.65 12 21 12 21z"/></svg>';
  function di(tr) { return ' data-i18n="' + esc(tr) + '"'; }
  var I18N = {
    "Sınavlar":"Exams","Genel İngilizce":"General English","Çalışma Alanı":"Study Area",
    "Seviye Belirleme":"Placement Test","Seviye Belirleme Sınavı":"Placement Test","Seviye Belirleme Testi":"Placement Test",
    "Araçlar":"Tools","AI Araçları":"AI Tools","Sınıflarım":"My Classes","Oyunlar":"Games",
    "Soru Bankası":"Question Bank","Soru Bankasi":"Question Bank","Konu Anlatımı":"Topic Guides",
    "Kelime":"Vocabulary","Kelime Bankası":"Vocabulary Bank","Yazı Pratiği":"Writing Practice","Yazi Pratigi":"Writing Practice",
    "Denemeler":"Mock Tests","Deneme":"Mock Test","Tam Deneme":"Full Mock","Alıştırmalar":"Exercises","Alistir . Pratik":"Practice","Pratik":"Practice",
    "Driller":"Drills","Gramer Drill":"Grammar Drill","Bölüm Bazlı":"By Section","Metin turleri":"Text Types","Textsorten":"Text Types",
    "Öğrenme Haritası":"Learning Map","Üniversite Hazırlık Atlama":"Uni Prep Skip Test","Bize Ulaşın":"Contact","Destek Ol":"Support Us",
    "Almanca":"German","İngilizce":"English","TOK Rehberi":"TOK Guide","Paper 1 & Paper 2":"Paper 1 & Paper 2",
    "Math Denemeleri":"Math Mocks","R&W Denemeleri":"R&W Mocks","YÖKDİL Fen":"YÖKDİL Science","YÖKDİL Sağlık":"YÖKDİL Health","YÖKDİL Sosyal":"YÖKDİL Social",
    "Ogren":"Learn","Ogren Modulu":"Learn Module","Ogren . 2026 Format":"Learn · 2026 Format","Ogren . Beceriler":"Learn · Skills","Ogren . Math":"Learn · Math","Ogren . Paper 1":"Learn · Paper 1","Ogren . Reading & Writing":"Learn · Reading & Writing","Ogren . Ucretsiz Soru Modulu":"Learn · Free Module",
    "Premium":"Premium","Pro":"Pro","Giriş":"Sign in","Giriş Yap":"Sign in","Tema":"Theme","Hesap":"Account","Çalışma Masam":"My Desk","Menü":"Menu",
    "Ana Sayfa":"Home","Harita":"Map","Soru":"Questions","Sınıf":"Class","Masam":"Desk","günlük seri":"day streak",
    "Gri Pro":"Gri Pro","Gri Pro aktif":"Gri Pro active","Üyeliğini yönet":"Manage membership","Sınırsız soru · reklamsız · AI mentor":"Unlimited questions · ad-free · AI mentor",
    "Çalış":"Study","Platform":"Platform","IELTS Denemeleri":"IELTS Mock Tests","Hakkımızda":"About","Gizlilik Politikası":"Privacy Policy","KVKK Aydınlatma Metni":"KVKK Notice","Çerez Politikası":"Cookie Policy","Kullanım Koşulları":"Terms of Use","Editöryal İlkeler":"Editorial Principles","İçerik ve Kaynak Politikası":"Content & Sources","AI Mentor Nasıl Çalışır?":"How AI Mentor Works","İade / İptal / Üyelik":"Refunds / Cancellation / Membership",
    "Digital SAT":"Digital SAT","IELTS Academic":"IELTS Academic","TOEFL iBT":"TOEFL iBT","IB Diploma":"IB Diploma","YDS / YÖKDİL":"YDS / YÖKDİL",
    "Öğrendiğini pekiştir":"Reinforce what you learned","Öğrendiğini Pekiştir":"Reinforce What You Learned","Tüm konu anlatımları":"All topic guides","Tüm Konu Anlatımları":"All Topic Guides","İlgili Konular":"Related Topics","İlgili Rehberler":"Related Guides","Akademik Etkinlikler":"Academic Activities","Bu sayfada":"On this page","BU SAYFADA":"ON THIS PAGE","Genel İngilizce (B2+)":"General English (B2+)","Soru Bankası":"Question Bank","Denemeler":"Mock Tests","Soru Bankasına Git":"Go to Question Bank","Bu sayfa neye yarar?":"What is this page for?"
  };
  function tr2en(tr, lang) { return (lang === "en" && I18N.hasOwnProperty(tr)) ? I18N[tr] : tr; }
  var _premState = false, _premRefresh = null;
  function translateRegion(root, lang) {
    if (!root) return;
    var els = root.querySelectorAll("a, h4, h3, span, li, button, div, p, .footer-tagline");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.children.length) continue;            // yalnız yaprak metin
      var orig = el.getAttribute("data-i18n-tr");
      if (orig === null) { orig = (el.textContent || "").trim(); el.setAttribute("data-i18n-tr", orig); }
      if (!orig) continue;
      el.textContent = (lang === "en" && I18N[orig]) ? I18N[orig] : orig;
    }
  }
  function applyLang(lang) {
    lang = (lang === "en") ? "en" : "tr";
    setLangStore(lang);
    try { document.documentElement.setAttribute("lang", lang); } catch (e) {}
    // 1) küratörlü gövde içeriği (konu/blog)
    var g = document.querySelectorAll("[data-blog-lang]");
    for (var i = 0; i < g.length; i++) g[i].hidden = (g[i].getAttribute("data-blog-lang") !== lang);
    // 2) işaretli chrome (nav)
    var els = document.querySelectorAll("[data-i18n]");
    for (var j = 0; j < els.length; j++) {
      var el = els[j], t = el.getAttribute("data-i18n"), txt = tr2en(t, lang), k = el.getAttribute("data-ik");
      if (k === "tl" || k === "tlc") el.innerHTML = twoline(txt, k === "tlc");
      else if (k === "cta") el.innerHTML = HEART + esc(txt);
      else el.textContent = txt;
    }
    // 3) footer + konu sayfası chrome'u (yaprak metin sözlükle)
    translateRegion(document.querySelector(".site-footer"), lang);
    var chromeSel = document.querySelectorAll(".ob-next, .ka-back, .ka-eyebrow, .kt-back, .kt-eyebrow, .ka-toc-title, .ka-toc-h");
    for (var c = 0; c < chromeSel.length; c++) translateRegion(chromeSel[c], lang);
    // 3b) konu içi TOC: her bağlantının etiketini hedef bölümün GÖRÜNÜR başlığından türet
    var toc = document.querySelectorAll('.ka-toc a[href^="#"], .kt-toc a[href^="#"]');
    for (var q = 0; q < toc.length; q++) {
      var a = toc[q], id = a.getAttribute("href").slice(1), sec = id && document.getElementById(id);
      if (!sec) continue;
      var hh = sec.querySelector('[data-blog-lang="' + lang + '"] h2, [data-blog-lang="' + lang + '"] h3') || sec.querySelector("h2, h3");
      if (hh) { var tx = (hh.textContent || "").replace(/^\s*\d+[\.\)]\s*/, "").trim(); if (tx) a.textContent = tx; }
    }
    // 4) premium metnini dile göre tazele
    if (_premRefresh) try { _premRefresh(); } catch (e) {}
    // 5) blog-i18n'in hero toggle'ı varsa kaldır (tek switch nav'da)
    var dup = document.querySelectorAll(".blog-lang-toggle");
    for (var m = 0; m < dup.length; m++) if (dup[m].parentNode) dup[m].parentNode.removeChild(dup[m]);
    // 6) pill durumları
    var pills = document.querySelectorAll(".gri-lang [data-setlang]");
    for (var p = 0; p < pills.length; p++) pills[p].setAttribute("aria-pressed", pills[p].getAttribute("data-setlang") === lang ? "true" : "false");
    // 7) yerinde makine çevirisi ağı (küratörlü içeriğin kapsamadığı her Türkçe metin)
    try { runMT(lang); } catch (e) {}
  }

  /* Dil pili tıklaması: TAMAMEN yerinde (in-page) çeviri — Google/proxy YOK.
     Küratörlü içerik data-blog-lang ile; kalan her şey (JS-üretilen dahil) GriMT (OpenAI) ile. */
  function onLangClick(lang) { applyLang(lang); }
  // GriMT (makine çevirisi ağı) — ilk EN'de tembel yükle, sonra uygula
  var _mtLoading = false;
  function runMT(lang) {
    if (window.GriMT) { try { window.GriMT.apply(lang); } catch (e) {} return; }
    if (lang !== "en") return;
    if (_mtLoading) return; _mtLoading = true;
    var s = document.createElement("script");
    s.src = "assets/gri-mt.js?v=1";
    s.onload = function () { try { window.GriMT.apply(getLang()); } catch (e) {} };
    document.head.appendChild(s);
  }

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
  var LANG_CSS =
    '.gri-lang{display:inline-flex;gap:2px;border:1px solid var(--gri-line,rgba(0,0,0,.16));border-radius:999px;padding:2px;background:var(--bg-card,#fff)}' +
    '.gri-lang button{font:700 .72rem/1 var(--font-ui,Inter),system-ui,sans-serif;letter-spacing:.03em;border:0;background:transparent;color:var(--text-muted,#7a7168);padding:.34rem .6rem;border-radius:999px;cursor:pointer;transition:background .15s,color .15s}' +
    '.gri-lang button[aria-pressed="true"]{background:var(--teal,#2C5856);color:#fff}' +
    '.gri-mxlate .gri-lang{width:100%;justify-content:stretch}.gri-mxlate .gri-lang button{flex:1;padding:.55rem}';
  var stl = document.createElement("style"); stl.setAttribute("data-gri-lang", ""); stl.textContent = LANG_CSS;
  (document.head || document.documentElement).appendChild(stl);

  function hrefsOf(item, acc) { if (item.href) acc.push(item.href.toLowerCase().split("/").pop()); if (item.children) item.children.forEach(function (c) { hrefsOf(c, acc); }); return acc; }

  // Çeviri: Google translate.goog proxy'si (fonksiyon/i18n değil, salt bağlantı).
  // Yalnız canlı gringlizce.com'da (veya zaten çevrilmiş translate.goog sayfasında) görünür.
  function xlateData() {
    var h = location.hostname;
    var isGoog = /\.translate\.goog$/i.test(h);
    var ok = isGoog || /(^|\.)gringlizce\.com$/i.test(h);
    if (!ok) return null;
    var host, path;
    if (isGoog) {
      var sub = h.replace(/\.translate\.goog$/i, "");
      host = sub.replace(/--/g, " ").replace(/-/g, ".").replace(/ /g, "-");
      try {
        var u = new URL(location.href);
        ["_x_tr_sl", "_x_tr_tl", "_x_tr_hl", "_x_tr_pto", "_x_tr_hist"].forEach(function (k) { u.searchParams.delete(k); });
        path = u.pathname + (u.search || "");
      } catch (e) { path = location.pathname; }
    } else { host = h; path = location.pathname + location.search; }
    function goog(tl) {
      var th = host.replace(/-/g, "--").replace(/\./g, "-") + ".translate.goog";
      var sep = path.indexOf("?") === -1 ? "?" : "&";
      return "https://" + th + path + sep + "_x_tr_sl=tr&_x_tr_tl=" + tl + "&_x_tr_hl=" + tl + "&_x_tr_pto=wapp";
    }
    return { tr: "https://" + host + path, en: goog("en"), de: goog("de"), on: isGoog };
  }

  function build() {
    if (document.querySelector(".gri-nav")) return;
    var _segs = location.pathname.split("/").filter(Boolean);
    var _inDir = location.pathname.slice(-1) === "/" ? _segs.length : _segs.length - 1;
    var BASE = _inDir > 0 ? new Array(_inDir + 1).join("../") : "";
    function href(h){ return esc((/^(https?:|\/|#)/.test(h) ? "" : BASE) + h); }
    var MENU = window.GRI_NAV || [];
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase().replace(/\.html$/, "");

    var links = MENU.map(function (it) {
      var active = hrefsOf(it, []).map(function (h) { return String(h).replace(/\.html$/, ""); }).indexOf(here) !== -1;
      if (!it.children) {
        if (it.cta) { return '<a href="' + href(it.href) + '" class="gri-cta' + (active ? ' here' : '') + '"' + di(it.label) + ' data-ik="cta">' + HEART + esc(it.label) + "</a>"; }
        return '<a href="' + href(it.href) + '"' + (active ? ' class="here"' : "") + di(it.label) + ' data-ik="tl">' + twoline(it.label, false) + "</a>";
      }
      var isMega = it.children.some(function (ch) { return ch.children && ch.children.length; });
      var cols2 = !isMega && it.children.length >= 7;
      var ddCls = "gri-dd" + (active ? " here" : "") + (isMega ? " gri-dd-mega" : (cols2 ? " gri-dd-cols2" : ""));
      var groups = it.children.map(function (ch) {
        if (ch.children) {
          var subs = ch.children.map(function (g) { return '<a href="' + href(g.href) + '"' + di(g.label) + '>' + esc(g.label) + "</a>"; }).join("");
          return '<div class="gri-grp"><a class="gh" href="' + href(ch.href) + '"' + di(ch.label) + '>' + esc(ch.label) + '</a><div class="gri-sub">' + subs + "</div></div>";
        }
        return '<a href="' + href(ch.href) + '"' + di(ch.label) + '>' + esc(ch.label) + "</a>";
      }).join("");
      if (!isMega) groups = '<div class="gri-grp gri-grp-flat">' + groups + "</div>";
      return '<div class="' + ddCls + '"><button type="button" data-dd aria-haspopup="true" aria-expanded="false"' + di(it.label) + ' data-ik="tlc">' + twoline(it.label, true) + '</button><div class="gri-dd-menu" role="menu">' + groups + "</div></div>";
    }).join("");

    // Mobil: tum linkler duz (gruplu) liste olarak kalir — masaustu dropdown'lari
    // mobilde ise tek tek erisilebilir olsun diye agac gezilir.
    function mcard(label, h, sub){ return '<a class="gri-mcard' + (sub ? " sub" : "") + '" href="' + href(h) + '">' + esc(label) + "</a>"; }
    var MCARET = '<svg class="cv" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    // Mobil: gruplar KAPALI baslar, basliga dokununca acilir (akordeon). Duz top-level linkler dogrudan.
    // Bulunulan sayfa isaretlenir (here) ve o bolum otomatik acilir.
    function isHere(h){ return h && String(h).toLowerCase().split("/").pop().replace(/\.html$/, "") === here; }
    var mcards = MENU.map(function (it) {
      var act = hrefsOf(it, []).map(function (h) { return String(h).replace(/\.html$/, ""); }).indexOf(here) !== -1;
      if (!it.children) return '<a class="gri-mcard' + (act ? " here" : "") + '" href="' + href(it.href) + '"' + di(it.label) + '>' + esc(it.label) + "</a>";
      var inner = it.children.map(function (ch) {
        if (!ch.href) return "";
        return '<a' + (isHere(ch.href) ? ' class="here"' : "") + ' href="' + href(ch.href) + '"' + di(ch.label) + '>' + esc(ch.label) + "</a>";
      }).join("");
      return '<div class="gri-msec' + (act ? " open here" : "") + '"><div class="gri-mrow" data-msec><span' + di(it.label) + '>' + esc(it.label) + '</span>' + MCARET + '</div><div class="gri-msub">' + inner + "</div></div>";
    }).join("");

    // Mobil hizli-erisim izgarasi (kaldirilan alt tabbar'in tek-dokunus hedefleri drawer'da)
    var MQ = [
      { h: "/", f: "index", l: "Ana Sayfa", ic: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>' },
      { h: "/ogrenme-haritasi.html", f: "ogrenme-haritasi", l: "Harita", ic: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/>' },
      { h: "/soru-bankasi.html", f: "soru-bankasi", l: "Soru", ic: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' },
      { h: "/sinifim.html", f: "sinifim", l: "Sınıf", ic: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9"/>' },
      { h: "/panelim.html", f: "panelim", l: "Masam", ic: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' }
    ];
    var mquick = '<div class="gri-mquick">' + MQ.map(function (q) {
      var on = here === q.f || (q.f === "index" && (here === "" || here === "index"));
      return '<a href="' + q.h + '"' + (on ? ' class="here"' : "") + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + q.ic + '</svg><span' + di(q.l) + '>' + q.l + '</span></a>';
    }).join("") + "</div>";

    var tOpts = themeOptsHtml();

    // Premium CTA (masaüstü bar + mobil drawer) + günlük seri pill — durum JS ile güncellenir
    var premHref = href("premium");
    var premBtn = '<a href="' + premHref + '" class="gri-prem" id="gri-prem" title="Gri Pro\'ya yükselt" aria-label="Gri Pro\'ya yükselt">' + CROWN + '<span class="pl">Premium</span></a>';
    var streakBar = '<span class="gri-streak gri-streak-bar" id="gri-streak" data-streak-wrap title="Günlük çalışma serin" aria-live="polite">' + FLAME + '<span class="gri-streak-n">0</span></span>';
    var mprem = '<a href="' + premHref + '" class="gri-mprem" id="gri-mprem">'
      + '<span class="ic">' + CROWN + '</span>'
      + '<span class="tx"><span class="t">Gri Pro</span><span class="s">Sınırsız soru · reklamsız · AI mentor</span></span>'
      + '<span class="go" aria-hidden="true">&rsaquo;</span></a>';
    var mstreak = '<span class="gri-mstreak" id="gri-mstreak" data-streak-wrap title="Günlük çalışma serin">' + FLAME + '<b class="gri-streak-n">0</b> <span' + di("günlük seri") + '>günlük seri</span></span>';

    var _lng = getLang();
    function _pill(v, txt) { return '<button type="button" data-setlang="' + v + '" aria-pressed="' + (_lng === v ? "true" : "false") + '"' + (v === "en" ? ' lang="en"' : "") + '>' + txt + '</button>'; }
    var xlDD = '<div class="gri-lang" role="group" aria-label="Dil / Language">' + _pill("tr", "TR") + _pill("en", "EN") + '</div>';
    var xlM = '<div class="gri-mxlate"><div class="gri-th-lbl">Dil / Language</div><div class="gri-lang">' + _pill("tr", "Türkçe") + _pill("en", "English") + '</div></div>';

    var frag = document.createElement("div");
    frag.insertAdjacentHTML("beforeend", SPRITE);


    frag.insertAdjacentHTML("beforeend",
      '<header class="gri-nav"><div class="in">' +
      '<a href="/" class="brand">Gri<span class="it">English</span></a>' +
      '<nav class="links">' + links + "</nav>" +
      '<div class="right">' +
      streakBar + premBtn +
      '<div class="gri-rdd gri-theme-dd"><button type="button" data-dd><span' + di("Tema") + '>Tema</span>' + CVDOWN + '</button><div class="gri-rdd-menu">' + tOpts + '</div></div>' +
      "<button class='gri-ico aa' id='gri-fs' title='Yazi boyutu'>Aa</button>" +
      "<button class='gri-ico' id='gri-dark' title='Gece modu'><svg viewBox='0 0 20 20' width='16' height='16' fill='currentColor'><path d='M13 2a8 8 0 105 14A7 7 0 0113 2z'/></svg></button>" +
      '<div id="navUserMount" class="gri-user-mount"></div>' +
      xlDD +
      "<button class='gri-burger' id='gri-burger' aria-label='Menü' aria-expanded='false' aria-controls='gri-mmenu'><svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M4 7h16M4 12h16M4 17h16' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg></button>" +
      "</div></div>" +
      '<div class="gri-mmenu" id="gri-mmenu"><div class="in">' +
      '<div class="gri-mclose"><a href="/" class="brand">Gri<span class="it">English</span></a><button type="button" class="gri-mclose-x" id="gri-mclose-x" aria-label="Kapat">&times;</button></div>' +
      mprem + mstreak +
      mquick +
      '<div class="gri-th-lbl"' + di("Hesap") + '>Hesap</div><div id="navUserMountSlot"></div><div class="gri-mcards">' + mcards +
      '<a class="gri-mcard' + (here === "panelim" ? " here" : "") + '" href="' + BASE + 'panelim.html"' + di("Çalışma Masam") + '>Çalışma Masam</a></div>' +
      xlM +
      '<div class="gri-mtheme"><button type="button" class="gri-mtheme-h" id="gri-mtheme-h"><span' + di("Tema") + '>Tema</span>' + CVDOWN + '</button><div class="gri-mtheme-body">' + tOpts + "</div></div></div></div></header>");

    var _lb = document.querySelector(".launch-banner");
    var _ref = (_lb && _lb.parentNode === document.body) ? _lb.nextSibling : document.body.firstChild;
    if (_ref && _ref.parentNode !== document.body) _ref = null; // gecersiz referansta basa/sona guvenli ekle
    while (frag.firstChild) document.body.insertBefore(frag.firstChild, _ref);
    applyTheme(readTheme());
    var _mnt = document.getElementById("navUserMount");
    if (_mnt && !_mnt.innerHTML.trim()) _mnt.innerHTML = '<a href="' + BASE + 'giris.html" class="gri-giris"' + di("Giriş") + '>Giriş</a>';

    function closeAllDD() { document.querySelectorAll(".gri-dd.open,.gri-rdd.open").forEach(function (x) { x.classList.remove("open"); }); syncAria(); }
    function syncAria() { document.querySelectorAll(".gri-dd>[data-dd],.gri-rdd>[data-dd]").forEach(function (b) { b.setAttribute("aria-expanded", b.parentNode.classList.contains("open") ? "true" : "false"); }); }
    document.addEventListener("click", function (e) {
      var t = e.target;
      var sl = t.closest && t.closest("[data-setlang]");
      if (sl) { onLangClick(sl.getAttribute("data-setlang")); return; }
      var themeBtn = t.closest && t.closest(".gri-th-opt[data-t]");
      if (themeBtn) { applyTheme(themeBtn.getAttribute("data-t")); closeAllDD(); return; }
      var dd = t.closest && t.closest("[data-dd]");
      if (dd) { var box = dd.closest(".gri-dd,.gri-rdd"); var wasOpen = box.classList.contains("open");
        closeAllDD();
        if (!wasOpen) box.classList.add("open"); syncAria(); e.stopPropagation(); return; }
      var ms = t.closest && t.closest("[data-msec]");
      if (ms && !t.closest("a")) { ms.parentNode.classList.toggle("open"); return; }
      if (!(t.closest && (t.closest(".gri-dd-menu") || t.closest(".gri-rdd-menu")))) { closeAllDD(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        var anyOpen = document.querySelector(".gri-dd.open,.gri-rdd.open");
        if (anyOpen) { var focusBtn = anyOpen.querySelector("[data-dd]"); closeAllDD(); if (focusBtn) try { focusBtn.focus(); } catch (er) {} }
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
    var mmenuEl = document.getElementById("gri-mmenu");
    function setMenu(open) {
      if (!mmenuEl) return;
      mmenuEl.classList.toggle("open", open);
      try { document.documentElement.style.overflow = open ? "hidden" : ""; } catch (e) {}
      if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
      try {
        if (open) { var fx = document.getElementById("gri-mclose-x"); if (fx && fx.focus) fx.focus(); }
        else if (burger && burger.focus) { burger.focus(); }
      } catch (e) {}
    }
    if (burger) burger.addEventListener("click", function () { setMenu(!mmenuEl.classList.contains("open")); });
    var mclose = document.getElementById("gri-mclose-x");
    if (mclose) mclose.addEventListener("click", function () { setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mmenuEl && mmenuEl.classList.contains("open")) setMenu(false); });
    var mth = document.getElementById("gri-mtheme-h");
    if (mth) mth.addEventListener("click", function () { mth.parentNode.classList.toggle("open"); });

    // Hesap widget'ını (navUserMount) mobilde menüye, masaüstünde bar'a yerleştir
    (function () {
      var mnt = document.getElementById("navUserMount");
      var slot = document.getElementById("navUserMountSlot");
      var right = document.querySelector(".gri-nav .right");
      var brg = document.getElementById("gri-burger");
      if (!mnt || !slot || !right) return;
      var mq = window.matchMedia("(max-width:1200px)");
      function place() {
        if (mq.matches) { if (mnt.parentNode !== slot) slot.appendChild(mnt); }
        else { if (mnt.parentNode !== right) right.insertBefore(mnt, brg); }
      }
      place();
      try { mq.addEventListener("change", place); } catch (e) { try { mq.addListener(place); } catch (e2) {} }
    })();

    // ── Premium durumu: GRI_PREMIUM'a göre CTA'yı "Yükselt" ↔ "Pro" arasında değiştir ──
    function setPrem(active) {
      _premState = !!active;
      var lang = getLang();
      var b = document.getElementById("gri-prem");
      if (b) {
        b.classList.toggle("is-pro", !!active);
        var pl = b.querySelector(".pl"); if (pl) pl.textContent = active ? tr2en("Pro", lang) : tr2en("Premium", lang);
        b.title = active ? "Gri Pro üyeliğin aktif" : "Gri Pro'ya yükselt";
        b.setAttribute("aria-label", b.title);
      }
      var m = document.getElementById("gri-mprem");
      if (m) {
        m.classList.toggle("is-pro", !!active);
        var t = m.querySelector(".t"), s = m.querySelector(".s");
        if (t) t.textContent = active ? tr2en("Gri Pro aktif", lang) : tr2en("Gri Pro", lang);
        if (s) s.textContent = active ? tr2en("Üyeliğini yönet", lang) : tr2en("Sınırsız soru · reklamsız · AI mentor", lang);
      }
    }
    _premRefresh = function () { setPrem(_premState); };
    // Durum: önce canlı GRI_PREMIUM (gri-premium.js yüklü ~37 sayfa), yoksa senkron localStorage cache
    // ('gri-prem-active'='1' → anında Pro). Cache yok/‘0’ ise güvenli varsayılan: "Premium" (yükselt). FAIL-OPEN.
    try {
      var _premActive = false;
      if (window.GRI_PREMIUM) _premActive = !!window.GRI_PREMIUM.active;
      else { var _pc = null; try { _pc = localStorage.getItem("gri-prem-active"); } catch (e) {} if (_pc === "1") _premActive = true; }
      setPrem(_premActive);
    } catch (e) {}
    // Canlı olay geldiğinde (gri-premium.js refresh sonrası) durumu güncelle
    window.addEventListener("gri-premium", function (ev) { try { setPrem(!!(ev.detail && ev.detail.active)); } catch (e) {} });

    // ── Kayıtlı dili uygula (nav etiketleri + gövde [data-blog-lang] + footer) ──
    try { applyLang(getLang()); } catch (e) {}
    // footer sonradan/dinamik gelirse tekrar dene
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { try { applyLang(getLang()); } catch (e) {} });
    window.griSetLang = applyLang;

    // ── Günlük seri (streak) pill'i: gerçek veri varsa göster, yoksa sessizce atla (uydurma yok) ──
    (function () {
      var tries = 24; // ~3.6s: gri-premium.js paylaşılan client'ini bekle
      function apply(n) {
        if (!(n > 0)) return;
        var nums = document.querySelectorAll(".gri-streak-n");
        for (var i = 0; i < nums.length; i++) nums[i].textContent = n;
        var wraps = document.querySelectorAll("[data-streak-wrap]");
        for (var j = 0; j < wraps.length; j++) wraps[j].classList.add("show");
      }
      // 1) Senkron cache — 'gri-streak' > 0 ise TÜM sayfalarda anında göster (FAIL-OPEN: yoksa gizli).
      try { var _cs = parseInt(localStorage.getItem("gri-streak") || "", 10); if (_cs > 0) apply(_cs); } catch (e) {}
      // 2) Canlı fetch — paylaşılan client varsa gerçek değerle güncelle + cache'le (uydurma yok).
      (function loop() {
        var c = window.__griPremiumClient; // salt paylaşılan client; nav.js kendi client'ini kurmaz
        if (c && c.rpc) {
          try {
            c.rpc("get_user_stats").then(function (res) {
              if (res && !res.error && res.data) {
                var n = Number(res.data.current_streak || 0);
                apply(n);
                try { localStorage.setItem("gri-streak", String(n)); } catch (e) {}
              }
            }).catch(function () {});
          } catch (e) {}
          return;
        }
        if (--tries <= 0) return;
        setTimeout(loop, 150);
      })();
    })();
  }

  // ===== Erişilebilirlik: skip-link + main landmark + modal dialog semantiği =====
  function a11y() {
    try {
      // 1) Skip-link (odaklanınca görünür) + ana içerik landmark'ı
      if (!document.querySelector(".gri-skip")) {
        var s = document.createElement("style");
        s.textContent = ".gri-skip{position:fixed;left:8px;top:-60px;z-index:100000;background:var(--gri-accent,#2E6E6A);color:#fff;padding:10px 16px;border-radius:8px;font:600 14px/1 Inter,system-ui,sans-serif;text-decoration:none;transition:top .15s}.gri-skip:focus{top:8px;outline:2px solid #fff;outline-offset:2px}";
        (document.head || document.documentElement).appendChild(s);
        var sk = document.createElement("a");
        sk.className = "gri-skip"; sk.href = "#gri-main"; sk.textContent = "Ana içeriğe geç";
        document.body.insertBefore(sk, document.body.firstChild);
      }
      var mn = document.querySelector('main, [role="main"], #gri-main');
      if (!mn) {
        var cands = document.querySelectorAll("body > main, body > section, .wrap, .content, #content, .page-wrap");
        for (var i = 0; i < cands.length; i++) {
          var c = cands[i];
          if (!(c.closest && c.closest(".gri-nav"))) { mn = c; break; }
        }
      }
      if (mn) {
        if (!mn.id) mn.id = "gri-main";
        if (!mn.hasAttribute("tabindex")) mn.setAttribute("tabindex", "-1");
        if (mn.tagName !== "MAIN" && !mn.getAttribute("role")) mn.setAttribute("role", "main");
      }
      // 2) Modal dialog semantiği — görünür olunca role/aria + odağı kapsayıcıya taşı
      var SEL = '.modal-overlay,.app-mode-modal-overlay,.gsch-modal-ov,.sb-overlay,.iom-overlay,.gri-modal,.modal-writing,[data-modal-overlay]';
      var _n = 0;
      function visible(el) { var st = window.getComputedStyle(el); return st.display !== "none" && st.visibility !== "hidden" && parseFloat(st.opacity || "1") > 0.01; }
      function enhance(el) {
        try {
          if (!el.matches || !el.matches(SEL)) return;
          if (!visible(el)) { el.__a11yOpen = 0; return; }
          if (el.__a11yOpen) return; el.__a11yOpen = 1;
          if (!el.getAttribute("role")) el.setAttribute("role", "dialog");
          if (!el.getAttribute("aria-modal")) el.setAttribute("aria-modal", "true");
          if (!el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) {
            var hd = el.querySelector("h1,h2,h3,h4,.modal-title");
            if (hd) { if (!hd.id) hd.id = "a11y-mt-" + (++_n); el.setAttribute("aria-labelledby", hd.id); }
            else el.setAttribute("aria-label", "İletişim kutusu");
          }
          // odak modal içinde değilse kapsayıcıya taşı (kontrolleri tetiklemeden)
          if (!el.contains(document.activeElement)) {
            if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
            try { el.focus({ preventScroll: false }); } catch (e) {}
          }
        } catch (e) {}
      }
      try {
        var mo = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var m = muts[i], t = m.target;
            if (t && t.nodeType === 1 && t.matches && t.matches(SEL)) enhance(t);
            if (m.addedNodes) for (var j = 0; j < m.addedNodes.length; j++) {
              var n = m.addedNodes[j];
              if (n.nodeType !== 1) continue;
              if (n.matches && n.matches(SEL)) enhance(n);
              if (n.querySelectorAll) { var q = n.querySelectorAll(SEL); for (var k = 0; k < q.length; k++) enhance(q[k]); }
            }
          }
        });
        mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"], childList: true });
      } catch (e) {}
    } catch (e) {}
  }

  function boot() { build(); a11y(); }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();

/* ============================================================
   Çerez bilgilendirme bandı (KVKK/şeffaflık) — bağımsız IIFE
   Hafif, engellemeyen alt bant; localStorage'da hatırlanır.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "gri-cookie-consent";
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* private mode: yine göster */ }

  function inject() {
    if (document.getElementById("gri-cc-bar")) return;

    var css = document.createElement("style");
    css.id = "gri-cc-css";
    css.textContent =
      '#gri-cc-bar{position:fixed;left:50%;transform:translateX(-50%) translateY(140%);bottom:16px;z-index:9600;' +
      'width:min(680px,calc(100vw - 24px));box-sizing:border-box;display:flex;align-items:center;gap:14px;flex-wrap:wrap;' +
      'padding:14px 18px;border-radius:16px;background:var(--bg-card,#fffdf8);color:var(--text,#2a2621);' +
      'border:1px solid var(--gri-line,var(--line,rgba(0,0,0,.12)));box-shadow:0 10px 34px rgba(0,0,0,.18);' +
      'font-family:var(--font-ui,Inter,system-ui,sans-serif);font-size:.86rem;line-height:1.5;' +
      'opacity:0;transition:transform .42s cubic-bezier(.2,.8,.25,1),opacity .42s}' +
      '#gri-cc-bar.gri-cc-in{transform:translateX(-50%) translateY(0);opacity:1}' +
      '#gri-cc-bar .gri-cc-txt{flex:1;min-width:200px}' +
      '#gri-cc-bar a{color:var(--teal,#2E6E6A);font-weight:600;text-decoration:underline;text-underline-offset:2px}' +
      '#gri-cc-bar .gri-cc-actions{display:flex;gap:8px;flex-shrink:0}' +
      '#gri-cc-bar button{font:inherit;font-weight:700;cursor:pointer;border-radius:10px;padding:.5rem 1.05rem;border:1px solid transparent;white-space:nowrap}' +
      '#gri-cc-accept{background:#2E6E6A;color:#fff}' +
      '#gri-cc-accept:hover{background:#255b57}' +
      '#gri-cc-nec{background:transparent;color:var(--text-soft,var(--text-muted,#6b6459));border-color:var(--gri-line,var(--line,rgba(0,0,0,.18)))}' +
      '#gri-cc-nec:hover{border-color:#2E6E6A;color:#2E6E6A}' +
      '@media(max-width:520px){#gri-cc-bar{gap:10px}#gri-cc-bar .gri-cc-actions{width:100%}#gri-cc-bar button{flex:1}}' +
      '@media(prefers-reduced-motion:reduce){#gri-cc-bar{transition:opacity .3s}}';
    document.head.appendChild(css);

    var bar = document.createElement("div");
    bar.id = "gri-cc-bar";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Çerez bilgilendirmesi");
    bar.setAttribute("aria-live", "polite");
    var _ccEn = false; try { _ccEn = localStorage.getItem("gri-blog-lang") === "en"; } catch (e) {}
    bar.innerHTML = _ccEn ?
      ('<div class="gri-cc-txt">We use cookies to improve your experience and measure usage. ' +
       'See our <a href="cerez-politikasi">Cookie Policy</a> for details.</div>' +
       '<div class="gri-cc-actions">' +
       '<button id="gri-cc-nec" type="button">Only necessary</button>' +
       '<button id="gri-cc-accept" type="button">Accept</button>' +
       '</div>')
      :
      ('<div class="gri-cc-txt">Bu sitede deneyimi iyileştirmek ve kullanımı ölçmek için çerezler kullanıyoruz. ' +
       'Ayrıntılar için <a href="cerez-politikasi">Çerez Politikası</a>.</div>' +
       '<div class="gri-cc-actions">' +
       '<button id="gri-cc-nec" type="button">Yalnızca gerekli</button>' +
       '<button id="gri-cc-accept" type="button">Kabul Et</button>' +
       '</div>');
    document.body.appendChild(bar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add("gri-cc-in"); }); });

    function dismiss(val) {
      try { localStorage.setItem(KEY, val); } catch (e) {}
      bar.classList.remove("gri-cc-in");
      setTimeout(function () { bar.remove(); }, 480);
    }
    document.getElementById("gri-cc-accept").addEventListener("click", function () { dismiss("accepted"); });
    document.getElementById("gri-cc-nec").addEventListener("click", function () { dismiss("necessary"); });
  }

  if (document.readyState !== "loading") inject();
  else document.addEventListener("DOMContentLoaded", inject);
})();
