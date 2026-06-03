#!/usr/bin/env python3
"""Gringlizce Faz 1.5 - App Home (anasayfa app modu)."""
import os, re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

# =====================================================================
# 1. App Hero HTML (index.html'e inject edilecek)
# =====================================================================

APP_HERO_HTML = '''<!-- ===================================================================
     APP HERO — sadece app modunda görünür
     =================================================================== -->
<section class="hero hero-app-mode">
  <div class="wrap">

    <div class="ah-greeting">
      <h1 id="ah-name">Hoş geldin</h1>
      <div class="ah-streak-row" id="ah-streak-row" style="display:none">
        <span class="ah-streak-pill">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2.5-2-3.5-2-6 2 1.5 4 3.5 4 7a6 6 0 0 1-12 0c0-5 6-6 6-10z"/></svg>
          <span id="ah-streak-num">0</span> günlük streak
        </span>
      </div>
    </div>

    <a href="#" class="ah-continue" id="ah-continue" style="display:none">
      <div class="ah-continue-eyebrow">Devam Et</div>
      <div class="ah-continue-title" id="ah-continue-title">—</div>
      <div class="ah-continue-meta" id="ah-continue-meta">—</div>
      <div class="ah-continue-arrow">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </a>

    <div class="ah-section-label">Hızlı Erişim</div>
    <div class="ah-quick-grid">
      <a href="/soru-bankasi.html" class="ah-card ah-c-teal">
        <div class="ah-card-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>
        </div>
        <div class="ah-card-content">
          <div class="ah-card-title">Soru Bankası</div>
          <div class="ah-card-sub">SAT · IELTS · TOEFL · YDT</div>
        </div>
      </a>

      <a href="/kelime-bankasi.html" class="ah-card ah-c-gold">
        <div class="ah-card-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 17h15"/></svg>
        </div>
        <div class="ah-card-content">
          <div class="ah-card-title">Kelime Bankası</div>
          <div class="ah-card-sub">200+ kelime</div>
        </div>
      </a>

      <a href="/yazi-pratigi.html" class="ah-card ah-c-coral">
        <div class="ah-card-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div class="ah-card-content">
          <div class="ah-card-title">Yazı Pratiği</div>
          <div class="ah-card-sub">IB · IELTS · TOEFL</div>
        </div>
      </a>

      <a href="/panelim.html" class="ah-card ah-c-purple">
        <div class="ah-card-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
        </div>
        <div class="ah-card-content">
          <div class="ah-card-title">Çalışma Masam</div>
          <div class="ah-card-sub">İlerleme ve rozetler</div>
        </div>
      </a>
    </div>

    <div class="ah-section-label" id="ah-word-label" style="display:none">Bugünün Kelimesi</div>
    <div class="ah-word-card" id="ah-word-card" style="display:none">
      <div class="ah-word-top">
        <div class="ah-word-text" id="ah-word-text">—</div>
        <div class="ah-word-pos" id="ah-word-pos"></div>
      </div>
      <div class="ah-word-pron" id="ah-word-pron"></div>
      <div class="ah-word-def" id="ah-word-def"></div>
    </div>

    <a href="/premium.html" class="ah-premium-card" id="ah-premium-card">
      <div class="ah-premium-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 18h20l-3-10-5 4-4-8-4 8-5-4z"/></svg>
      </div>
      <div class="ah-premium-text">
        <div class="ah-premium-title">Premium'a Geç</div>
        <div class="ah-premium-sub">Reklamsız, sınırsız yazı, 100 TL/ay</div>
      </div>
      <div class="ah-premium-arrow">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </a>

  </div>
</section>
<!-- END APP HERO -->

'''

# =====================================================================
# 2. App Hero CSS (assets/app-mode.css'e append)
# =====================================================================

