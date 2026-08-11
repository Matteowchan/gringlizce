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
    ".gri-dd.gri-dd-mega.open>.gri-dd-menu{display:block}",".gri-dd.gri-dd-cols2.open>.gri-dd-menu{display:grid}",
    ".gri-nav .right{margin-left:auto;display:flex;align-items:center;gap:9px}",
    ".gri-ico{width:34px;height:34px;border-radius:50%;border:1px solid var(--gri-line);background:var(--gri-surface);color:var(--gri-ink-soft);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:12.5px}",
    ".gri-ico:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",
    ".gri-avatar{width:34px;height:34px;border-radius:50%;background:var(--gri-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:700;font-size:14px}",".gri-user-mount{display:flex;align-items:center}",".gri-giris{display:inline-flex;align-items:center;background:var(--gri-accent);color:#fff;border-radius:20px;padding:8px 16px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;text-decoration:none}.gri-giris:hover{background:var(--gri-accent-deep)}",".gri-rdd{position:relative}",".gri-rdd>button{display:flex;align-items:center;gap:6px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:20px;padding:7px 13px;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;color:var(--gri-ink-soft)}",".gri-rdd>button:hover{color:var(--gri-ink);border-color:var(--gri-ink-faint)}",".gri-user-dd>button{background:none;border:none;padding:0}",".gri-rdd>button .cv{width:9px;height:9px;opacity:.6;transition:.2s}.gri-rdd.open>button .cv{transform:rotate(180deg)}",".gri-rdd-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:186px;background:var(--gri-surface);border:1px solid var(--gri-line);border-radius:14px;box-shadow:var(--gri-shadow);padding:8px;display:none;z-index:80}",".gri-rdd.open .gri-rdd-menu{display:block}",".gri-rdd-menu a{display:block;padding:9px 11px;border-radius:9px;color:var(--gri-ink);font-weight:500;text-decoration:none;font-family:Inter,sans-serif;font-size:13.5px}",".gri-rdd-menu a:hover{background:var(--gri-surface-2);color:var(--gri-ink)}",".gri-thgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;min-width:276px}",".gri-th-opt{display:flex;flex-direction:column;align-items:center;gap:6px;width:auto;padding:9px 3px;border:none;background:none;cursor:pointer;border-radius:10px;font-family:Inter,sans-serif;font-size:10px;line-height:1.15;color:var(--gri-ink-soft);text-align:center;word-break:normal;overflow-wrap:break-word;hyphens:none}",".gri-th-opt:hover{background:var(--gri-surface-2);color:var(--gri-ink)}.gri-th-opt.on{color:var(--gri-ink);font-weight:600}",".gri-th-opt .dot{width:24px;height:24px;border-radius:50%;flex:none;border:1px solid rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,.28);transition:box-shadow .15s,transform .12s}",".gri-th-opt:hover .dot{transform:scale(1.1)}",".gri-th-opt.on .dot{box-shadow:0 0 0 2px var(--gri-surface),0 0 0 3.5px var(--gri-ink)}",".gri-th-lbl{font-family:Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gri-ink-faint);padding:6px 11px 4px}",
    ".gri-burger{display:none;width:42px;height:42px;border-radius:10px;border:1px solid var(--gri-line);background:var(--gri-surface);cursor:pointer;align-items:center;justify-content:center}",
    ".gri-burger svg{width:18px;height:18px;color:var(--gri-ink)}",
    ".gri-mmenu{display:none}",
    "@media(max-width:1200px){.gri-nav .links,.gri-rdd,.gri-ico{display:none}.gri-burger{display:flex}",
    ".gri-mmenu.open{display:block;position:fixed;left:0;right:0;top:0;bottom:0;z-index:950;background:var(--gri-nav-bg);overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:24px}",
    ".gri-mmenu .in{max-width:640px;margin:0 auto;padding:0 22px 44px;display:block;height:auto}",
    ".gri-mclose{display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--gri-nav-bg);padding:16px 0 12px;border-bottom:1px solid var(--gri-line);margin-bottom:10px;z-index:2}",
    ".gri-mclose .brand{font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--gri-ink);text-decoration:none;white-space:nowrap}.gri-mclose .brand .it{font-style:italic;color:var(--gri-accent);margin-left:.3em}",
    ".gri-mclose-x{width:40px;height:40px;border-radius:10px;border:1px solid var(--gri-line);background:var(--gri-surface);color:var(--gri-ink);font-size:24px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}",
    ".gri-mcards{display:block;margin-top:4px}",
    ".gri-mcard{display:block;padding:14px 2px;border-bottom:1px solid var(--gri-line-soft);text-decoration:none;color:var(--gri-ink-soft);font-family:'Crimson Pro',Georgia,serif;font-size:16px;font-weight:600;line-height:1.3}",
    ".gri-mcard:active,.gri-mcard:hover{color:var(--gri-accent)}",
    ".gri-mgrp-h{font-family:Inter,sans-serif;font-size:13px;font-weight:800;letter-spacing:.02em;color:var(--gri-accent);padding:18px 2px 6px;border-bottom:1px solid var(--gri-line-soft);margin-bottom:2px}",
    ".gri-mcard.sub{padding-left:16px;font-size:15px;font-weight:500;color:var(--gri-ink-faint)}",
    ".gri-mcard.sub:active,.gri-mcard.sub:hover{color:var(--gri-accent)}",
    ".gri-mmenu #navUserMountSlot{margin:2px 0 14px}",
    ".gri-mmenu #navUserMountSlot .btn-nav-cta,.gri-mmenu #navUserMountSlot .gri-giris{display:block;text-align:center;padding:12px;border-radius:12px;font-size:15px}",
    ".gri-mmenu #navUserMountSlot .nav-user{display:block;position:static}",
    ".gri-mmenu #navUserMountSlot .nav-user-btn{display:none}",
    ".gri-mmenu #navUserMountSlot .nav-user-menu{position:static;display:block;box-shadow:none;border:none;min-width:0;padding:0;margin:0}",
    ".gri-mtheme{border-top:1px solid var(--gri-line-soft);margin-top:6px}",
    ".gri-mtheme-h{display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;cursor:pointer;padding:14px 2px;font-family:'Crimson Pro',Georgia,serif;font-size:16px;font-weight:600;color:var(--gri-ink-soft)}",
    ".gri-mtheme-h .cv{width:12px;height:12px;opacity:.6;transition:.2s}.gri-mtheme.open .gri-mtheme-h .cv{transform:rotate(180deg)}",
    ".gri-mtheme-body{display:none;padding-bottom:8px}.gri-mtheme.open .gri-mtheme-body{display:block}",
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
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase().replace(/\.html$/, "");

    var links = MENU.map(function (it) {
      var active = hrefsOf(it, []).map(function (h) { return String(h).replace(/\.html$/, ""); }).indexOf(here) !== -1;
      if (!it.children) {
        if (it.cta) { var HRT='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M12 21s-6.7-4.35-9.33-8.02C1.1 10.6 1.53 7.6 3.7 6.2c1.9-1.22 4.2-.6 5.3.98L12 11l3-3.82c1.1-1.58 3.4-2.2 5.3-.98 2.17 1.4 2.6 4.4.03 6.78C18.7 16.65 12 21 12 21z"/></svg>'; return '<a href="' + href(it.href) + '" class="gri-cta' + (active ? ' here' : '') + '">' + HRT + esc(it.label) + "</a>"; }
        return '<a href="' + href(it.href) + '"' + (active ? ' class="here"' : "") + ">" + twoline(it.label, false) + "</a>";
      }
      var isMega = it.children.some(function (ch) { return ch.children && ch.children.length; });
      var cols2 = !isMega && it.children.length >= 7;
      var ddCls = "gri-dd" + (active ? " here" : "") + (isMega ? " gri-dd-mega" : (cols2 ? " gri-dd-cols2" : ""));
      var groups = it.children.map(function (ch) {
        if (ch.children) {
          var subs = ch.children.map(function (g) { return '<a href="' + href(g.href) + '">' + esc(g.label) + "</a>"; }).join("");
          return '<div class="gri-grp"><a class="gh" href="' + href(ch.href) + '">' + esc(ch.label) + '</a><div class="gri-sub">' + subs + "</div></div>";
        }
        return '<a href="' + href(ch.href) + '">' + esc(ch.label) + "</a>";
      }).join("");
      return '<div class="' + ddCls + '"><button type="button" data-dd aria-haspopup="true" aria-expanded="false">' + twoline(it.label, true) + '</button><div class="gri-dd-menu" role="menu">' + groups + "</div></div>";
    }).join("");

    // Mobil: tum linkler duz (gruplu) liste olarak kalir — masaustu dropdown'lari
    // mobilde ise tek tek erisilebilir olsun diye agac gezilir.
    function mcard(label, h, sub){ return '<a class="gri-mcard' + (sub ? " sub" : "") + '" href="' + href(h) + '">' + esc(label) + "</a>"; }
    var MCARET = '<svg class="cv" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    // Mobil: gruplar KAPALI baslar, basliga dokununca acilir (akordeon). Duz top-level linkler dogrudan.
    var mcards = MENU.map(function (it) {
      if (!it.children) return mcard(it.label, it.href, false);
      var inner = it.children.map(function (ch) {
        if (!ch.href) return "";
        return '<a href="' + href(ch.href) + '">' + esc(ch.label) + "</a>";
      }).join("");
      return '<div class="gri-msec"><div class="gri-mrow" data-msec>' + esc(it.label) + MCARET + '</div><div class="gri-msub">' + inner + "</div></div>";
    }).join("");

    var tOpts = themeOptsHtml();

    var frag = document.createElement("div");
    frag.insertAdjacentHTML("beforeend", SPRITE);


    frag.insertAdjacentHTML("beforeend",
      '<header class="gri-nav"><div class="in">' +
      '<a href="/" class="brand">Gri<span class="it">English</span></a>' +
      '<nav class="links">' + links + "</nav>" +
      '<div class="right">' +
      '<div class="gri-rdd gri-theme-dd"><button type="button" data-dd>Tema' + CVDOWN + '</button><div class="gri-rdd-menu">' + tOpts + '</div></div>' +
      "<button class='gri-ico aa' id='gri-fs' title='Yazi boyutu'>Aa</button>" +
      "<button class='gri-ico' id='gri-dark' title='Gece modu'><svg viewBox='0 0 20 20' width='16' height='16' fill='currentColor'><path d='M13 2a8 8 0 105 14A7 7 0 0113 2z'/></svg></button>" +
      '<div id="navUserMount" class="gri-user-mount"></div>' +
      "<button class='gri-burger' id='gri-burger' aria-label='Menü' aria-expanded='false' aria-controls='gri-mmenu'><svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M4 7h16M4 12h16M4 17h16' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg></button>" +
      "</div></div>" +
      '<div class="gri-mmenu" id="gri-mmenu"><div class="in">' +
      '<div class="gri-mclose"><a href="/" class="brand">Gri<span class="it">English</span></a><button type="button" class="gri-mclose-x" id="gri-mclose-x" aria-label="Kapat">&times;</button></div>' +
      '<div class="gri-th-lbl">Hesap</div><div id="navUserMountSlot"></div><div class="gri-mcards">' + mcards +
      '<a class="gri-mcard" href="' + BASE + 'panelim.html">Çalışma Masam</a></div>' +
      '<div class="gri-mtheme"><button type="button" class="gri-mtheme-h" id="gri-mtheme-h">Tema' + CVDOWN + '</button><div class="gri-mtheme-body">' + tOpts + "</div></div></div></div></header>");

    var _lb = document.querySelector(".launch-banner");
    var _ref = (_lb && _lb.parentNode === document.body) ? _lb.nextSibling : document.body.firstChild;
    if (_ref && _ref.parentNode !== document.body) _ref = null; // gecersiz referansta basa/sona guvenli ekle
    while (frag.firstChild) document.body.insertBefore(frag.firstChild, _ref);
    applyTheme(readTheme());
    var _mnt = document.getElementById("navUserMount");
    if (_mnt && !_mnt.innerHTML.trim()) _mnt.innerHTML = '<a href="' + BASE + 'giris.html" class="gri-giris">Giriş</a>';

    function closeAllDD() { document.querySelectorAll(".gri-dd.open,.gri-rdd.open").forEach(function (x) { x.classList.remove("open"); }); syncAria(); }
    function syncAria() { document.querySelectorAll(".gri-dd>[data-dd],.gri-rdd>[data-dd]").forEach(function (b) { b.setAttribute("aria-expanded", b.parentNode.classList.contains("open") ? "true" : "false"); }); }
    document.addEventListener("click", function (e) {
      var t = e.target;
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
  }

  // ===== Mobil alt sekme çubuğu =====
  // Kendi CSS'ini enjekte eder — main.css/site-overrides.css yüklemeyen sayfalarda da
  // doğru çalışsın (aksi halde stilsiz kalıp ikonlar sayfayı kaplar).
  function ensureTabbarCss() {
    if (document.getElementById("gri-tabbar-css")) return;
    var st = document.createElement("style");
    st.id = "gri-tabbar-css";
    st.textContent =
      ".gri-tabbar{display:none}" +
      "@media(max-width:640px){" +
      ".gri-tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:900;" +
      "background:rgba(250,247,238,.96);-webkit-backdrop-filter:saturate(1.4) blur(8px);backdrop-filter:saturate(1.4) blur(8px);" +
      "border-top:1px solid #e6ddca;padding:4px 2px max(4px,env(safe-area-inset-bottom));box-shadow:0 -4px 18px rgba(60,45,25,.07)}" +
      ".gri-tabbar a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:#8a8172;" +
      "font-family:var(--font-ui,Inter),system-ui,sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.02em;padding:6px 2px 3px;border-radius:12px;transition:color .15s,background .15s}" +
      ".gri-tabbar a svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8}" +
      ".gri-tabbar a.on{color:var(--teal,#2C5856)}.gri-tabbar a.on svg{stroke:var(--teal,#2C5856)}" +
      ".gri-tabbar a:active{background:rgba(44,88,86,.08)}" +
      "body{padding-bottom:60px}body.app-mode{padding-bottom:70px}}" +
      ":root[data-theme=\"dark\"] .gri-tabbar,html.dark .gri-tabbar{background:rgba(28,24,19,.97);border-top-color:#332c22}" +
      ":root[data-theme=\"dark\"] .gri-tabbar a,html.dark .gri-tabbar a{color:#b5ac96}" +
      ":root[data-theme=\"dark\"] .gri-tabbar a.on,html.dark .gri-tabbar a.on{color:#6FB6AF}" +
      ":root[data-theme=\"dark\"] .gri-tabbar a.on svg,html.dark .gri-tabbar a.on svg{stroke:#6FB6AF}";
    (document.head || document.documentElement).appendChild(st);
  }
  function buildTabbar() {
    try {
      var p = (location.pathname || "").toLowerCase();
      if (/deneme|seviye-belirleme|grimeet-oda/.test(p)) return;
      if (document.documentElement.classList.contains("app-mode")) return;
      if (document.querySelector(".gri-tabbar")) return;
      ensureTabbarCss();
      var file = p.split("/").pop() || "index.html";
      var tabs = [
        { href: "/", label: "Ana Sayfa", match: ["index.html", ""], icon: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>' },
        { href: "/ogrenme-haritasi.html", label: "Harita", match: ["ogrenme-haritasi.html"], icon: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/>' },
        { href: "/soru-bankasi.html", label: "Soru", match: ["soru-bankasi.html"], icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' },
        { href: "/sinifim.html", label: "Sınıf", match: ["sinifim.html", "ogretmen.html", "ogretmen-sinif.html"], icon: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9"/>' },
        { href: "/panelim.html", label: "Masam", match: ["panelim.html"], icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' }
      ];
      var nav = document.createElement("nav");
      nav.className = "gri-tabbar";
      nav.setAttribute("aria-label", "Hızlı gezinme");
      nav.innerHTML = tabs.map(function (t) {
        var on = t.match.map(function (m) { return m.replace(/\.html$/, ""); }).indexOf(file.replace(/\.html$/, "")) >= 0;
        return '<a href="' + t.href + '"' + (on ? ' class="on" aria-current="page"' : "") + '>'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + t.icon + '</svg>'
          + '<span>' + t.label + '</span></a>';
      }).join("");
      document.body.appendChild(nav);
    } catch (e) {}
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
          if (!c.classList.contains("gri-tabbar") && !(c.closest && c.closest(".gri-nav"))) { mn = c; break; }
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

  function boot() { build(); buildTabbar(); a11y(); }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
