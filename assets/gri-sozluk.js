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
  var sb = null, UID = null, TOKEN = null, btn = null, pop = null, lastWord = '', hideT = null;

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
    '#gs-spin{width:22px;height:22px;border-radius:50%;border:2.5px solid var(--line);border-top-color:var(--gri-accent,#2C5856);animation:gsSpin .8s linear infinite;margin:8px auto;}' +
    '@keyframes gsSpin{to{transform:rotate(360deg)}}';

  function injectCss(){ var s=document.createElement('style'); s.setAttribute('data-gri-sozluk',''); s.textContent=CSS; (document.head||document.documentElement).appendChild(s); }

  function ensureEls(){
    if (!btn) {
      btn = document.createElement('button'); btn.id='gs-btn'; btn.type='button';
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Sözlük';
      btn.addEventListener('mousedown', function(e){ e.preventDefault(); });
      btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if(lastWord) lookup(lastWord); });
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
      lastWord = w.text;
      showBtn(w.range);
    }, 10);
  }

  function positionPop(){
    // butonun yakınına aç
    var bt = parseFloat(btn.style.top)||window.scrollY+80, bl = parseFloat(btn.style.left)||window.scrollX+20;
    var pw = pop.offsetWidth||300;
    var left = Math.max(8, Math.min(bl, window.innerWidth + window.scrollX - pw - 8));
    pop.style.top = (bt + 34) + 'px'; pop.style.left = left + 'px';
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

  function boot(){
    injectCss(); ensureEls(); loadSession();
    document.addEventListener('mouseup', onSelectionMaybe);
    document.addEventListener('touchend', onSelectionMaybe);
    document.addEventListener('selectionchange', function(){ var s=window.getSelection(); if(!s||!s.toString().trim()){ hideBtn(); } });
    document.addEventListener('mousedown', onDocDown, true);
    window.addEventListener('scroll', function(){ hideBtn(); }, { passive:true });
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