APP_HERO_CSS = '''
/* ===== APP HERO (Faz 1.5) ===== */
.hero-app-mode { display: none; }

.app-mode .hero-manifesto,
.app-mode .bolum,
.app-mode .home-discount-banner,
.app-mode .global-discount-banner,
.app-mode #global-discount-banner {
  display: none !important;
}

.app-mode .hero-app-mode {
  display: block !important;
  background: transparent;
  padding: 0.5rem 0 2rem;
  min-height: auto;
}

.hero-app-mode .wrap {
  padding: 0 1rem;
  max-width: 720px;
  margin: 0 auto;
}

.ah-greeting { padding: 0.8rem 0 1.1rem; }
.ah-greeting h1 {
  font-family: 'Lora', serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: #2a2a2a;
  margin: 0 0 0.35rem;
  line-height: 1.2;
}
.ah-streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(200, 154, 60, 0.12);
  color: #9C7F45;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
  font-family: 'Inter', sans-serif;
}

.ah-continue {
  display: block;
  position: relative;
  background: #2C5856;
  color: #F4EFE3;
  border-radius: 12px;
  padding: 14px 60px 14px 16px;
  text-decoration: none;
  margin-bottom: 1.3rem;
  overflow: hidden;
  transition: transform 0.15s ease;
}
.ah-continue:hover { transform: translateY(-1px); }
.ah-continue-eyebrow {
  font-size: 9px;
  color: rgba(244, 239, 227, 0.7);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 5px;
  font-family: 'Inter', sans-serif;
}
.ah-continue-title {
  font-family: 'Lora', serif;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 3px;
}
.ah-continue-meta {
  font-size: 11px;
  color: rgba(244, 239, 227, 0.7);
  font-family: 'Inter', sans-serif;
}
.ah-continue-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(244, 239, 227, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F4EFE3;
}

.ah-section-label {
  font-size: 9px;
  color: #a89a78;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  margin: 0 0 0.7rem;
}

.ah-quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-bottom: 1.4rem;
}
.ah-card {
  background: #ffffff;
  border: 0.5px solid #d9d2bf;
  border-radius: 11px;
  padding: 14px 12px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 92px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  color: inherit;
}
.ah-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 31, 37, 0.06);
}
.ah-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ah-c-teal .ah-card-icon { background: rgba(44, 88, 86, 0.1); color: #2C5856; }
.ah-c-gold .ah-card-icon { background: rgba(200, 154, 60, 0.12); color: #9C7F45; }
.ah-c-coral .ah-card-icon { background: rgba(208, 90, 48, 0.12); color: #993C1D; }
.ah-c-purple .ah-card-icon { background: rgba(83, 74, 183, 0.12); color: #534AB7; }
.ah-card-title {
  font-family: 'Lora', serif;
  font-size: 13.5px;
  color: #2a2a2a;
  font-weight: 500;
  line-height: 1.15;
}
.ah-card-sub {
  font-size: 10px;
  color: #7a7a6e;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

.ah-word-card {
  background: #ffffff;
  border: 0.5px solid #d9d2bf;
  border-radius: 11px;
  padding: 14px 14px;
  margin-bottom: 1.4rem;
}
.ah-word-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
  gap: 8px;
}
.ah-word-text {
  font-family: 'Lora', serif;
  font-size: 22px;
  color: #2C5856;
  font-weight: 500;
  line-height: 1.1;
}
.ah-word-pos {
  font-size: 9px;
  color: #a89a78;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}
.ah-word-pron {
  font-size: 11px;
  color: #7a7a6e;
  font-style: italic;
  margin-bottom: 8px;
  font-family: 'Inter', sans-serif;
}
.ah-word-def {
  font-size: 12.5px;
  color: #3a3a32;
  line-height: 1.45;
  font-family: 'Inter', sans-serif;
}

.ah-premium-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(200, 154, 60, 0.12), rgba(44, 88, 86, 0.08));
  border: 0.5px solid rgba(200, 154, 60, 0.4);
  border-radius: 11px;
  padding: 13px 14px;
  text-decoration: none;
  margin-bottom: 1rem;
  color: inherit;
  transition: transform 0.15s ease;
}
.ah-premium-card:hover { transform: translateY(-1px); }
.ah-premium-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #c89a3c;
  color: #1a1f25;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ah-premium-text { flex: 1; min-width: 0; }
.ah-premium-title {
  font-family: 'Lora', serif;
  font-size: 13.5px;
  color: #2a2a2a;
  font-weight: 500;
  line-height: 1.2;
}
.ah-premium-sub {
  font-size: 10.5px;
  color: #7a7a6e;
  line-height: 1.3;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}
.ah-premium-arrow {
  color: #c89a3c;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .hero-app-mode .wrap { padding: 1rem 2rem; }
  .ah-quick-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .ah-quick-grid { gap: 12px; }
  .ah-card { min-height: 110px; padding: 16px 14px; }
}
'''

