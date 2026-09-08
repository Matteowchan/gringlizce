/* gri-hatadefteri.js — "Hata Defteri" (Faz 6.3)
   Öğrencinin tekrar eden hata alanlarını kişisel, açıklamalı bir defter gibi gösterir
   (metrik panosu değil). Yalnız GERÇEK aktivite (user_answers 'incorrect' + questions
   kategorisi). Veri yoksa iyi tasarlanmış ilk-kullanım durumu.
   Güvenli: RLS ile yalnız kullanıcının kendi verisi; hata olursa sessizce ilk-kullanım.
   Kategori kodu → insana okunur etiket + "çalış" yönlendirmesi. */
(function () {
  'use strict';
  if (window.GriHataDefteri) return;
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  // Kategori/alt-kategori kodu → {etiket, ipucu, link}
  var LABELS = {
    'words_in_context': { t: 'Words in Context', h: 'Kelimeyi bağlamdan çöz; sözlük anlamı değil, cümledeki işlevi.', l: 'konu-anlatimi' },
    'craft_and_structure': { t: 'Craft & Structure', h: 'Yazarın amacı, ton ve yapı sorularında ipucu cümleyi işaretle.', l: 'konu-anlatimi' },
    'boundaries': { t: 'Noktalama (Boundaries)', h: 'İki bağımsız cümleyi virgülle bağlama; nokta/;/virgül+bağlaç kullan.', l: 'konu-sentence-structure' },
    'standard_english_conventions': { t: 'Dil Kuralları', h: 'Özne-yüklem uyumu, zaman ve noktalama kurallarını gözden geçir.', l: 'konu-sentence-structure' },
    'form_structure_sense': { t: 'Form, Structure & Sense', h: 'Cümle mantığı ve bağlaç ilişkilerini kontrol et.', l: 'konu-cohesion' },
    'information_and_ideas': { t: 'Information & Ideas', h: 'Metindeki kanıtı sorunun tam olarak ne istediğiyle eşleştir.', l: 'konu-anlatimi' },
    'transitions': { t: 'Geçiş İfadeleri', h: 'Boşluğun iki yanındaki fikirlerin ilişkisini adlandır (zıtlık/sonuç/örnek).', l: 'konu-cohesion' },
    'algebra': { t: 'Algebra', h: 'Denklem kurarken değişkeni ve istenen değeri net ayır.', l: 'konu-anlatimi' },
    'geometry_and_trigonometry': { t: 'Geometry & Trigonometry', h: 'Açı/kenar ilişkilerini ve formülleri tekrar et.', l: 'konu-anlatimi' },
    'circles': { t: 'Çember (Geometry)', h: 'Çember denklemi, yay ve açı bağıntılarını gözden geçir.', l: 'konu-anlatimi' },
    'lines_angles_triangles': { t: 'Doğrular, Açılar, Üçgenler', h: 'Dış açı = uzak iç açılar toplamı gibi temel bağıntılar.', l: 'konu-anlatimi' },
    'advanced_math': { t: 'Advanced Math', h: 'Fonksiyon ve ikinci derece ifadelerde adımları yavaşlat.', l: 'konu-anlatimi' },
    'problem_solving_and_data_analysis': { t: 'Veri Analizi', h: 'Oran, yüzde ve ortalama sorularında birimi kontrol et.', l: 'konu-anlatimi' },
    'ydt-vocabulary': { t: 'YDT Kelime', h: 'Eşdizim (collocation) ve bağlamdan anlam çalış.', l: 'ydt-soru-bankasi' },
    'yds-yds-vocabulary': { t: 'YDS Kelime', h: 'Akademik kelime ve eşdizimleri tekrarla.', l: 'yds-soru-bankasi' },
    'yds-yds-cloze_test': { t: 'YDS Cloze Test', h: 'Paragraf bütünlüğü ve bağlaç seçiminde dikkatli ol.', l: 'yds-soru-bankasi' },
    'vocabulary': { t: 'Kelime', h: 'Bağlamdan anlam ve eşdizim çalış.', l: 'kelime-bankasi' },
    'mixed_calisma': { t: 'Karışık Çalışma', h: 'Zayıf konuları belirleyip hedefli tekrar yap.', l: 'soru-bankasi' },
    'sat_mixed_calisma': { t: 'SAT Karışık', h: 'Zayıf SAT konularını hedefli tekrar et.', l: 'sat-soru-bankasi' }
  };
  function labelFor(cat, sub) {
    var key = (sub || cat || '').toLowerCase();
    if (LABELS[key]) return LABELS[key];
    key = (cat || '').toLowerCase();
    if (LABELS[key]) return LABELS[key];
    // fallback: prettify the code
    var raw = (sub || cat || 'Genel');
    var pretty = raw.replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    return { t: pretty, h: 'Bu alanda birkaç kez zorlandın — kısa bir tekrar iyi gelir.', l: 'soru-bankasi' };
  }

  function client() {
    if (window.GRI_SB) return window.GRI_SB;
    if (window.griTrackSB) return window.griTrackSB;
    if (window.GriAuth && window.GriAuth.supabase) return window.GriAuth.supabase;
    try { if (window.supabase && window.supabase.createClient) { window.griTrackSB = window.supabase.createClient(SB_URL, SB_KEY); return window.griTrackSB; } } catch (e) {}
    return null;
  }

  function ensureStyle() {
    if (document.getElementById('gri-hd-css')) return;
    var s = document.createElement('style'); s.id = 'gri-hd-css';
    s.textContent =
      '.grihd{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:16px;box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.05));padding:1.2rem 1.3rem;font-family:var(--font-ui,Inter,system-ui,sans-serif)}' +
      '.grihd-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.2rem}' +
      '.grihd-head .em{width:34px;height:34px;border-radius:9px;background:var(--gold-soft,rgba(183,138,46,.15));display:flex;align-items:center;justify-content:center;flex:none}' +
      '.grihd-head h2{font-family:var(--font-display,Georgia,serif);font-size:1.2rem;margin:0;color:var(--text,#241E17)}' +
      '.grihd-sub{font-size:.85rem;color:var(--text-soft,#6E6353);margin:.1rem 0 1rem}' +
      '.grihd-list{display:flex;flex-direction:column;gap:.55rem}' +
      '.grihd-entry{display:flex;align-items:flex-start;gap:.8rem;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-left:3px solid var(--gold,#B78A2E);border-radius:11px;padding:.7rem .9rem}' +
      '.grihd-entry .body{flex:1;min-width:0}' +
      '.grihd-entry .t{font-weight:700;font-size:.96rem;color:var(--text,#241E17);display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}' +
      '.grihd-entry .n{font-family:var(--font-ui);font-size:.72rem;font-weight:700;color:var(--gold-deep,#8A6A22);background:var(--gold-soft,rgba(183,138,46,.15));border-radius:999px;padding:.1rem .5rem}' +
      '.grihd-entry .h{font-size:.85rem;color:var(--text-soft,#6E6353);line-height:1.5;margin:.25rem 0 0}' +
      '.grihd-entry a.go{flex:none;align-self:center;font-size:.82rem;font-weight:700;color:var(--teal,#2E6E6A);text-decoration:none;border:1px solid var(--line-strong,#C9BCA0);border-radius:8px;padding:.35rem .7rem;white-space:nowrap}' +
      '.grihd-entry a.go:hover{border-color:var(--teal,#2E6E6A);background:var(--teal-soft,rgba(46,110,106,.12))}' +
      '.grihd-empty{display:flex;gap:.9rem;align-items:center}' +
      '.grihd-empty img{width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none}' +
      '.grihd-empty p{margin:0;font-size:.9rem;color:var(--text-soft,#6E6353);line-height:1.55}' +
      '.grihd-note{font-size:.78rem;color:var(--text-muted,#8B7F6B);margin:.9rem 0 0}';
    document.head.appendChild(s);
  }

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function renderEmpty(el){
    el.className='grihd';
    el.innerHTML =
      '<div class="grihd-head"><span class="em">📓</span><h2>Hata Defteri</h2></div>' +
      '<div class="grihd-empty"><img src="assets/gri-cat-happy.png" alt="Gri"><p>Henüz kayıtlı bir hata deseni yok. Soru çözdükçe, tekrar tekrar zorlandığın konular burada küçük notlar hâlinde birikecek — üstlerine gidip kapatabilirsin.</p></div>' +
      '<div style="margin-top:.9rem"><a href="soru-bankasi" style="font-weight:700;font-size:.9rem;color:var(--teal,#2E6E6A);text-decoration:none">Soru çözmeye başla →</a></div>';
  }

  function renderList(el, rows){
    el.className='grihd';
    var items = rows.map(function(r){
      var L=labelFor(r.category, r.subcategory);
      return '<div class="grihd-entry"><div class="body">' +
        '<div class="t">'+esc(L.t)+' <span class="n">'+r.count+' kez</span></div>' +
        '<div class="h">'+esc(L.h)+'</div></div>' +
        '<a class="go" href="'+esc(L.l)+'">Çalış</a></div>';
    }).join('');
    el.innerHTML =
      '<div class="grihd-head"><span class="em">📓</span><h2>Hata Defteri</h2></div>' +
      '<p class="grihd-sub">En çok tekrarladığın hata alanları — küçük, üstüne gidilebilir notlar.</p>' +
      '<div class="grihd-list">'+items+'</div>' +
      '<p class="grihd-note">Yalnızca senin çözümlerinden; kategorisi tanımlı sorular biriktikçe defterin zenginleşir.</p>';
  }

  function load(el){
    ensureStyle();
    var c = client();
    if (!c) { renderEmpty(el); return; }
    (async function(){
      try{
        var sess = await c.auth.getSession();
        var u = sess && sess.data && sess.data.session ? sess.data.session.user.id : null;
        if (!u) { renderEmpty(el); return; }
        var wr = await c.from('user_answers').select('question_slug').eq('user_id', u).eq('status','incorrect').limit(2000);
        var slugs = (wr && wr.data ? wr.data.map(function(r){return r.question_slug;}).filter(Boolean) : []);
        if (!slugs.length) { renderEmpty(el); return; }
        // uniq slugs for the IN query (cap to keep it light)
        var uniq = Array.from(new Set(slugs)).slice(0, 300);
        var qs = await c.from('questions').select('slug,category,subcategory').in('slug', uniq);
        var meta = {}; (qs && qs.data ? qs.data : []).forEach(function(q){ meta[q.slug] = q; });
        // aggregate wrong counts by subcategory (using every incorrect slug occurrence)
        var agg = {};
        slugs.forEach(function(sl){
          var m = meta[sl]; if (!m) return;
          var key = (m.subcategory || m.category || '').toLowerCase(); if (!key) return;
          if (!agg[key]) agg[key] = { category:m.category, subcategory:m.subcategory, count:0 };
          agg[key].count++;
        });
        var rows = Object.keys(agg).map(function(k){return agg[k];}).sort(function(a,b){return b.count-a.count;}).slice(0,6);
        if (!rows.length) { renderEmpty(el); return; }
        renderList(el, rows);
      }catch(e){ renderEmpty(el); }
    })();
  }

  window.GriHataDefteri = {
    mount: function(target){ var el = typeof target==='string'?document.querySelector(target):target; if (el) load(el); }
  };
})();
