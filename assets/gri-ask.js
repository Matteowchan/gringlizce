/* ============================================================================
   GRI-ASK — Frontend module (4th column panel)
   ============================================================================
   Açıklama panelinin yanına yeni bir kolon ekler.
   - Sadece Gri açık → 3 kolon
   - Açıklama + Gri açık → 4 kolon
   - Mobilde → tek kolon
   ============================================================================ */

(function () {
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var GRI_ENDPOINT = SUPABASE_URL + '/functions/v1/gri-ask';
  var TURN_LIMIT = 2;

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[Gri] supabase-js yok');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  /* ===== CSS injection ===== */
  var css = [
    '.q-grid.show-gri:not(.show-explanation) { grid-template-columns: 1fr 1fr 1fr; }',
    '.q-grid.show-explanation.show-gri { grid-template-columns: 1fr 1fr 1fr 1fr; }',
    '@media (max-width: 1000px) {',
    '  .q-grid.show-gri, .q-grid.show-explanation.show-gri { grid-template-columns: 1fr; }',
    '}',
    '.q-btn.gri-trigger-btn { gap: 0.4rem; }',
    '.gri-trigger-btn .gri-trigger-icon {',
    '  width: 18px; height: 18px; border-radius: 50%;',
    '  display: inline-block; vertical-align: middle; flex-shrink: 0;',
    '}',
    '.q-gri {',
    '  display: none;',
    '  background: var(--bg-card);',
    '  border: 1px solid var(--line);',
    '  border-radius: 8px;',
    '  padding: 1.5rem 1.8rem;',
    '}',
    '.q-grid.show-gri .q-gri { display: block; }',
    '@media (max-width: 1000px) { .q-gri { padding: 1.3rem 1.4rem; } }',
    '.gri-head {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  gap: 0.6rem; margin-bottom: 1.5rem;',
    '}',
    '.gri-head-title {',
    '  display: flex; align-items: center; gap: 0.65rem;',
    '  min-width: 0; flex: 1;',
    '}',
    '.gri-head-title img {',
    '  width: 36px; height: 36px; border-radius: 50%;',
    '  flex-shrink: 0; border: 1px solid var(--line);',
    '}',
    '.gri-head-text { min-width: 0; }',
    '.gri-head h3 {',
    '  font-family: var(--font-display);',
    '  font-size: 1.3rem; margin: 0; line-height: 1.15;',
    '}',
    '.gri-head .gri-quota {',
    '  margin: 0.15rem 0 0;',
    '  font-family: var(--font-ui);',
    '  font-size: 0.75rem; letter-spacing: 0.08em;',
    '  color: var(--text-muted); text-transform: uppercase;',
    '}',
    '.gri-head .gri-close {',
    '  background: none; border: none; cursor: pointer;',
    '  font-size: 1.6rem; line-height: 1;',
    '  color: var(--text-muted); padding: 0 0.3rem; flex-shrink: 0;',
    '}',
    '.gri-head .gri-close:hover { color: var(--text); }',
    '.gri-body { display: flex; flex-direction: column; gap: 1rem; }',
    '.gri-prompt-area textarea {',
    '  width: 100%; box-sizing: border-box;',
    '  background: var(--bg-soft, var(--bg));',
    '  border: 1px solid var(--line); color: var(--text);',
    '  padding: 0.7rem 0.85rem; font-size: 0.95rem;',
    '  font-family: Georgia, "Times New Roman", serif;',
    '  min-height: 90px; resize: vertical; border-radius: 4px;',
    '}',
    '.gri-prompt-area textarea:focus { outline: none; border-color: var(--teal, #2a7a7a); }',
    '.gri-prompt-area .gri-prompt-hint {',
    '  font-size: 0.78rem; color: var(--text-muted);',
    '  margin: 0.4rem 0 0; font-style: italic;',
    '}',
    '.gri-prompt-area .gri-send {',
    '  display: block; margin-top: 0.8rem; width: 100%;',
    '  padding: 0.8rem 1rem;',
    '  background: var(--teal, #2a7a7a); color: var(--bg-card, #fff);',
    '  border: none; cursor: pointer;',
    '  font-family: var(--font-ui); font-size: 12px;',
    '  letter-spacing: 0.15em; text-transform: uppercase;',
    '  font-weight: 600; border-radius: 4px;',
    '}',
    '.gri-prompt-area .gri-send:hover { opacity: 0.92; }',
    '.gri-prompt-area .gri-send:disabled { opacity: 0.5; cursor: not-allowed; }',
    '.gri-loading { text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); }',
    '.gri-loading-dots { display: inline-block; }',
    '.gri-loading-dots span {',
    '  display: inline-block; width: 6px; height: 6px;',
    '  background: var(--text-muted); border-radius: 50%;',
    '  margin: 0 2px; animation: gri-bounce 1.2s infinite ease-in-out;',
    '}',
    '.gri-loading-dots span:nth-child(2) { animation-delay: 0.15s; }',
    '.gri-loading-dots span:nth-child(3) { animation-delay: 0.3s; }',
    '@keyframes gri-bounce {',
    '  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }',
    '  40% { opacity: 1; transform: translateY(-6px); }',
    '}',
    '.gri-msg-user, .gri-msg-ai {',
    '  padding: 0.85rem 1rem; line-height: 1.55;',
    '  font-size: 0.94rem; border-radius: 4px;',
    '}',
    '.gri-msg-user {',
    '  background: var(--bg-soft, var(--bg));',
    '  border-left: 3px solid var(--text-muted);',
    '  font-style: italic;',
    '}',
    '.gri-msg-ai {',
    '  background: var(--bg-card);',
    '  border: 1px solid var(--line);',
    '  border-left: 3px solid var(--teal, #2a7a7a);',
    '  white-space: pre-wrap;',
    '}',
    '.gri-msg-label {',
    '  font-family: var(--font-ui); font-size: 10px;',
    '  letter-spacing: 0.15em; text-transform: uppercase;',
    '  color: var(--text-muted); margin-bottom: 0.35rem;',
    '  display: block; font-weight: 600;',
    '}',
    '.gri-cached-note {',
    '  font-size: 0.82rem; color: var(--text-muted);',
    '  font-style: italic; text-align: center;',
    '  padding: 0.6rem; background: var(--bg-soft, var(--bg));',
    '  border-radius: 4px;',
    '}',
    '.gri-paywall { text-align: center; padding: 0.5rem; }',
    '.gri-paywall h4 {',
    '  font-family: var(--font-display); font-size: 1.2rem; margin: 0.5rem 0;',
    '}',
    '.gri-paywall p { color: var(--text-muted); margin: 0 0 1rem; font-size: 0.9rem; }',
    '.gri-packs { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem; }',
    '.gri-pack {',
    '  display: flex; justify-content: space-between; align-items: center;',
    '  padding: 0.75rem 0.9rem;',
    '  background: var(--bg-card); border: 1px solid var(--line);',
    '  text-decoration: none; color: var(--text); border-radius: 4px;',
    '  transition: border-color 0.15s, background 0.15s;',
    '}',
    '.gri-pack:hover { border-color: var(--teal, #2a7a7a); background: var(--bg-soft, var(--bg)); }',
    '.gri-pack-name { font-weight: 600; font-size: 0.92rem; }',
    '.gri-pack-price { font-family: var(--font-display); font-size: 1.05rem; color: var(--teal, #2a7a7a); }',
    '.gri-error {',
    '  padding: 0.85rem; background: rgba(196,68,68,0.08);',
    '  border-left: 3px solid #c44; color: #c44;',
    '  font-size: 0.9rem; border-radius: 4px;',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ===== Panel oluşturma ===== */
  function buildPanel() {
    var grid = document.getElementById('qGrid');
    if (!grid) return null;
    var existing = document.getElementById('qGri');
    if (existing) return existing;

    var panel = document.createElement('aside');
    panel.className = 'q-gri';
    panel.id = 'qGri';
    panel.setAttribute('aria-label', "Gri'ye Sor paneli");
    panel.innerHTML = [
      '<div class="gri-head">',
      '  <div class="gri-head-title">',
      '    <img src="assets/gri-mascot.png" alt="">',
      '    <div class="gri-head-text">',
      '      <h3>Gri\'ye Sor</h3>',
      '      <p class="gri-quota" id="gri-quota-text">Yükleniyor...</p>',
      '    </div>',
      '  </div>',
      '  <button class="gri-close" id="gri-close" aria-label="Kapat">×</button>',
      '</div>',
      '<div class="gri-body" id="gri-body"></div>'
    ].join('\n');
    grid.appendChild(panel);

    document.getElementById('gri-close').addEventListener('click', closePanel);
    return panel;
  }

  function setBody(html) {
    var el = document.getElementById('gri-body');
    if (el) el.innerHTML = html;
  }
  function setQuotaText(text) {
    var el = document.getElementById('gri-quota-text');
    if (el) el.textContent = text;
  }
  function openPanel() {
    var grid = document.getElementById('qGrid');
    if (grid) grid.classList.add('show-gri');
  }
  function closePanel() {
    var grid = document.getElementById('qGrid');
    if (grid) grid.classList.remove('show-gri');
  }

  /* ===== Render ===== */
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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

  function renderPromptState(remaining, turnsSoFar, prevTurns) {
    setQuotaText('Kalan hak: ' + remaining);
    var turnsLeft = TURN_LIMIT - (turnsSoFar || 0);
    var prevHtml = (prevTurns && prevTurns.length) ? renderTurnsHtml(prevTurns) : '';
    setBody([
      prevHtml,
      '<div class="gri-prompt-area">',
      '  <textarea id="gri-prompt-input" placeholder="Bu soru hakkında ne sormak istersin? Örnek: B seçeneği neden yanlış?" maxlength="1000"></textarea>',
      '  <p class="gri-prompt-hint">Bu soru için Gri\'ye ' + turnsLeft + ' kez ' + (turnsSoFar ? 'daha ' : '') + 'danışabilirsin (toplam ' + TURN_LIMIT + ' hak).</p>',
      '  <button class="gri-send" id="gri-send">Gri\'ye Sor</button>',
      '</div>'
    ].join(''));

    var sendBtn = document.getElementById('gri-send');
    if (sendBtn) sendBtn.addEventListener('click', submitMessage);
    var inp = document.getElementById('gri-prompt-input');
    if (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitMessage();
      });
      setTimeout(function () { inp.focus(); }, 80);
    }
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
      var turnsLeft = TURN_LIMIT - turns.length;
      pieces.push([
        '<div class="gri-prompt-area">',
        '  <textarea id="gri-prompt-input" placeholder="Başka bir şey sormak ister misin?" maxlength="1000"></textarea>',
        '  <p class="gri-prompt-hint">Bu soru için ' + turnsLeft + ' kez daha danışabilirsin.</p>',
        '  <button class="gri-send" id="gri-send">Tekrar Sor</button>',
        '</div>'
      ].join(''));
    } else if (turns.length >= TURN_LIMIT) {
      pieces.push('<div class="gri-cached-note">Bu soru için ' + TURN_LIMIT + ' hakkın da kullanıldı. Yeni sorulara geçebilirsin.</div>');
    } else if (data.remaining === 0) {
      pieces.push('<div class="gri-cached-note">AI sorgu hakkın bitti.</div>');
    }

    setBody(pieces.join(''));

    if (canAskMore) {
      var sendBtn = document.getElementById('gri-send');
      if (sendBtn) sendBtn.addEventListener('click', submitMessage);
      var inp = document.getElementById('gri-prompt-input');
      if (inp) {
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitMessage();
        });
      }
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
      '  <p>Daha fazla soru için paket al. Ödeme sonrası hak otomatik tanımlanır.</p>',
      '  <div class="gri-packs">', packHtml, '</div>',
      '</div>'
    ].join(''));
  }

  function renderErrorState(msg) {
    setBody('<div class="gri-error">' + escapeHtml(msg) + '</div>');
  }

  /* ===== Networking ===== */
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
        var msg = (data && data.error) || ('HTTP ' + res.status);
        renderErrorState('Bir sorun oluştu: ' + msg);
        return;
      }

      renderResponseState(data);
    } catch (e) {
      console.error('[Gri] submit failed:', e);
      renderErrorState('Ağ hatası. İnternet bağlantını kontrol et.');
    }
  }

  /* ===== State load ===== */
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

      if (turns.length >= TURN_LIMIT) {
        renderResponseState({ turns: turns, remaining: remaining, can_ask_more: false });
        return;
      }

      if (turns.length > 0) {
        if (remaining <= 0) {
          renderResponseState({ turns: turns, remaining: 0, can_ask_more: false });
          return;
        }
        renderResponseState({ turns: turns, remaining: remaining, can_ask_more: true });
        return;
      }

      if (remaining <= 0) {
        renderPaywallState([
          { name: '10 Soru Paketi', price: 100, url: 'https://www.shopier.com/SATquestionBank/47230429' },
          { name: '25 Soru Paketi', price: 225, url: 'https://www.shopier.com/SATquestionBank/47230479' },
          { name: '50 Soru Paketi', price: 425, url: 'https://www.shopier.com/SATquestionBank/47230505' },
        ]);
        return;
      }

      renderPromptState(remaining, 0, null);
    } catch (e) {
      console.error('[Gri] state load failed:', e);
      renderErrorState('Veriler yüklenemedi.');
    }
  }

  /* ===== Trigger butonu ===== */
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
      buildPanel();
      openPanel();
      loadStateForCurrentQuestion();
    });

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
    if (ensureTrigger()) return;
    var observer = new MutationObserver(function () {
      if (ensureTrigger()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 10000);
  }

  // Soru değiştiğinde Gri panelini kapat
  window.addEventListener('gri-question-change', function () {
    closePanel();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