# =====================================================================
# 3. App Hero JS (assets/app-mode.js'e append edilecek)
# =====================================================================

APP_HERO_JS = r'''
/* ===== APP HERO LOADER (Faz 1.5) ===== */
(function() {
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  function isHomepage() {
    var p = window.location.pathname;
    return p === '/' || p === '/index.html' || p.endsWith('/index.html');
  }

  function isAppMode() {
    return document.documentElement.classList.contains('app-mode');
  }

  function waitForSupabase(callback, retries) {
    retries = retries || 0;
    if (window.supabase && window.supabase.createClient) {
      callback();
    } else if (retries < 40) {
      setTimeout(function() { waitForSupabase(callback, retries + 1); }, 100);
    }
  }

  async function loadAppHero() {
    if (!isAppMode() || !isHomepage()) return;

    var sb = window.supabase.createClient(SB_URL, SB_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });

    var sess = await sb.auth.getSession();
    var user = (sess && sess.data && sess.data.session) ? sess.data.session.user : null;

    if (user) {
      await loadGreeting(sb, user);
      await loadStreak(sb);
      await loadContinue(sb, user);
    }

    await loadWordOfDay(sb);
  }

  async function loadGreeting(sb, user) {
    try {
      var res = await sb.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      var name = '';
      if (res && res.data && res.data.full_name) {
        name = res.data.full_name.split(' ')[0];
      } else if (user.email) {
        name = user.email.split('@')[0];
      }
      if (name) {
        var el = document.getElementById('ah-name');
        if (el) el.textContent = 'Selam, ' + name;
      }
    } catch (e) {
      console.warn('[app-hero] greeting', e);
    }
  }

  async function loadStreak(sb) {
    try {
      var res = await sb.rpc('get_user_stats');
      if (res.error || !res.data) return;
      var streak = Number(res.data.current_streak || 0);
      if (streak > 0) {
        document.getElementById('ah-streak-num').textContent = streak;
        document.getElementById('ah-streak-row').style.display = 'block';
      }
    } catch (e) {
      console.warn('[app-hero] streak', e);
    }
  }

  async function loadContinue(sb, user) {
    try {
      var queries = await Promise.all([
        sb.from('user_answers').select('answered_at, question_slug').eq('user_id', user.id).order('answered_at', { ascending: false }).limit(1).maybeSingle(),
        sb.from('user_vocab').select('saved_at, vocabulary_id').eq('user_id', user.id).order('saved_at', { ascending: false }).limit(1).maybeSingle(),
        sb.from('writing_submissions').select('created_at, exam, text_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      var activities = [];
      if (queries[0].data && queries[0].data.answered_at) {
        activities.push({
          date: queries[0].data.answered_at,
          title: 'Soru Bankası',
          meta: 'En son: ' + relTime(queries[0].data.answered_at),
          href: '/soru-bankasi.html'
        });
      }
      if (queries[1].data && queries[1].data.saved_at) {
        activities.push({
          date: queries[1].data.saved_at,
          title: 'Kelime Bankası',
          meta: 'En son: ' + relTime(queries[1].data.saved_at),
          href: '/kelime-bankasi.html'
        });
      }
      if (queries[2].data && queries[2].data.created_at) {
        var exam = (queries[2].data.exam || '').toUpperCase();
        activities.push({
          date: queries[2].data.created_at,
          title: 'Yazı Pratiği' + (exam ? ' · ' + exam : ''),
          meta: 'En son: ' + relTime(queries[2].data.created_at),
          href: '/yazi-pratigi.html'
        });
      }

      activities.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      var latest = activities[0];
      if (!latest) return;

      var card = document.getElementById('ah-continue');
      document.getElementById('ah-continue-title').textContent = latest.title;
      document.getElementById('ah-continue-meta').textContent = latest.meta;
      card.href = latest.href;
      card.style.display = 'block';
    } catch (e) {
      console.warn('[app-hero] continue', e);
    }
  }

  async function loadWordOfDay(sb) {
    try {
      var countRes = await sb.from('kelimeler').select('id', { count: 'exact', head: true }).eq('active', true);
      var total = countRes.count || 0;
      if (total === 0) return;

      var msPerDay = 86400000;
      var daysSinceEpoch = Math.floor(Date.now() / msPerDay);
      var offset = daysSinceEpoch % total;

      var wordRes = await sb.from('kelimeler')
        .select('word, pos, ipa, phonetic_tr, example, fun_fact')
        .eq('active', true)
        .order('id', { ascending: true })
        .range(offset, offset);

      if (!wordRes.data || wordRes.data.length === 0) return;
      var w = wordRes.data[0];

      document.getElementById('ah-word-text').textContent = w.word || '';
      document.getElementById('ah-word-pos').textContent = (w.pos || '').toUpperCase();
      var pronParts = [];
      if (w.ipa) pronParts.push('/' + w.ipa + '/');
      if (w.phonetic_tr) pronParts.push(w.phonetic_tr);
      document.getElementById('ah-word-pron').textContent = pronParts.join(' · ');
      document.getElementById('ah-word-def').textContent = w.fun_fact || w.example || '';

      document.getElementById('ah-word-label').style.display = 'block';
      document.getElementById('ah-word-card').style.display = 'block';
    } catch (e) {
      console.warn('[app-hero] word', e);
    }
  }

  function relTime(iso) {
    var d = new Date(iso);
    var diffMs = Date.now() - d.getTime();
    var min = Math.floor(diffMs / 60000);
    if (min < 1) return 'şimdi';
    if (min < 60) return min + ' dk önce';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' saat önce';
    var day = Math.floor(hr / 24);
    if (day < 30) return day + ' gün önce';
    return d.toLocaleDateString('tr-TR');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      waitForSupabase(loadAppHero);
    });
  } else {
    waitForSupabase(loadAppHero);
  }
})();
'''


