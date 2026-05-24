/* ============================================================
   GRI ENGLISH — SAT R&W 8 GÜNLÜK KAMP — Feature Module
   ============================================================
   Day 1, Day 2 ... Day 8 dosyalarına eklenir. Tek dosya, ortak.
   Her gün dosyası sadece şunu set eder:
     <script>window.SAT_CAMP_DAY = 1;</script>
     <script src="../assets/sat-camp-features.js" defer></script>

   Modül yapar:
     - Supabase client init
     - #qcard içeriği her değiştiğinde toolbar enjekte eder
     - Slug otomatik: sat-rw-kamp-d{day}-m{module}-q{q}
     - Yer İmi (user_bookmarks)
     - Not Al (user_question_notes)
     - Bildir (soru_bildirimleri)
     - Sözlük (inline q.explain.vocab data)
     - Griye Sor (placeholder — edge function geliştirme bekleniyor)

   Bağımlılık: supabase-js v2 BU dosyadan önce yüklü olmalı.
   Day dosyasının renderQuestion'u q.explain.vocab okuyacak şekilde.
   ============================================================ */

(function () {
  'use strict';

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[SATCamp] supabase-js yok, modül atlanıyor.');
    return;
  }

  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  var DAY = window.SAT_CAMP_DAY || 1;
  // Track: 'rw' (Reading and Writing, default) veya 'math'. Day dosyası set eder.
  // Slug ve gri-ask source bu değere göre branch'lenir, kayıtlar karışmaz.
  var TRACK = (window.SAT_CAMP_TRACK === 'math') ? 'math' : 'rw';
  var GRI_USER_ID = null;
  var currentSlug = null;
  var currentVocab = [];

  // -----------------------------------------------------------
  // Auth check
  // -----------------------------------------------------------
  function loginRedirect() {
    location.href = '../giris.html?return=' + encodeURIComponent(location.pathname + location.search);
  }

  async function loadUser() {
    try {
      var resp = await sb.auth.getSession();
      if (resp && resp.data && resp.data.session) {
        GRI_USER_ID = resp.data.session.user.id;
      }
    } catch (e) {
      console.warn('[SATCamp] auth fail:', e);
    }
  }

  // -----------------------------------------------------------
  // Slug computation — Day dosyası currentModule, currentQ globals açar
  // -----------------------------------------------------------
  function computeSlug() {
    var mod = (typeof window.currentModule === 'number') ? window.currentModule : 0;
    var q = (typeof window.currentQ === 'number') ? window.currentQ : 0;
    return 'sat-' + TRACK + '-kamp-d' + DAY + '-m' + (mod + 1) + '-q' + (q + 1);
  }

  function readCurrentVocab() {
    try {
      var mod = window.MODULES[window.currentModule];
      var q = mod.questions[window.currentQ];
      return (q && q.explain && Array.isArray(q.explain.vocab)) ? q.explain.vocab : [];
    } catch (e) { return []; }
  }

  // -----------------------------------------------------------
  // Toolbar HTML — qcard içine enjekte edilir
  // -----------------------------------------------------------
  var TOOLBAR_HTML = '\
<div class="sc-toolbar" id="scToolbar">\
  <button type="button" class="sc-tool-btn" id="scBookmarkBtn" aria-label="Yer imine ekle">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>\
    <span>Yer İmi</span>\
  </button>\
  <button type="button" class="sc-tool-btn" id="scNoteBtn" aria-label="Not al">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>\
    <span>Not</span>\
  </button>\
  <button type="button" class="sc-tool-btn" id="scVocabBtn" aria-label="Sözlük">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>\
    <span>Sözlük</span>\
  </button>\
  <button type="button" class="sc-tool-btn" id="scAskBtn" aria-label="Griye sor">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>\
    <span>Griye Sor</span>\
  </button>\
  <button type="button" class="sc-tool-btn" id="scReportBtn" aria-label="Bildir">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>\
    <span>Bildir</span>\
  </button>\
</div>';

  // -----------------------------------------------------------
  // Modals HTML — body sonuna eklenir
  // -----------------------------------------------------------
  var MODALS_HTML = '\
<div class="sc-modal-overlay" id="scOverlay" aria-hidden="true"></div>\
\
<div class="sc-modal" id="scNoteModal" role="dialog" aria-modal="true" aria-hidden="true">\
  <div class="sc-modal-head"><h3>Bu soru için not</h3><button type="button" class="sc-modal-close" data-close="scNoteModal" aria-label="Kapat">×</button></div>\
  <div class="sc-modal-body">\
    <label class="sc-modal-label"><span>Notun <span id="scNoteCounter">0 / 2000</span></span><textarea id="scNoteText" rows="7" maxlength="2000" placeholder="Bu soruyla ilgili düşüncelerini buraya yaz..."></textarea></label>\
    <div class="sc-modal-actions">\
      <button type="button" class="sc-btn-ghost" id="scNoteDelete" style="display:none;">Sil</button>\
      <button type="button" class="sc-btn-ghost" data-close="scNoteModal">Vazgeç</button>\
      <button type="button" class="sc-btn-primary" id="scNoteSubmit">Kaydet</button>\
    </div>\
    <div class="sc-modal-feedback" id="scNoteFeedback" aria-live="polite"></div>\
  </div>\
</div>\
\
<div class="sc-modal" id="scReportModal" role="dialog" aria-modal="true" aria-hidden="true">\
  <div class="sc-modal-head"><h3>Soruyu bildir</h3><button type="button" class="sc-modal-close" data-close="scReportModal" aria-label="Kapat">×</button></div>\
  <div class="sc-modal-body">\
    <label class="sc-modal-label"><span>Sorun türü</span><select id="scReportCategory"><option value="">Seçiniz</option><option value="Yanlış cevap">Yanlış cevap</option><option value="Soru hatası">Soru hatası (yazım, format)</option><option value="Açıklama hatası">Açıklama hatası</option><option value="Görüntü sorunu">Görüntü sorunu</option><option value="Diğer">Diğer</option></select></label>\
    <label class="sc-modal-label"><span>Detay</span><textarea id="scReportDetail" rows="5" placeholder="Sorunu kısaca açıklayın..."></textarea></label>\
    <div class="sc-modal-actions">\
      <button type="button" class="sc-btn-ghost" data-close="scReportModal">Vazgeç</button>\
      <button type="button" class="sc-btn-primary" id="scReportSubmit">Gönder</button>\
    </div>\
    <div class="sc-modal-feedback" id="scReportFeedback" aria-live="polite"></div>\
  </div>\
</div>\
\
<div class="sc-modal" id="scVocabModal" role="dialog" aria-modal="true" aria-hidden="true">\
  <div class="sc-modal-head"><h3>Sözlük</h3><button type="button" class="sc-modal-close" data-close="scVocabModal" aria-label="Kapat">×</button></div>\
  <div class="sc-modal-body"><div id="scVocabList" class="sc-vocab-list"></div></div>\
</div>\
\
<div class="sc-modal" id="scAskModal" role="dialog" aria-modal="true" aria-hidden="true">\
  <div class="sc-modal-head"><h3>Griye Sor</h3><button type="button" class="sc-modal-close" data-close="scAskModal" aria-label="Kapat">×</button></div>\
  <div class="sc-modal-body">\
    <p class="sc-modal-note">Bu soru hakkında AI mentor Gri\'ye bir şey sor. 250 kelimeye kadar cevap verir.</p>\
    <label class="sc-modal-label"><span>Sorun</span><textarea id="scAskPrompt" rows="3" placeholder="Örn: B şıkkı neden yanlış?"></textarea></label>\
    <div class="sc-modal-actions">\
      <button type="button" class="sc-btn-ghost" data-close="scAskModal">Vazgeç</button>\
      <button type="button" class="sc-btn-primary" id="scAskSubmit">Sor</button>\
    </div>\
    <div class="sc-modal-feedback" id="scAskFeedback" aria-live="polite"></div>\
    <div class="sc-ask-response" id="scAskResponse"></div>\
  </div>\
</div>';

  // -----------------------------------------------------------
  // Modal helpers
  // -----------------------------------------------------------
  function openModal(id) {
    var ov = document.getElementById('scOverlay');
    var m = document.getElementById(id);
    if (ov && m) {
      ov.setAttribute('aria-hidden', 'false');
      m.setAttribute('aria-hidden', 'false');
    }
  }
  function closeModal(id) {
    var ov = document.getElementById('scOverlay');
    var m = document.getElementById(id);
    if (m) m.setAttribute('aria-hidden', 'true');
    // Eğer hiç modal açık değilse overlay'i kapat
    var anyOpen = document.querySelectorAll('.sc-modal[aria-hidden="false"]').length;
    if (ov && !anyOpen) ov.setAttribute('aria-hidden', 'true');
  }
  function closeAllModals() {
    document.querySelectorAll('.sc-modal').forEach(function (m) {
      m.setAttribute('aria-hidden', 'true');
    });
    var ov = document.getElementById('scOverlay');
    if (ov) ov.setAttribute('aria-hidden', 'true');
  }

  // -----------------------------------------------------------
  // Yer İmi (Bookmark)
  // -----------------------------------------------------------
  var isBookmarked = false;

  async function loadBookmark() {
    var btn = document.getElementById('scBookmarkBtn');
    if (!btn) return;
    btn.classList.remove('active');
    isBookmarked = false;
    if (!GRI_USER_ID || !currentSlug) return;
    try {
      var res = await sb.from('user_bookmarks')
        .select('question_slug')
        .eq('user_id', GRI_USER_ID)
        .eq('question_slug', currentSlug)
        .maybeSingle();
      isBookmarked = !!(res && res.data);
      btn.classList.toggle('active', isBookmarked);
    } catch (e) { /* sessiz */ }
  }

  async function toggleBookmark() {
    if (!GRI_USER_ID) { loginRedirect(); return; }
    if (!currentSlug) return;
    var btn = document.getElementById('scBookmarkBtn');
    btn.disabled = true;
    try {
      if (isBookmarked) {
        await sb.from('user_bookmarks')
          .delete()
          .eq('user_id', GRI_USER_ID)
          .eq('question_slug', currentSlug);
        isBookmarked = false;
      } else {
        await sb.from('user_bookmarks')
          .insert({ user_id: GRI_USER_ID, question_slug: currentSlug });
        isBookmarked = true;
      }
      btn.classList.toggle('active', isBookmarked);
    } catch (e) {
      console.error('[SATCamp] bookmark fail:', e, {user: GRI_USER_ID, slug: currentSlug});
      // Görsel bir geribildirim — kullanıcı RLS hatası vs durumunda fark etsin
      btn.title = 'Yer imi kaydedilemedi: ' + (e.message || 'bilinmeyen hata');
      btn.classList.remove('active');
    } finally {
      btn.disabled = false;
    }
  }

  // -----------------------------------------------------------
  // Not Al
  // -----------------------------------------------------------
  var currentNote = null;

  async function loadNote() {
    var btn = document.getElementById('scNoteBtn');
    if (!btn) return;
    btn.classList.remove('active');
    currentNote = null;
    if (!GRI_USER_ID || !currentSlug) return;
    try {
      var res = await sb.from('user_question_notes')
        .select('note')
        .eq('user_id', GRI_USER_ID)
        .eq('question_slug', currentSlug)
        .maybeSingle();
      if (res && res.data && res.data.note) {
        currentNote = res.data.note;
        btn.classList.add('active');
      }
    } catch (e) { /* sessiz */ }
  }

  function openNoteModal() {
    if (!GRI_USER_ID) { loginRedirect(); return; }
    if (!currentSlug) return;
    var ta = document.getElementById('scNoteText');
    var del = document.getElementById('scNoteDelete');
    var fb = document.getElementById('scNoteFeedback');
    ta.value = currentNote || '';
    updateNoteCounter();
    del.style.display = currentNote ? '' : 'none';
    fb.textContent = '';
    fb.className = 'sc-modal-feedback';
    openModal('scNoteModal');
    setTimeout(function () { ta.focus(); }, 50);
  }

  function updateNoteCounter() {
    var ta = document.getElementById('scNoteText');
    var c = document.getElementById('scNoteCounter');
    if (ta && c) c.textContent = (ta.value || '').length + ' / 2000';
  }

  async function submitNote() {
    if (!GRI_USER_ID || !currentSlug) return;
    var ta = document.getElementById('scNoteText');
    var fb = document.getElementById('scNoteFeedback');
    var btn = document.getElementById('scNoteSubmit');
    var text = (ta.value || '').trim();
    if (!text) { fb.textContent = 'Boş not kaydedilemez.'; fb.className = 'sc-modal-feedback error'; return; }
    btn.disabled = true; btn.textContent = 'Kaydediliyor...';
    try {
      var res = await sb.from('user_question_notes')
        .upsert({ user_id: GRI_USER_ID, question_slug: currentSlug, note: text }, { onConflict: 'user_id,question_slug' });
      if (res.error) throw res.error;
      currentNote = text;
      document.getElementById('scNoteBtn').classList.add('active');
      fb.textContent = 'Kaydedildi.'; fb.className = 'sc-modal-feedback success';
      setTimeout(function () { closeModal('scNoteModal'); }, 800);
    } catch (e) {
      fb.textContent = 'Kayıt başarısız: ' + (e.message || 'bilinmeyen hata');
      fb.className = 'sc-modal-feedback error';
    } finally {
      btn.disabled = false; btn.textContent = 'Kaydet';
    }
  }

  async function deleteNote() {
    if (!GRI_USER_ID || !currentSlug || !currentNote) return;
    if (!confirm('Bu notu silmek istediğine emin misin?')) return;
    var fb = document.getElementById('scNoteFeedback');
    try {
      await sb.from('user_question_notes')
        .delete()
        .eq('user_id', GRI_USER_ID)
        .eq('question_slug', currentSlug);
      currentNote = null;
      document.getElementById('scNoteBtn').classList.remove('active');
      document.getElementById('scNoteText').value = '';
      document.getElementById('scNoteDelete').style.display = 'none';
      fb.textContent = 'Silindi.'; fb.className = 'sc-modal-feedback success';
      setTimeout(function () { closeModal('scNoteModal'); }, 700);
    } catch (e) {
      fb.textContent = 'Silme başarısız.'; fb.className = 'sc-modal-feedback error';
    }
  }

  // -----------------------------------------------------------
  // Bildir (Report)
  // -----------------------------------------------------------
  function openReportModal() {
    if (!currentSlug) return;
    document.getElementById('scReportCategory').value = '';
    document.getElementById('scReportDetail').value = '';
    var fb = document.getElementById('scReportFeedback');
    fb.textContent = ''; fb.className = 'sc-modal-feedback';
    openModal('scReportModal');
  }

  async function submitReport() {
    var cat = document.getElementById('scReportCategory').value;
    var det = document.getElementById('scReportDetail').value.trim();
    var fb = document.getElementById('scReportFeedback');
    var btn = document.getElementById('scReportSubmit');
    if (!cat) { fb.textContent = 'Sorun türü seç.'; fb.className = 'sc-modal-feedback error'; return; }
    if (!det) { fb.textContent = 'Detay yaz.'; fb.className = 'sc-modal-feedback error'; return; }
    btn.disabled = true; btn.textContent = 'Gönderiliyor...';
    try {
      var res = await sb.from('soru_bildirimleri').insert({
        kategori: cat,
        detay: det,
        soru_slug: currentSlug,
        soru_url: location.href,
        user_agent: navigator.userAgent
      });
      if (res.error) throw res.error;
      fb.textContent = 'Teşekkürler, bildirim iletildi.';
      fb.className = 'sc-modal-feedback success';
      setTimeout(function () { closeModal('scReportModal'); }, 1500);
    } catch (e) {
      fb.textContent = 'Gönderim başarısız: ' + (e.message || '');
      fb.className = 'sc-modal-feedback error';
    } finally {
      btn.disabled = false; btn.textContent = 'Gönder';
    }
  }

  // -----------------------------------------------------------
  // Sözlük
  // -----------------------------------------------------------
  function openVocab() {
    var list = document.getElementById('scVocabList');
    var vocab = readCurrentVocab();
    if (!vocab.length) {
      list.innerHTML = '<p class="sc-empty">Bu soru için sözlük girişi yok.</p>';
    } else {
      list.innerHTML = vocab.map(function (v, idx) {
        var canSave = !!GRI_USER_ID;
        return '<div class="sc-vocab-item" data-word="' + escapeHtml(v.en) + '">' +
          '<div class="sc-vocab-en"><strong>' + escapeHtml(v.en) + '</strong>' +
            (v.pos ? ' <em class="sc-vocab-pos">' + escapeHtml(v.pos) + '</em>' : '') + '</div>' +
          '<div class="sc-vocab-tr">' + escapeHtml(v.tr || '') + '</div>' +
          (canSave ? '<button type="button" class="sc-vocab-save" data-vocab-save="' + escapeHtml(v.en) + '">Listeme Ekle</button>' : '') +
        '</div>';
      }).join('');
    }
    openModal('scVocabModal');
  }

  // Sözlüğe ekleme: vocab-lookup edge function'ı çağırır (cache veya AI), sonra user_vocab'a yazar
  async function saveVocabWord(word, btn) {
    if (!GRI_USER_ID) { loginRedirect(); return; }
    if (!word) return;
    btn.disabled = true;
    var origText = btn.textContent;
    btn.textContent = 'Aranıyor...';
    try {
      var sess = await sb.auth.getSession();
      var token = sess && sess.data && sess.data.session && sess.data.session.access_token;
      var headers = { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      var r = await fetch(SUPABASE_URL + '/functions/v1/vocab-lookup', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ word: word })
      });
      var data = await r.json();
      if (!r.ok || !data.ok || !data.vocabulary_id) {
        var msg = (data && data.error === 'login_required') ? 'Giriş yapmalısın'
                : (data && data.error === 'ai_unavailable') ? 'Sözlük şu an meşgul'
                : 'Kelime bulunamadı';
        btn.textContent = msg;
        setTimeout(function () { btn.textContent = origText; btn.disabled = false; }, 2000);
        return;
      }

      // user_vocab'a ekle (zaten varsa hata vermez, onConflict ignore)
      var ins = await sb.from('user_vocab').insert({
        user_id: GRI_USER_ID,
        vocabulary_id: data.vocabulary_id
      });
      if (ins.error) {
        // duplicate key → zaten kayıtlı
        if (ins.error.code === '23505' || (ins.error.message || '').toLowerCase().indexOf('duplicate') !== -1) {
          btn.textContent = 'Zaten Kayıtlı ✓';
          btn.classList.add('saved');
          return;
        }
        throw ins.error;
      }
      btn.textContent = 'Kayıtlı ✓';
      btn.classList.add('saved');
    } catch (e) {
      console.warn('[SATCamp] vocab save fail:', e);
      btn.textContent = 'Hata';
      setTimeout(function () { btn.textContent = origText; btn.disabled = false; }, 2000);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // -----------------------------------------------------------
  // Griye Sor — soru.html ile aynı edge function (gri-ask)
  // Kamp soruları DB'de yok. Backend `inline_question` payload'unu
  // okur ve onun verisinden prompt kurar. ai_question_usage cache'i
  // slug'dan deterministik UUID ile çalışır (feature='gri-ask-camp').
  // -----------------------------------------------------------
  async function openAskModal() {
    if (!GRI_USER_ID) { loginRedirect(); return; }
    document.getElementById('scAskPrompt').value = '';
    document.getElementById('scAskResponse').innerHTML = '';
    var fb = document.getElementById('scAskFeedback');
    fb.textContent = ''; fb.className = 'sc-modal-feedback';
    openModal('scAskModal');
  }

  async function submitAsk() {
    var prompt = document.getElementById('scAskPrompt').value.trim();
    var fb = document.getElementById('scAskFeedback');
    var resp = document.getElementById('scAskResponse');
    var btn = document.getElementById('scAskSubmit');
    if (!prompt) { fb.textContent = 'Bir şey sor.'; fb.className = 'sc-modal-feedback error'; return; }
    btn.disabled = true; btn.textContent = 'Soruluyor...';
    resp.innerHTML = '';
    fb.textContent = ''; fb.className = 'sc-modal-feedback';

    try {
      var sess = await sb.auth.getSession();
      var token = sess && sess.data && sess.data.session && sess.data.session.access_token;
      if (!token) { fb.textContent = 'Oturum yenilenmeli, tekrar giriş yap.'; fb.className = 'sc-modal-feedback error'; btn.disabled = false; btn.textContent = 'Sor'; return; }

      var mod = window.MODULES[window.currentModule];
      var q = mod.questions[window.currentQ];
      var payload = {
        question_slug: currentSlug,
        user_prompt: prompt,
        inline_question: {
          passage: q.p || '',
          data: q.data || '',
          question: q.q || '',
          options: q.o || [],
          correct: q.a,
          source: 'sat-' + TRACK + '-kamp-day-' + DAY
        }
      };

      var r = await fetch(SUPABASE_URL + '/functions/v1/gri-ask', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      var data = await r.json();
      // Edge function henüz inline_question desteklemiyorsa açık mesaj
      if (data && data.error === 'missing_fields') {
        fb.textContent = 'Griye Sor henüz aktif değil. Sistem yöneticisi edge function güncellemesini yapmalı.';
        fb.className = 'sc-modal-feedback error';
        return;
      }
      // Kota tükendi durumu
      if (!r.ok && data && data.error === 'quota_exhausted') {
        var packsHtml = '';
        if (data.packs && data.packs.length) {
          packsHtml = '<div class="sc-ask-packs">' + data.packs.map(function (p) {
            return '<a href="' + p.url + '" target="_blank" rel="noopener" class="sc-ask-pack">' + escapeHtml(p.name) + ' — ₺' + p.price + '</a>';
          }).join('') + '</div>';
        }
        resp.innerHTML = '<div class="sc-ask-bubble sc-ask-empty"><strong>Günlük kotanı kullandın.</strong> Daha fazla soru sormak için paket alabilir veya yarını bekleyebilirsin.' + packsHtml + '</div>';
        return;
      }
      if (!r.ok) {
        var msg = (data && data.error) || 'Hata oluştu (kod ' + r.status + ').';
        fb.textContent = msg;
        fb.className = 'sc-modal-feedback error';
        return;
      }
      // Cevabı turns dizisinin SON elemanından çek
      var answer = '';
      if (data && Array.isArray(data.turns) && data.turns.length) {
        var lastTurn = data.turns[data.turns.length - 1];
        answer = lastTurn && lastTurn.ai_response ? String(lastTurn.ai_response) : '';
      }
      // Eski format fallback
      if (!answer && data) {
        answer = data.answer || data.text || data.response || '';
      }
      if (!answer) {
        fb.textContent = 'Boş cevap döndü, tekrar dener misin?';
        fb.className = 'sc-modal-feedback error';
        return;
      }
      // Quota bilgisini minik bir notla göster
      var quotaNote = '';
      var remainingQuota = null;
      if (data && typeof data.remaining === 'number') {
        remainingQuota = data.remaining;
      } else if (data && data.quota && typeof data.quota.total_remaining === 'number') {
        remainingQuota = data.quota.total_remaining;
      }
      if (remainingQuota !== null) {
        quotaNote = '<div class="sc-ask-quota">' + remainingQuota + ' soru hakkın kaldı.</div>';
      }
      resp.innerHTML = '<div class="sc-ask-bubble">' + escapeHtml(answer).replace(/\n/g, '<br>') + '</div>' + quotaNote;
    } catch (e) {
      fb.textContent = 'Bağlantı hatası: ' + (e.message || '');
      fb.className = 'sc-modal-feedback error';
    } finally {
      btn.disabled = false; btn.textContent = 'Sor';
    }
  }

  // -----------------------------------------------------------
  // QCard observer — her yeni soru render olduğunda toolbar ekle
  // -----------------------------------------------------------
  function hookIntoCard() {
    var card = document.getElementById('qcard');
    if (!card) return;

    var observer = new MutationObserver(function () {
      injectToolbar();
    });
    observer.observe(card, { childList: true });

    // İlk açılışta da ekle
    injectToolbar();
  }

  function injectToolbar() {
    var card = document.getElementById('qcard');
    if (!card) return;
    // Eğer içeride zaten toolbar varsa skip
    if (card.querySelector('#scToolbar')) {
      onQuestionReady();
      return;
    }
    if (!card.innerHTML.trim()) return; // boş card, henüz render olmamış

    card.insertAdjacentHTML('afterbegin', TOOLBAR_HTML);
    bindToolbarButtons();
    onQuestionReady();
  }

  function bindToolbarButtons() {
    var bk = document.getElementById('scBookmarkBtn');
    var nt = document.getElementById('scNoteBtn');
    var vc = document.getElementById('scVocabBtn');
    var ak = document.getElementById('scAskBtn');
    var rp = document.getElementById('scReportBtn');
    if (bk && !bk.dataset.bound) { bk.addEventListener('click', toggleBookmark); bk.dataset.bound = '1'; }
    if (nt && !nt.dataset.bound) { nt.addEventListener('click', openNoteModal); nt.dataset.bound = '1'; }
    if (vc && !vc.dataset.bound) { vc.addEventListener('click', openVocab); vc.dataset.bound = '1'; }
    if (ak && !ak.dataset.bound) { ak.addEventListener('click', openAskModal); ak.dataset.bound = '1'; }
    if (rp && !rp.dataset.bound) { rp.addEventListener('click', openReportModal); rp.dataset.bound = '1'; }
  }

  async function onQuestionReady() {
    currentSlug = computeSlug();
    currentVocab = readCurrentVocab();
    attachOptionElimination();
    await loadBookmark();
    await loadNote();
  }

  // -----------------------------------------------------------
  // Şık eleme — sağ tık (desktop) veya basılı tutma (mobil)
  // .opt'a .eliminated class'ı toggle eder. .sel ise (cevap seçilmişse)
  // çalışmaz. Soru değişince renderQuestion innerHTML'i tazelediği için
  // eleme durumu otomatik sıfırlanır.
  // -----------------------------------------------------------
  function attachOptionElimination() {
    var card = document.getElementById('qcard');
    if (!card) return;
    var opts = card.querySelectorAll('.opt');
    opts.forEach(function (opt) {
      if (opt.dataset.elimBound) return;
      opt.dataset.elimBound = '1';

      opt.addEventListener('contextmenu', function (e) {
        if (opt.classList.contains('sel')) return;
        e.preventDefault();
        opt.classList.toggle('eliminated');
      });

      var pressTimer = null;
      opt.addEventListener('touchstart', function () {
        if (opt.classList.contains('sel')) return;
        pressTimer = setTimeout(function () {
          opt.classList.toggle('eliminated');
          pressTimer = null;
        }, 500);
      }, { passive: true });
      var clearPress = function () {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      };
      opt.addEventListener('touchend', clearPress);
      opt.addEventListener('touchmove', clearPress);
      opt.addEventListener('touchcancel', clearPress);
    });
  }

  // -----------------------------------------------------------
  // Altını çizme — passage veya qstem içinde metin seçimi olduğunda
  // floating button gösterir, tıklayınca seçimi <mark class="sc-hl"> ile
  // sarar. Mevcut highlight'a tıklayınca silinir. Persistence yok,
  // soru değişince DOM resetlendiği için temizlenir.
  // -----------------------------------------------------------
  var hlBtn = null;

  function ensureHighlightButton() {
    if (hlBtn) return hlBtn;
    hlBtn = document.createElement('button');
    hlBtn.id = 'sc-hl-btn';
    hlBtn.type = 'button';
    hlBtn.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9 11l-4 4 1.5 1.5L11 12"/><path d="M14 8l-3 3 4 4 3-3z"/><path d="M5 19l3-3"/>' +
      '</svg><span>Altını Çiz</span>';
    hlBtn.setAttribute('aria-label', 'Seçili metni altını çiz');
    // mousedown propagasyonu seçimi kaybetmesin
    hlBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    hlBtn.addEventListener('click', applyHighlight);
    document.body.appendChild(hlBtn);
    return hlBtn;
  }

  function getHighlightableRoot(node) {
    if (!node) return null;
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return null;
    return el.closest('.passage, .qstem');
  }

  function positionHighlightButton(range) {
    if (!hlBtn) return;
    var rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) { hlBtn.style.display = 'none'; return; }
    var btnH = hlBtn.offsetHeight || 30;
    var btnW = hlBtn.offsetWidth || 100;
    var top = rect.top + window.scrollY - btnH - 8;
    // Ekran üst kenarına yakınsa altına geç
    if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 8;
    var left = rect.left + window.scrollX + (rect.width / 2) - (btnW / 2);
    left = Math.max(8, Math.min(left, window.innerWidth + window.scrollX - btnW - 8));
    hlBtn.style.top = top + 'px';
    hlBtn.style.left = left + 'px';
  }

  function handleSelectionForHighlight() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      if (hlBtn) hlBtn.style.display = 'none';
      return;
    }
    var range = sel.getRangeAt(0);
    var startRoot = getHighlightableRoot(range.startContainer);
    var endRoot = getHighlightableRoot(range.endContainer);
    if (!startRoot || startRoot !== endRoot) {
      if (hlBtn) hlBtn.style.display = 'none';
      return;
    }
    ensureHighlightButton();
    hlBtn.style.display = 'inline-flex';
    positionHighlightButton(range);
  }

  function applyHighlight() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    try {
      var mark = document.createElement('mark');
      mark.className = 'sc-hl';
      range.surroundContents(mark);
      sel.removeAllRanges();
      if (hlBtn) hlBtn.style.display = 'none';
    } catch (e) {
      // Cross-element boundary (örn. seçim <em>'in içinden başlayıp dışında bitiyor)
      console.warn('[SATCamp] highlight cross-boundary, ignored');
    }
  }

  function handleHighlightClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var mark = t.closest('mark.sc-hl');
    if (!mark) return;
    var parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  function setupHighlightSelection() {
    document.addEventListener('selectionchange', handleSelectionForHighlight);
    document.addEventListener('click', handleHighlightClick);
  }

  // -----------------------------------------------------------
  // Init
  // -----------------------------------------------------------
  function init() {
    // Modal'ları body'ye ekle
    document.body.insertAdjacentHTML('beforeend', MODALS_HTML);

    // Modal kapama event'leri
    document.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', function () { closeModal(el.getAttribute('data-close')); });
    });
    var ov = document.getElementById('scOverlay');
    if (ov) ov.addEventListener('click', closeAllModals);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });

    // Form button event'leri
    var ns = document.getElementById('scNoteSubmit');
    var nd = document.getElementById('scNoteDelete');
    var ne = document.getElementById('scNoteText');
    var rs = document.getElementById('scReportSubmit');
    var as = document.getElementById('scAskSubmit');
    if (ns) ns.addEventListener('click', submitNote);
    if (nd) nd.addEventListener('click', deleteNote);
    if (ne) ne.addEventListener('input', updateNoteCounter);
    if (rs) rs.addEventListener('click', submitReport);
    if (as) as.addEventListener('click', submitAsk);

    // Sözlük: Listeme Ekle butonlarını event delegation ile yakala
    var vList = document.getElementById('scVocabList');
    if (vList) {
      vList.addEventListener('click', function (e) {
        var b = e.target.closest('[data-vocab-save]');
        if (!b) return;
        e.preventDefault();
        saveVocabWord(b.getAttribute('data-vocab-save'), b);
      });
    }

    loadUser().then(hookIntoCard);
    setupHighlightSelection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.SATCamp = { sb: sb, get user() { return GRI_USER_ID; }, get slug() { return currentSlug; } };
})();
