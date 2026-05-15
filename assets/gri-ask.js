/* ============================================================================
   GRI-ASK — Frontend module
   ============================================================================
   soru.html sayfasında çalışır.
   - Açıklama paneline (.exp-head içine) "Gri'ye Sor" butonu enjekte eder
   - Tıklanınca modal açar, kullanıcı sorusunu yazar, gri-ask Edge Function'a gönderir
   - Cevabı modalda gösterir
   - Quota bittiğinde paket alma ekranı gösterir
   - Aynı soru için zaten danışıldıysa cached cevabı gösterir, quota düşürmez

   Sayfanın renderQuestion() fonksiyonu her yeni soru render ettiğinde
   window.GriCurrentQuestion = { id: q.id } set etmeli; aksi halde buton bilgi
   bulamaz ve devre dışı kalır.
   ============================================================================ */

(function () {
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var GRI_ENDPOINT = SUPABASE_URL + '/functions/v1/gri-ask';

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[Gri] supabase-js yok');
    return;
  }

  // site-config.js'in zaten oluşturduğu client'ı kullanma yerine kendi client'ımızı yarat
  // (anon key için site-config.js'deki sabit değeri kullanıyoruz)
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  /* ===== CSS injection ===== */
  var css = `
    .gri-trigger-btn .gri-trigger-icon {
      width: 18px; height: 18px;
      border-radius: 50%;
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .q-btn.gri-trigger-btn { gap: 0.4rem; }

    .gri-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: none; align-items: center; justify-content: center;
      z-index: 10000; padding: 1rem;
    }
    .gri-overlay.show { display: flex; }
    .gri-modal {
      background: var(--bg, #fff); color: var(--text, #222);
      border: 1px solid var(--line, #ddd);
      width: 100%; max-width: 560px; max-height: 86vh;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    .gri-modal-head {
      display: flex; align-items: center; gap: 0.9rem;
      padding: 1rem 1.2rem;
      border-bottom: 1px solid var(--line, #ddd);
    }
    .gri-modal-head img.gri-mascot {
      width: 44px; height: 44px; border-radius: 50%;
      border: 1px solid var(--line, #ddd);
      flex-shrink: 0;
    }
    .gri-modal-title {
      flex: 1; min-width: 0;
    }
    .gri-modal-title h3 {
      margin: 0; font-family: var(--font-display); font-size: 1.25rem;
      line-height: 1.2;
    }
    .gri-modal-title .gri-quota {
      margin: 0.15rem 0 0; font-size: 0.8rem;
      color: var(--text-muted, #666);
      font-family: var(--font-ui); letter-spacing: 0.05em;
    }
    .gri-modal-close {
      background: none; border: none; cursor: pointer;
      font-size: 1.6rem; line-height: 1;
      color: var(--text-muted, #666); padding: 0 0.3rem;
    }
    .gri-modal-close:hover { color: var(--text, #222); }

    .gri-modal-body {
      flex: 1; overflow-y: auto;
      padding: 1.2rem 1.4rem;
      display: flex; flex-direction: column; gap: 1rem;
    }

    .gri-prompt-area textarea {
      width: 100%; box-sizing: border-box;
      background: var(--bg-soft, #f5f5f5);
      border: 1px solid var(--line, #ddd);
      color: var(--text, #222);
      padding: 0.7rem 0.85rem; font-size: 0.95rem;
      font-family: var(--font-body);
      min-height: 90px; resize: vertical;
    }
    .gri-prompt-area textarea:focus { outline: none; border-color: var(--teal, #2a7a7a); }
    .gri-prompt-area .gri-prompt-hint {
      font-size: 0.78rem; color: var(--text-muted, #666);
      margin: 0.4rem 0 0; font-style: italic;
    }
    .gri-prompt-area .gri-send {
      display: block; margin-top: 0.8rem;
      width: 100%; padding: 0.8rem 1rem;
      background: var(--teal, #2a7a7a); color: var(--bg, #fff);
      border: none; cursor: pointer;
      font-family: var(--font-ui); font-size: 12px;
      letter-spacing: 0.15em; text-transform: uppercase;
      font-weight: 600;
    }
    .gri-prompt-area .gri-send:hover { opacity: 0.92; }
    .gri-prompt-area .gri-send:disabled { opacity: 0.5; cursor: not-allowed; }

    .gri-loading {
      text-align: center; padding: 2rem 1rem;
      color: var(--text-muted, #666);
    }
    .gri-loading-dots { display: inline-block; }
    .gri-loading-dots span {
      display: inline-block; width: 6px; height: 6px;
      background: var(--text-muted, #666); border-radius: 50%;
      margin: 0 2px; animation: gri-bounce 1.2s infinite ease-in-out;
    }
    .gri-loading-dots span:nth-child(2) { animation-delay: 0.15s; }
    .gri-loading-dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes gri-bounce {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-6px); }
    }

    .gri-msg-user, .gri-msg-ai {
      padding: 0.85rem 1rem; line-height: 1.55;
      font-size: 0.95rem;
    }
    .gri-msg-user {
      background: var(--bg-soft, #f5f5f5);
      border-left: 3px solid var(--text-muted, #999);
      font-style: italic;
    }
    .gri-msg-ai {
      background: var(--bg-card, #fff);
      border-left: 3px solid var(--teal, #2a7a7a);
      white-space: pre-wrap;
    }
    .gri-msg-label {
      font-family: var(--font-ui); font-size: 10px;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--text-muted, #666); margin-bottom: 0.3rem;
      display: block;
    }
    .gri-cached-note {
      font-size: 0.82rem; color: var(--text-muted, #666);
      font-style: italic; text-align: center;
      padding: 0.5rem; background: var(--bg-soft, #f5f5f5);
    }

    .gri-paywall {
      text-align: center; padding: 0.5rem;
    }
    .gri-paywall h4 {
      font-family: var(--font-display); font-size: 1.3rem;
      margin: 0.5rem 0;
    }
    .gri-paywall p { color: var(--text-muted, #666); margin: 0 0 1rem; }
    .gri-packs {
      display: flex; flex-direction: column; gap: 0.6rem;
      margin-top: 1rem;
    }
    .gri-pack {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.85rem 1rem;
      background: var(--bg-card, #fff);
      border: 1px solid var(--line, #ddd);
      text-decoration: none; color: var(--text, #222);
      transition: border-color 0.15s, background 0.15s;
    }
    .gri-pack:hover { border-color: var(--teal, #2a7a7a); background: var(--bg-soft, #f5f5f5); }
    .gri-pack-name { font-weight: 600; }
    .gri-pack-price {
      font-family: var(--font-display);
      font-size: 1.1rem; color: var(--teal, #2a7a7a);
    }

    .gri-error {
      padding: 0.85rem; background: rgba(196,68,68,0.08);
      border-left: 3px solid #c44; color: #c44;
      font-size: 0.9rem;
    }
  `;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ===== Modal HTML ===== */
  function buildModal() {
    var overlay = document.createElement('div');
    overlay.className = 'gri-overlay';
    overlay.id = 'gri-overlay';
    overlay.innerHTML = [
      '<div class="gri-modal" role="dialog" aria-label="Gri ye Sor">',
      '  <div class="gri-modal-head">',
      '    <img class="gri-mascot" src="assets/gri-mascot.png" alt="Gri">',
      '    <div class="gri-modal-title">',
      '      <h3>Gri\'ye Sor</h3>',
      '      <p class="gri-quota" id="gri-quota-text">Kalan hak yükleniyor...</p>',
      '    </div>',
      '    <button class="gri-modal-close" id="gri-modal-close" aria-label="Kapat">×</button>',
      '  </div>',
      '  <div class="gri-modal-body" id="gri-modal-body"></div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.getElementById('gri-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) closeModal();
    });

    return overlay;
  }

  function setBody(html) {
    document.getElementById('gri-modal-body').innerHTML = html;
  }
  function setQuotaText(text) {
    var el = document.getElementById('gri-quota-text');
    if (el) el.textContent = text;
  }

  function openModal() {
    document.getElementById('gri-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    document.getElementById('gri-overlay').classList.remove('show');
    document.body.style.overflow = '';
  }

  /* ===== States ===== */
  function renderPromptState(remaining, turnsSoFar) {
    setQuotaText('Kalan hak: ' + remaining);
    var turnsLeft = 2 - (turnsSoFar || 0);
    var prevConversationHtml = '';
    if (turnsSoFar && turnsSoFar > 0 && window.GriPrevTurns) {
      prevConversationHtml = renderTurnsHtml(window.GriPrevTurns);
    }
    setBody([
      prevConversationHtml,
      '<div class="gri-prompt-area">',
      '  <textarea id="gri-prompt-input" placeholder="Bu soru hakkında ne sormak istersin? Örnek: B seçeneği neden yanlış?" maxlength="1000"></textarea>',
      '  <p class="gri-prompt-hint">Bu soru için Gri\'ye ' + turnsLeft + ' kez daha danışabilirsin (toplam 2 hak).</p>',
      '  <button class="gri-send" id="gri-send">Gri\'ye Sor</button>',
      '</div>'
    ].join(''));

    document.getElementById('gri-send').addEventListener('click', submitMessage);
    document.getElementById('gri-prompt-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitMessage();
    });
    setTimeout(function () {
      var inp = document.getElementById('gri-prompt-input');
      if (inp) inp.focus();
    }, 80);
  }

  function renderTurnsHtml(turns) {
    if (!turns || !turns.length) return '';
    return turns.map(function (t, i) {
      return [
        '<div class="gri-msg-user"><span class="gri-msg-label">Sen #', (i + 1), '</span>', escapeHtml(t.user_message || ''), '</div>',
        '<div class="gri-msg-ai"><span class="gri-msg-label">Gri #', (i + 1), '</span>', escapeHtml(t.ai_response || ''), '</div>'
      ].join('');
    }).join('');
  }

  function renderLoadingState() {
    setBody([
      '<div class="gri-loading">',
      '  <p>Gri düşünüyor</p>',
      '  <div class="gri-loading-dots"><span></span><span></span><span></span></div>',
      '</div>'
    ].join(''));
  }

  function renderResponseState(data) {
    setQuotaText('Kalan hak: ' + (data.remaining != null ? data.remaining : '?'));
    var turns = data.turns || [];
    var canAskMore = data.can_ask_more && (data.remaining == null || data.remaining > 0);
    var pieces = [];

    pieces.push(renderTurnsHtml(turns));

    if (canAskMore) {
      var turnsLeft = 2 - turns.length;
      pieces.push([
        '<div class="gri-prompt-area">',
        '  <textarea id="gri-prompt-input" placeholder="Başka bir şey sormak ister misin?" maxlength="1000"></textarea>',
        '  <p class="gri-prompt-hint">Bu soru için ' + turnsLeft + ' kez daha danışabilirsin.</p>',
        '  <button class="gri-send" id="gri-send">Tekrar Sor</button>',
        '</div>'
      ].join(''));
    } else if (turns.length >= 2) {
      pieces.push('<div class="gri-cached-note">Bu soru için 2 hakkın da kullanıldı. Yeni sorulara geçebilirsin.</div>');
    } else if (data.remaining === 0) {
      pieces.push('<div class="gri-cached-note">AI sorgu hakkın bitti. Yeni paket alırsan bu soru için bir hak daha kullanabilirsin.</div>');
    }

    setBody(pieces.join(''));

    if (canAskMore) {
      document.getElementById('gri-send').addEventListener('click', submitMessage);
      document.getElementById('gri-prompt-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitMessage();
      });
    }
  }

  function renderPaywallState(packs) {
    setQuotaText('Kalan hak: 0');
    var packHtml = (packs || []).map(function (p) {
      return [
        '<a class="gri-pack" href="', escapeHtml(p.url), '" target="_blank" rel="noopener">',
        '  <span class="gri-pack-name">', escapeHtml(p.name), '</span>',
        '  <span class="gri-pack-price">₺', p.price, '</span>',
        '</a>'
      ].join('');
    }).join('');
    setBody([
      '<div class="gri-paywall">',
      '  <h4>AI sorgu hakkın bitti</h4>',
      '  <p>Daha fazla soru için aşağıdaki paketlerden birini al. Ödeme sonrası hak otomatik tanımlanır.</p>',
      '  <div class="gri-packs">', packHtml, '</div>',
      '</div>'
    ].join(''));
  }

  function renderErrorState(msg) {
    setBody('<div class="gri-error">' + escapeHtml(msg) + '</div>');
  }

  /* ===== Networking ===== */
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function submitMessage() {
    var inp = document.getElementById('gri-prompt-input');
    var btn = document.getElementById('gri-send');
    if (!inp) return;
    var message = inp.value.trim();
    if (!message) return;
    if (btn) btn.disabled = true;

    renderLoadingState();

    var qid = (window.GriCurrentQuestion && window.GriCurrentQuestion.id) || null;
    if (!qid) {
      renderErrorState('Soru bilgisi alınamadı. Sayfayı yenile ve tekrar dene.');
      return;
    }

    try {
      var sessionRes = await sb.auth.getSession();
      var session = sessionRes && sessionRes.data && sessionRes.data.session;
      if (!session) {
        renderErrorState('Giriş yapman gerekiyor. Önce hesabına gir, sonra tekrar dene.');
        return;
      }

      var res = await fetch(GRI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ question_id: qid, message: message }),
      });

      var data = null;
      try { data = await res.json(); } catch (e) { data = null; }

      if (res.status === 402 && data && data.error === 'quota_exhausted') {
        renderPaywallState(data.packs);
        return;
      }
      if (!res.ok || !data || data.ok === false) {
        var msg = (data && data.error) || ('Hata: HTTP ' + res.status);
        renderErrorState('Bir sorun oluştu. ' + msg);
        return;
      }

      renderResponseState(data);
    } catch (e) {
      console.error('[Gri] submit failed:', e);
      renderErrorState('Ağ hatası. İnternet bağlantını kontrol et.');
    }
  }

  /* ===== Önceden danışılmış mı? ===== */
  async function loadStateForCurrentQuestion() {
    var qid = (window.GriCurrentQuestion && window.GriCurrentQuestion.id) || null;
    if (!qid) {
      renderErrorState('Soru bilgisi alınamadı.');
      return;
    }

    try {
      var sessionRes = await sb.auth.getSession();
      var session = sessionRes && sessionRes.data && sessionRes.data.session;
      if (!session) {
        setQuotaText('Giriş gerekli');
        setBody([
          '<div class="gri-paywall">',
          '  <h4>Giriş gerekli</h4>',
          '  <p>Gri\'ye soru sormak için giriş yapmalısın.</p>',
          '  <a class="gri-pack" href="giris.html" style="justify-content:center;">',
          '    <span class="gri-pack-name">Giriş Yap</span>',
          '  </a>',
          '</div>'
        ].join(''));
        return;
      }

      var userId = session.user.id;
      var [turnsRes, quotaRes] = await Promise.all([
        sb.from('ai_question_usage')
          .select('user_message, ai_response, used_at')
          .eq('user_id', userId)
          .eq('question_id', qid)
          .order('used_at', { ascending: true }),
        sb.from('ai_quota')
          .select('total_quota, used_count')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      var turns = turnsRes.data || [];
      var remaining = 0;
      if (quotaRes.data) {
        remaining = Math.max(0, quotaRes.data.total_quota - quotaRes.data.used_count);
      }

      // 2 tur tamamlanmışsa sadece konuşmayı göster
      if (turns.length >= 2) {
        renderResponseState({
          turns: turns,
          remaining: remaining,
          can_ask_more: false,
        });
        return;
      }

      // En az 1 tur var, devam edebilir
      if (turns.length > 0) {
        if (remaining <= 0) {
          // Kotaya bağlı: ilk tur var ama yeni tur için hak yok
          renderResponseState({
            turns: turns,
            remaining: 0,
            can_ask_more: false,
          });
          return;
        }
        renderResponseState({
          turns: turns,
          remaining: remaining,
          can_ask_more: true,
        });
        return;
      }

      // Hiç tur yok, ilk soruyu sorabilir
      if (remaining <= 0) {
        renderPaywallState([
          { name: '10 Soru Paketi', price: 100, url: 'https://www.shopier.com/SATquestionBank/47230429' },
          { name: '25 Soru Paketi', price: 225, url: 'https://www.shopier.com/SATquestionBank/47230479' },
          { name: '50 Soru Paketi', price: 425, url: 'https://www.shopier.com/SATquestionBank/47230505' },
        ]);
        return;
      }

      renderPromptState(remaining, 0);
    } catch (e) {
      console.error('[Gri] state load failed:', e);
      renderErrorState('Veriler yüklenemedi.');
    }
  }

  /* ===== Trigger butonu enjeksiyonu ===== */
  function ensureTrigger() {
    var actions = document.querySelector('.q-actions');
    if (!actions) return false;
    if (actions.querySelector('.gri-trigger-btn')) return true;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'q-btn gri-trigger-btn';
    btn.id = 'griBtn';
    btn.setAttribute('aria-label', "Gri'ye Sor");
    btn.innerHTML = [
      '<img class="gri-trigger-icon" src="assets/gri-mascot.png" alt="">',
      '<span>Gri\'ye Sor</span>'
    ].join('');
    btn.addEventListener('click', function () {
      openModal();
      loadStateForCurrentQuestion();
    });

    // Açıklama butonunun hemen yanına ekle, yoksa sona
    var explainBtn = actions.querySelector('#explainBtn');
    if (explainBtn) {
      explainBtn.parentNode.insertBefore(btn, explainBtn.nextSibling);
    } else {
      actions.appendChild(btn);
    }
    return true;
  }

  /* ===== Init ===== */
  function init() {
    buildModal();

    // .exp-head zaten varsa hemen ekle
    if (ensureTrigger()) return;

    // Yoksa DOM bekle (dinamik render edilebilir)
    var observer = new MutationObserver(function () {
      if (ensureTrigger()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Güvenlik için 10 saniye sonra bırak
    setTimeout(function () { observer.disconnect(); }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
