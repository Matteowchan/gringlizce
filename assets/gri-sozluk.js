/* ============================================================
   GRI SÖZLÜK — sayfa-bağımsız kelime arama
   Metin seç → "Sözlük" butonu → vocab-lookup (cache/AI) → tanım popup
   → "Listeme Ekle" (user_vocab). Kaydedilen kelimeler SAT ile aynı
   havuza girer: panelim flashcard/tekrar + öğretmen vocab ödevi.
   Bağımlılık: supabase-js v2 bu dosyadan önce yüklenmeli.
   Etkinleştirme: sayfaya bu scripti eklemek yeterli.
   ============================================================ */
(function () {
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var FN = SB_URL + '/functions/v1/vocab-lookup';
  var sb = null, UID = null, TOKEN = null, btn = null, pop = null, lastWord = '', hideT = null, FLOAT_ON = true, popAnchor = null;

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); }

  function ensureSb(){
    if (sb) return sb;
    if (window.GRI_SB) { sb = window.GRI_SB; }
    else if (window.supabase && window.supabase.createClient) { sb = window.supabase.createClient(SB_URL, SB_KEY); }
    return sb;
  }
  function loadSession(){
    var c = ensureSb(); if (!c) return;
    try { c.auth.getSession().then(function(r){ var s=r&&r.data&&r.data.session; if(s){ UID=s.user.id; TOKEN=s.access_token; } }, function(){}); } catch(e){}
  }

  var CSS =
    '#gs-btn{position:absolute;z-index:9998;display:none;align-items:center;gap:5px;background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:100px;padding:6px 13px;font:600 13px/1 Inter,system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;}' +
    '#gs-btn.show{display:inline-flex;}' +
    '#gs-btn svg{width:14px;height:14px;}' +
    '#gs-pop{position:absolute;z-index:9999;display:none;width:300px;max-width:calc(100vw - 24px);background:var(--bg-card,#FBF6EC);color:var(--text,#241E17);border:1px solid var(--line,#e3d8c3);border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.28);padding:14px 15px;font-family:Inter,system-ui,sans-serif;}' +
    '#gs-pop.show{display:block;}' +
    '#gs-pop .gs-w{font-family:var(--font-display,Georgia),serif;font-size:1.2rem;font-weight:700;color:var(--text,#241E17);}' +
    '#gs-pop .gs-lvl{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gri-accent,#2C5856);border:1px solid var(--line);border-radius:100px;padding:2px 8px;margin-left:6px;vertical-align:middle;}' +
    '#gs-pop .gs-mean{font-size:14px;color:var(--text,#241E17);margin:.5rem 0 .35rem;font-weight:600;}' +
    '#gs-pop .gs-ex{font-size:12.5px;color:var(--text-soft,#6E6353);line-height:1.5;margin:.15rem 0;}' +
    '#gs-pop .gs-ex b{color:var(--gri-accent,#2C5856);font-weight:700;}' +
    '#gs-pop .gs-tr{font-size:12.5px;color:var(--text-muted,#8a8073);font-style:italic;line-height:1.5;}' +
    '#gs-pop .gs-syn{margin:.55rem 0 0;display:flex;flex-wrap:wrap;gap:5px;}' +
    '#gs-pop .gs-syn span{font-size:11.5px;background:var(--bg-soft,#f1ead9);border:1px solid var(--line);border-radius:100px;padding:2px 9px;color:var(--text-soft,#6E6353);}' +
    '#gs-pop .gs-act{margin-top:.8rem;display:flex;gap:8px;align-items:center;}' +
    '#gs-pop .gs-save{flex:1;background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:9px;padding:8px 12px;font:700 13px Inter,sans-serif;cursor:pointer;}' +
    '#gs-pop .gs-save.saved{background:var(--gri-gold,#B78A2E);}' +
    '#gs-pop .gs-save:disabled{opacity:.7;cursor:default;}' +
    '#gs-pop .gs-x{background:none;border:none;color:var(--text-muted,#8a8073);font-size:20px;line-height:1;cursor:pointer;padding:0 4px;}' +
    '#gs-pop .gs-msg{font-size:12.5px;color:var(--text-soft,#6E6353);line-height:1.5;}' +
    '#gs-pop .gs-msg a{color:var(--gri-accent,#2C5856);}' +
    '#gs-pop .gs-search{display:flex;gap:7px;margin-top:2px;}' +
    '#gs-pop .gs-search input{flex:1;min-width:0;background:var(--bg-soft,#f1ead9);border:1px solid var(--line,#e3d8c3);border-radius:9px;padding:8px 11px;font:600 14px Inter,system-ui,sans-serif;color:var(--text,#241E17);outline:none;}' +
    '#gs-pop .gs-search input:focus{border-color:var(--gri-accent,#2C5856);}' +
    '#gs-pop .gs-search button{background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:9px;padding:0 14px;font:700 13px Inter,sans-serif;cursor:pointer;}' +
    '#gs-pop .gs-hint{font-size:11.5px;color:var(--text-muted,#8a8073);margin-top:.5rem;}' +
    '#gs-spin{width:22px;height:22px;border-radius:50%;border:2.5px solid var(--line);border-top-color:var(--gri-accent,#2C5856);animation:gsSpin .8s linear infinite;margin:8px auto;}' +
    '@keyframes gsSpin{to{transform:rotate(360deg)}}' +
    '.gs-tool{display:inline-flex;align-items:center;gap:5px;background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:8px;padding:5px 11px;font:600 12.5px/1 Inter,system-ui,sans-serif;cursor:pointer;margin-right:8px;vertical-align:middle;white-space:nowrap;}' +
    '.gs-tool svg{width:14px;height:14px;}' +
    '.gs-tool:hover{filter:brightness(1.1);}';

  function injectCss(){ var s=document.createElement('style'); s.setAttribute('data-gri-sozluk',''); s.textContent=CSS; (document.head||document.documentElement).appendChild(s); }

  function ensureEls(){
    if (!btn) {
      btn = document.createElement('button'); btn.id='gs-btn'; btn.type='button';
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Sözlük';
      btn.addEventListener('mousedown', function(e){ e.preventDefault(); });
      btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if(lastWord) lookup(lastWord); else renderSearchBox(); });
      document.body.appendChild(btn);
    }
    if (!pop) {
      pop = document.createElement('div'); pop.id='gs-pop';
      document.body.appendChild(pop);
    }
  }

  function hideBtn(){ if(btn) btn.classList.remove('show'); }
  function hidePop(){ if(pop) pop.classList.remove('show'); }

  function selWord(){
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var t = sel.toString().trim();
    if (!t || t.length > 60) return null;
    if (t.split(/\s+/).length > 4) return null;
    if (!/[A-Za-z]/.test(t)) return null;
    var node = sel.anchorNode; var el = node && (node.nodeType===1 ? node : node.parentElement);
    if (!el || !el.closest) return null;
    // Form alanları, nav, footer, popup, meet kontrolleri → hariç
    if (el.closest('input,textarea,[contenteditable=""],[contenteditable="true"],.gri-nav,.site-footer,#gs-pop,#gs-btn,.gmr-controls,.gmr-nav')) return null;
    return { text: t, range: sel.getRangeAt(0) };
  }

  function showBtn(range){
    ensureEls();
    var r = range.getBoundingClientRect();
    if (!r || (!r.width && !r.height)) return;
    btn.classList.add('show');
    var bw = btn.offsetWidth || 96, bh = btn.offsetHeight || 30;
    var top = r.top + window.scrollY - bh - 8;
    if (top < window.scrollY + 4) top = r.bottom + window.scrollY + 8;
    var left = r.left + window.scrollX + (r.width/2) - (bw/2);
    left = Math.max(8, Math.min(left, window.innerWidth + window.scrollX - bw - 8));
    btn.style.top = top + 'px'; btn.style.left = left + 'px';
  }

  function onSelectionMaybe(){
    if (hideT) { clearTimeout(hideT); hideT = null; }
    setTimeout(function(){
      var w = selWord();
      if (!w) { hideBtn(); return; }
      lastWord = w.text; popAnchor = w.range;
      if (FLOAT_ON) showBtn(w.range);  // highlight sayfalarında (.hl-group) kapalı — çift-tık + toolbar butonu kullanılır
    }, 10);
  }
  // Çift-tık koordinatından kelimeyi bul (seçim highlight tarafından temizlense bile çalışır)
  function wordAtPoint(x, y){
    var range = null;
    if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) { var cp = document.caretPositionFromPoint(x, y); if (cp) { range = document.createRange(); range.setStart(cp.offsetNode, cp.offset); range.collapse(true); } }
    if (!range) return null;
    var node = range.startContainer; if (!node || node.nodeType !== 3) return null;
    var el = node.parentElement;
    if (el && el.closest && el.closest('input,textarea,[contenteditable=""],[contenteditable="true"],.gri-nav,.site-footer,#gs-pop,#gs-btn,.gmr-controls,.gmr-nav')) return null;
    var text = node.nodeValue || '', off = range.startOffset, s = off, e = off;
    while (s > 0 && /[A-Za-z'’-]/.test(text.charAt(s-1))) s--;
    while (e < text.length && /[A-Za-z'’-]/.test(text.charAt(e))) e++;
    var w = text.slice(s, e).replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
    if (!w || !/[A-Za-z]/.test(w)) return null;
    var wr = document.createRange(); try { wr.setStart(node, s); wr.setEnd(node, e); } catch(_){ wr = range; }
    return { text: w, range: wr };
  }
  // Çift tık = sözlük. Highlight (passage) mouseup'ı BUBBLE fazında seçimi <mark>'a sarıp
  // temizliyor; biz CAPTURE fazında yakalayıp durduruyoruz → sözlük açılır, highlight olmaz.
  function onDblMouseUp(e){
    if (e.detail < 2) return;  // sadece çift tık
    var w = wordAtPoint(e.clientX, e.clientY) || selWord();
    if (!w) return;
    e.stopPropagation();
    try { window.getSelection().removeAllRanges(); } catch(_){}
    lastWord = w.text; popAnchor = w.range; lookup(w.text);
  }
  // Araç çubuğuna (İşaretle'nin soluna) kalıcı "Sözlük" butonu enjekte et
  function injectToolbarBtn(){
    if (document.getElementById('gs-tool')) return;
    var hl = document.querySelector('.hl-group'), tb = null, before = null;
    if (hl && hl.parentElement) { tb = hl.parentElement; before = hl; }
    else { var fz = document.querySelector('.font-zoom-btn'); if (fz && fz.parentElement) { tb = fz.parentElement.parentElement || fz.parentElement; before = fz.parentElement; } }
    if (!tb) return;
    var b = document.createElement('button'); b.id='gs-tool'; b.type='button'; b.className='gs-tool';
    b.title='Sözlük: kelimeye çift tıkla, seçip buna bas ya da yazarak ara';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Sözlük';
    // seçim, click'ten önce dağılmasın diye kelimeyi mousedown'da yakala
    var armed = null;
    b.addEventListener('mousedown', function(){ armed = selWord(); });
    b.addEventListener('click', function(e){ e.preventDefault(); if(armed){ lastWord=armed.text; popAnchor=armed.range; lookup(armed.text); armed=null; } else { popAnchor=null; renderSearchBox(); } });
    if (before) tb.insertBefore(b, before); else tb.appendChild(b);
  }
  // Toolbar çapası olmayan sayfalarda (ödev havuzu vb.) kalıcı floating "Sözlük" butonu
  function injectFloatingBtn(){
    if (document.getElementById('gs-fab')) return;
    var b = document.createElement('button'); b.id='gs-fab'; b.type='button';
    b.title='Sözlük: kelimeye çift tıkla, seç ya da buraya basıp yaz';
    b.setAttribute('aria-label','Sözlük');
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><span>Sözlük</span>';
    b.style.cssText='position:fixed;right:16px;bottom:84px;z-index:9997;display:inline-flex;align-items:center;gap:7px;background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:100px;padding:11px 16px;font:700 14px Inter,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;';
    var svg=b.querySelector('svg'); if(svg){ svg.style.width='18px'; svg.style.height='18px'; svg.style.flex='0 0 auto'; }
    var armed=null;
    b.addEventListener('mousedown', function(){ armed = selWord(); });
    b.addEventListener('touchstart', function(){ armed = selWord(); }, { passive:true });
    // FAB'a basınca panel HER ZAMAN butonun hemen üstünde açılır (seçili kelime olsa da uzak range'e değil FAB'a çıpalanır)
    b.addEventListener('click', function(e){ e.preventDefault(); var w = armed || selWord(); armed=null; popAnchor=null; if (w){ lastWord=w.text; lookup(w.text); } else { renderSearchBox(); } });
    document.body.appendChild(b);
  }
  function renderMsgAt(html){ ensureEls(); pop.classList.add('show'); renderMsg(html); }

  // SAT'taki gibi: elle kelime yazıp arama kutusu
  function renderSearchBox(prefill){
    ensureEls(); pop.classList.add('show');
    pop.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:.5rem">' +
        '<div class="gs-w" style="font-size:1rem">Sözlükte ara</div>' +
        '<button class="gs-x" title="Kapat">&times;</button></div>' +
      '<div class="gs-search"><input type="text" id="gs-q" placeholder="İngilizce kelime yaz…" autocomplete="off" spellcheck="false" value="' + esc(prefill||'') + '">' +
        '<button type="button" id="gs-go">Ara</button></div>' +
      '<div class="gs-hint">Bir kelimeye çift tıklayarak da arayabilirsin.</div>';
    pop.querySelector('.gs-x').addEventListener('click', hidePop);
    var inp = pop.querySelector('#gs-q'), go = pop.querySelector('#gs-go');
    function run(){ var v=(inp.value||'').trim(); if(v){ popAnchor=null; lastWord=v; lookup(v); } else { inp.focus(); } }
    go.addEventListener('click', run);
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); run(); } else if(e.key==='Escape'){ hidePop(); } });
    positionPop();
    setTimeout(function(){ try{ inp.focus(); inp.select(); }catch(_){}}, 30);
  }

  function positionPop(){
    var pw = pop.offsetWidth||300, ph = pop.offsetHeight||160, top, left, r = null, isFab = false;
    if (popAnchor && popAnchor.getBoundingClientRect) { var rr = popAnchor.getBoundingClientRect(); if (rr && (rr.width||rr.height)) r = rr; }
    if (!r) { var tbtn = document.getElementById('gs-tool'); if (tbtn) r = tbtn.getBoundingClientRect(); }
    if (!r) { var fab = document.getElementById('gs-fab'); if (fab) { r = fab.getBoundingClientRect(); isFab = true; } }
    if (r) {
      if (isFab) {
        // Kelime seçili değilse: paneli "Sözlük" FAB'ının hemen ÜSTÜNDE, sağ kenarı hizalı göster
        top = r.top + window.scrollY - ph - 10;
        if (top < window.scrollY + 8) top = window.scrollY + 8;
        left = r.right + window.scrollX - pw;
      } else {
        top = r.bottom + window.scrollY + 8;
        if (top + ph > window.scrollY + window.innerHeight - 8) top = Math.max(window.scrollY + 8, r.top + window.scrollY - ph - 8);
        left = r.left + window.scrollX;
      }
    } else {
      top = (parseFloat(btn.style.top)||window.scrollY+80) + 34;
      left = parseFloat(btn.style.left)||window.scrollX+20;
    }
    left = Math.max(8, Math.min(left, window.innerWidth + window.scrollX - pw - 8));
    pop.style.top = top + 'px'; pop.style.left = left + 'px';
  }

  async function lookup(word){
    ensureEls(); hideBtn();
    pop.innerHTML = '<div id="gs-spin"></div>'; pop.classList.add('show'); positionPop();
    var headers = { 'Content-Type':'application/json', 'apikey': SB_KEY };
    // en güncel token
    try { var c=ensureSb(); if(c){ var s=await c.auth.getSession(); if(s&&s.data&&s.data.session){ UID=s.data.session.user.id; TOKEN=s.data.session.access_token; } } } catch(e){}
    if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
    var data = null;
    try {
      var r = await fetch(FN, { method:'POST', headers: headers, body: JSON.stringify({ word: word }) });
      data = await r.json();
    } catch(e) { renderMsg('Bağlantı hatası. Tekrar dene.'); return; }
    if (!data || !data.ok) {
      if (data && data.error === 'login_required') { renderMsg('Bu kelime henüz kayıtlı değil. Yeni kelime aramak ve listene eklemek için <a href="giris?return=' + encodeURIComponent(location.pathname+location.search) + '">giriş yap</a>.'); }
      else if (data && data.error === 'ai_unavailable') { renderMsg('Sözlük şu an meşgul, birazdan tekrar dene.'); }
      else { renderMsg('Kelime bulunamadı.'); }
      return;
    }
    renderDef(data);
  }

  function renderMsg(html){ pop.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px"><div class="gs-msg">' + html + '</div><button class="gs-x" title="Kapat">&times;</button></div>'; pop.querySelector('.gs-x').addEventListener('click', hidePop); positionPop(); }

  function renderDef(d){
    var meanings = (d.meanings && d.meanings.length) ? d.meanings.join(', ') : (d.translation || '');
    var syn = (d.synonyms && d.synonyms.length) ? '<div class="gs-syn">' + d.synonyms.map(function(s){return '<span>'+esc(s)+'</span>';}).join('') + '</div>' : '';
    var ex = d.example ? '<p class="gs-ex"><b>Örnek:</b> ' + esc(d.example) + '</p>' + (d.translation ? '<p class="gs-tr">' + esc(d.translation) + '</p>' : '') : '';
    var lvl = d.level ? '<span class="gs-lvl">' + esc(d.level) + '</span>' : '';
    var save = UID
      ? '<button class="gs-save" data-vid="' + esc(d.vocabulary_id) + '">Listeme Ekle</button>'
      : '<a class="gs-save" href="giris?return=' + encodeURIComponent(location.pathname+location.search) + '" style="text-decoration:none;text-align:center;line-height:1.4">Kaydetmek için giriş yap</a>';
    pop.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
        '<div class="gs-w">' + esc(d.word || lastWord) + lvl + '</div>' +
        '<button class="gs-x" title="Kapat">&times;</button></div>' +
      '<div class="gs-mean">' + esc(meanings) + '</div>' + ex + syn +
      '<div class="gs-act">' + save + '</div>';
    pop.querySelector('.gs-x').addEventListener('click', hidePop);
    var sbtn = pop.querySelector('button.gs-save');
    if (sbtn) sbtn.addEventListener('click', function(){ saveWord(d.vocabulary_id, sbtn); });
    positionPop();
  }

  async function saveWord(vid, b){
    if (!UID || !vid) return;
    b.disabled = true; var orig = b.textContent; b.textContent = 'Ekleniyor...';
    try {
      var c = ensureSb();
      var ins = await c.from('user_vocab').insert({ user_id: UID, vocabulary_id: vid });
      if (ins.error) {
        if (ins.error.code === '23505' || (ins.error.message||'').toLowerCase().indexOf('duplicate') !== -1) { b.textContent = 'Zaten Listende ✓'; b.classList.add('saved'); return; }
        throw ins.error;
      }
      b.textContent = 'Listene Eklendi ✓'; b.classList.add('saved');
    } catch(e) { b.textContent = 'Hata'; setTimeout(function(){ b.textContent = orig; b.disabled = false; }, 1800); }
  }

  function onDocDown(e){
    if (btn && (e.target === btn || btn.contains(e.target))) return;
    if (pop && pop.contains(e.target)) return;
    hidePop();
    if (!window.getSelection || !window.getSelection().toString().trim()) hideBtn();
  }

  // Dışa açık API — manuel mod (ör. Gri Meet) yalnızca butonla açar
  window.GriSozluk = {
    openSearch: function(anchorEl, prefill){ ensureEls(); loadSession(); if(!document.querySelector('style[data-gri-sozluk]')) injectCss(); popAnchor = (anchorEl&&anchorEl.getBoundingClientRect)?anchorEl:null; renderSearchBox(prefill); },
    lookup: function(w, anchorEl){ ensureEls(); loadSession(); if(!document.querySelector('style[data-gri-sozluk]')) injectCss(); popAnchor = (anchorEl&&anchorEl.getBoundingClientRect)?anchorEl:null; if(w){ lastWord=w; lookup(w); } else renderSearchBox(); },
    close: hidePop
  };
  function boot(){
    injectCss(); ensureEls(); loadSession();
    if (window.GRI_SOZLUK_MANUAL){
      // Manuel mod: otomatik çift-tık / seçim-popup / FAB / toolbar butonu YOK. Yalnız GriSozluk.openSearch() ile açılır.
      document.addEventListener('mousedown', onDocDown, true);
      window.addEventListener('scroll', function(){ hideBtn(); }, { passive:true });
      return;
    }
    // Highlight (.hl-group) olan sayfalarda seçim-popup'ı kapat (çakışma önle); çift-tık + toolbar butonu her yerde çalışır
    FLOAT_ON = !document.querySelector('.hl-group');
    document.addEventListener('mouseup', onDblMouseUp, true);  // capture: highlight'tan önce çift-tık'ı yakala
    document.addEventListener('mouseup', onSelectionMaybe);
    document.addEventListener('touchend', onSelectionMaybe);
    document.addEventListener('dblclick', function(e){ e.preventDefault && e.preventDefault(); });
    document.addEventListener('selectionchange', function(){ var s=window.getSelection(); if(!s||!s.toString().trim()){ hideBtn(); } });
    document.addEventListener('mousedown', onDocDown, true);
    window.addEventListener('scroll', function(){ hideBtn(); }, { passive:true });
    injectToolbarBtn();
    // Toolbar sonradan render olabilir → kısa bir süre dene
    var tries=0; var iv=setInterval(function(){ injectToolbarBtn(); if(document.getElementById('gs-tool')||++tries>20) clearInterval(iv); }, 400);
    // Toolbar çapası olmayan sayfalarda (ödev havuzu vb.) kalıcı floating buton göster
    if (!document.querySelector('.hl-group, .font-zoom-btn')) injectFloatingBtn();
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