# =====================================================================
# Patch functions
# =====================================================================

def patch_index_html():
    """Inject app hero HTML before <section class="hero hero-manifesto">"""
    path = os.path.join(REPO_ROOT, 'index.html')
    if not os.path.exists(path):
        print('[err] index.html bulunamadı')
        return

    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    if '<!-- END APP HERO -->' in html:
        print('[skip] app-hero zaten enjekte edilmiş')
        return

    marker = '<section class="hero hero-manifesto">'
    if marker not in html:
        print('[err] hero-manifesto bulunamadı')
        return

    html = html.replace(marker, APP_HERO_HTML + marker, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print('[ok] index.html app-hero enjekte edildi')


def append_to_app_mode_css():
    """Append app hero CSS to assets/app-mode.css"""
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.css')
    if not os.path.exists(path):
        print('[err] assets/app-mode.css bulunamadı (önce Faz 1 patch çalıştırın)')
        return

    with open(path, 'r', encoding='utf-8') as f:
        css = f.read()

    if 'APP HERO (Faz 1.5)' in css:
        print('[skip] app-hero CSS zaten ekli')
        return

    with open(path, 'a', encoding='utf-8') as f:
        f.write(APP_HERO_CSS)
    print('[ok] assets/app-mode.css app-hero stilleri eklendi')


def append_to_app_mode_js():
    """Append app hero JS to assets/app-mode.js"""
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.js')
    if not os.path.exists(path):
        print('[err] assets/app-mode.js bulunamadı')
        return

    with open(path, 'r', encoding='utf-8') as f:
        js = f.read()

    if 'APP HERO LOADER (Faz 1.5)' in js:
        print('[skip] app-hero JS zaten ekli')
        return

    with open(path, 'a', encoding='utf-8') as f:
        f.write(APP_HERO_JS)
    print('[ok] assets/app-mode.js app-hero loader eklendi')


def main():
    print('=' * 60)
    print('Faz 1.5 - App Home patch')
    print('=' * 60)
    print('\n--- Step 1: index.html app-hero inject ---')
    patch_index_html()
    print('\n--- Step 2: app-mode.css append ---')
    append_to_app_mode_css()
    print('\n--- Step 3: app-mode.js append ---')
    append_to_app_mode_js()
    print('\n' + '=' * 60)
    print('Bitti! Şimdi:')
    print('  git add . && git commit -m "Faz 1.5 - App Home" && git push')
    print('=' * 60)


if __name__ == '__main__':
    main()
