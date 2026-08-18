
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

    const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

    // Auth state â€” login kullanÄ±cÄ±nÄ±n user_id'si, anonim ise null
    let GRI_USER_ID = null;

    // Tag taksonomisi sÃ¶zlÃ¼ÄŸÃ¼ (slug -> human readable label)
    const SECTION_LABELS = {
      'rw': 'Reading & Writing',
      'math': 'Math',
      'reading': 'Reading',
      'writing': 'Writing',
      'listening': 'Listening',
      'speaking': 'Speaking'
    };
    const CATEGORY_LABELS = {
      'craft_and_structure': 'Craft and Structure',
      'information_and_ideas': 'Information and Ideas',
      'expression_of_ideas': 'Expression of Ideas',
      'standard_english_conventions': 'Standard English Conventions',
      'algebra': 'Algebra',
      'advanced_math': 'Advanced Math',
      'problem_solving_and_data_analysis': 'Problem-Solving and Data Analysis',
      'geometry_and_trigonometry': 'Geometry and Trigonometry'
    };
    const SUBCATEGORY_LABELS = {
      // Reading & Writing
      'cross_text_connections': 'Cross-Text Connections',
      'words_in_context': 'Words in Context',
      'text_structure_and_purpose': 'Text Structure and Purpose',
      'central_ideas_and_details': 'Central Ideas and Details',
      'command_of_evidence': 'Command of Evidence',
      'inferences': 'Inferences',
      'transitions': 'Transitions',
      'rhetorical_synthesis': 'Rhetorical Synthesis',
      'boundaries': 'Boundaries',
      'form_structure_sense': 'Form, Structure, and Sense',
      // Math â€” Algebra
      'linear_equations_one_variable': 'Linear Equations in One Variable',
      'linear_functions': 'Linear Functions',
      'linear_equations_two_variables': 'Linear Equations in Two Variables',
      'systems_linear_equations_two_variables': 'Systems of Two Linear Equations in Two Variables',
      'linear_inequalities': 'Linear Inequalities in One or Two Variables',
      // Math â€” Advanced Math
      'equivalent_expressions': 'Equivalent Expressions',
      'nonlinear_equations_and_systems': 'Nonlinear Equations and Systems',
      'nonlinear_functions': 'Nonlinear Functions',
      // Math â€” Problem-Solving & Data Analysis
      'ratios_rates_proportions': 'Ratios, Rates, and Proportional Relationships',
      'percentages': 'Percentages',
      'one_variable_data': 'One-Variable Data: Distributions and Measures',
      'two_variable_data': 'Two-Variable Data: Models and Scatterplots',
      'probability': 'Probability and Conditional Probability',
      'inference_and_margin_of_error': 'Inference from Sample Statistics',
      'evaluating_statistical_claims': 'Evaluating Statistical Claims',
      // Math â€” Geometry & Trigonometry
      'area_and_volume': 'Area and Volume',
      'lines_angles_triangles': 'Lines, Angles, and Triangles',
      'right_triangles_trigonometry': 'Right Triangles and Trigonometry',
      'circles': 'Circles',
      // Math â€” Grid-in (Ã¶ÄŸrenci-Ã¼retimli cevap)
      'student_produced_response': 'Grid-in (Ã–ÄŸrenci-Ãœretimli Cevap)',
      // UDSP â€” Reading & Writing
      'grammar': 'Dilbilgisi',
      'vocabulary': 'Kelime Bilgisi',
      'reading_comprehension': 'OkuduÄŸunu Anlama',
      'cloze_test': 'Cloze Test',
      'translation': 'Ã‡eviri',
      'dialogue_completion': 'Diyalog Tamamlama',
      'odd_one_out': 'Anlam BÃ¼tÃ¼nlÃ¼ÄŸÃ¼',
      'restatement': 'CÃ¼mle Yeniden Ä°fade',
      'sentence_completion': 'CÃ¼mle Tamamlama',
      'paragraph_completion': 'Paragraf Tamamlama',
      'suitable_question': 'Uygun Soru',
      'situational_expression': 'Durum Ä°fadesi',
      // TOEFL Reading (toefl_ prefix to avoid clashes with UDSP/YDS subcats)
      'toefl_factual_information': 'AÃ§Ä±k Bilgi',
      'toefl_negative_factual': 'AykÄ±rÄ± Bilgi (EXCEPT)',
      'toefl_inference': 'Ã‡Ä±karÄ±m',
      'toefl_rhetorical_purpose': 'YazarÄ±n AmacÄ±',
      'toefl_vocabulary': 'Kelime AnlamÄ±',
      'toefl_sentence_simplification': 'CÃ¼mle BasitleÅŸtirme',
      'toefl_insert_text': 'CÃ¼mle YerleÅŸtirme'
    };

    // Fallback: snake_case'ten "Title Case" Ã¼ret (etiket bulunamazsa)
    function humanize(slug) {
      if (!slug) return '';
      return String(slug)
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.length ? w[0].toUpperCase() + w.slice(1) : '')
        .join(' ');
    }
    const EXAM_LABELS = {
      'sat': 'Digital SAT',
      'ielts': 'IELTS',
      'toefl': 'TOEFL',
      'ib': 'IB',
      'udsp': 'UDSP',
      'ydt': 'YDT',
      'yds': 'YDS/YÃ–KDÄ°L'
    };
    const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

    function esc(s) {
      if (s == null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Whitelist-based HTML â€” allows basic format tags, plus raw <svg> figures and <table> data tables (our own generated content)
    function safeHtml(s) {
      if (s == null) return '';
      var str = String(s);
      // <svg>â€¦</svg> figÃ¼r ve <table>â€¦</table> tablo bloklarÄ±nÄ± HAM bÄ±rak (kendi Ã¼rettiÄŸimiz gÃ¼venli iÃ§erik, class/attribute korunur); geri kalanÄ± whitelist'le.
      return str.split(/(<svg[\s\S]*?<\/svg>|<table[\s\S]*?<\/table>)/i).map(function (part, i) {
        if (i % 2 === 1) {
          return /^<table/i.test(part) ? '<div class="st-table">' + part + '</div>' : '<div class="st-fig">' + part + '</div>';
        }
        var escaped = part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        // Ä°zinli inline/blok etiketler (attribute'suz)
        var allowed = ['u', 'b', 'i', 'em', 'strong', 'sub', 'sup', 'br', 'p', 'div', 'ul', 'ol', 'li'];
        allowed.forEach(function (tag) {
          escaped = escaped.replace(new RegExp('&lt;' + tag + '&gt;', 'gi'), '<' + tag + '>')
                           .replace(new RegExp('&lt;/' + tag + '&gt;', 'gi'), '</' + tag + '>')
                           .replace(new RegExp('&lt;' + tag + '\\s*/&gt;', 'gi'), '<' + tag + '/>');
        });
        // div/p iÃ§in yalnÄ±z class attribute'una izin ver
        escaped = escaped.replace(/&lt;(div|p)\s+class=&quot;([a-zA-Z][a-zA-Z0-9_\- ]{0,80})&quot;&gt;/g, function (m, tag, cls) {
          return '<' + tag + ' class="' + cls + '">';
        });
        return escaped;
      }).join('');
    }

    function showError(message) {
      document.getElementById('qLoader').style.display = 'none';
      document.getElementById('qError').style.display = 'block';
      if (message) document.getElementById('qErrorMsg').textContent = message;
    }

    function showContent() {
      document.getElementById('qLoader').style.display = 'none';
      document.getElementById('qPageWrap').style.display = 'block';
      document.getElementById('qActionbar').style.display = 'flex';
      var qc = document.querySelector('.q-content');
      if (qc) qc.classList.add('q-enter');
      bindDiffbar();
    }

    // Zorluk filtre/sÄ±ra Ã§ubuÄŸu â€” mevcut URL'yi dÃ¼zenleyip yeni set olarak yÃ¼kler
    function bindDiffbar() {
      var bar = document.getElementById('npDiffbar');
      if (!bar || bar.dataset.bound) return;
      bar.dataset.bound = '1';
      var p = new URLSearchParams(location.search);
      var curDiff = p.get('zorluk') || '';
      var curSort = p.get('sirala') || '';
      bar.querySelectorAll('[data-diff]').forEach(function (b) {
        b.classList.toggle('on', (b.getAttribute('data-diff') || '') === curDiff);
      });
      var sc = document.getElementById('npSortChip');
      if (sc) sc.classList.toggle('on', curSort === 'kolay');
      bar.addEventListener('click', function (e) {
        var d = e.target.closest('[data-diff]');
        var s = e.target.closest('[data-sort]');
        if (!d && !s) return;
        var u = new URL(location.href);
        if (d) {
          var v = d.getAttribute('data-diff');
          if (v) u.searchParams.set('zorluk', v); else u.searchParams.delete('zorluk');
        } else {
          if (curSort === 'kolay') u.searchParams.delete('sirala'); else u.searchParams.set('sirala', 'kolay');
        }
        u.searchParams.delete('q');   // filtre deÄŸiÅŸince taze set
        if (typeof window.__setInternalNav === 'function') window.__setInternalNav();
        location.href = u.pathname + u.search;
      });
    }

    // Subcategory navigation state
    let SUBCATEGORY_LIST = [];   // ordered: [{slug, difficulty}]
    let DIFF_MAP = {};           // slug -> difficulty (set-build sÄ±rasÄ±nda dolar)
    let CURRENT_INDEX = 0;
    let SET_URL_PARAMS = '';     // preserved across navigation, e.g. '&subcategories=a,b&shuffle=1'
    let SET_KEY = null;          // sessionStorage key for this set's order

    // Helpers â€” Fisher-Yates and sessionStorage answer tracking
    function shuffleInPlace(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    // Sunum sÄ±rasÄ±: Ã–NCE gÃ¶rÃ¼lmemiÅŸ (yeni) sorular, SONRA gÃ¶rÃ¼lenler (tekrar iÃ§in).
    // "GÃ¶rÃ¼lmÃ¼ÅŸ" = sessionStorage 'gri.answer.<slug>' (login kullanÄ±cÄ±da DB'den preload edilir).
    // Her grup KENDÄ° Ä°Ã‡Ä°NDE varsayÄ±lan olarak KARIÅTIRILIR (aynÄ± sÄ±ra tekrar etmesin).
    // Ä°stisna: sirala=kolay â†’ zorluk sÄ±rasÄ±; sirala=yeni â†’ created_at DESC (yeniden eskiye).
    // ÅÄ±k pozisyon debias'Ä± ayrÄ± katmanda kurulur; bu sÄ±ralamadan etkilenmez.
    function orderUnseenFirst(slugs, opts) {
      opts = opts || {};
      const createdMap = opts.created || {};
      const unseenList = [], seenList = [];
      slugs.forEach(function (s) {
        if (sessionStorage.getItem('gri.answer.' + s)) seenList.push(s);
        else unseenList.push(s);
      });
      function orderGroup(grp) {
        if (opts.sirala === 'kolay') return grp;            // zorluk sÄ±rasÄ± (deterministik, aÃ§Ä±k tercih)
        if (opts.sirala === 'yeni') {                        // en yeniden eskiye (deterministik)
          return grp.slice().sort(function (a, b) {          // created_at DESC
            const ca = createdMap[a] || '', cb = createdMap[b] || '';
            if (ca !== cb) return ca < cb ? 1 : -1;
            return a < b ? 1 : -1;                           // tie-break: slug DESC
          });
        }
        // VarsayÄ±lan: grubu karÄ±ÅŸtÄ±r â€” her giriÅŸte sÄ±ra deÄŸiÅŸsin (aynÄ± sÄ±ra tekrar etmesin).
        shuffleInPlace(grp);
        return grp;
      }
      return orderGroup(unseenList).concat(orderGroup(seenList));
    }
    function getAnswerStatus(slug) {
      return sessionStorage.getItem('gri.answer.' + slug); // 'correct' | 'incorrect' | null
    }
    // === Freemium: gÃ¼nlÃ¼k Ã¼cretsiz soru limiti (premium = sÄ±nÄ±rsÄ±z) ===
    var GRI_DAILY_LIMIT = 20;
    var GRI_DENEME_MODE = false; // deneme (tam test) modunda gÃ¼nlÃ¼k limit uygulanmaz
    // === GerÃ§ek SINAV-MODU (yalnÄ±zca ?deneme= URL'lerinde) ===
    // GRI_DENEME_PARAM: deneme tag paramÄ± (bitir sorgusu + sessionStorage anahtarÄ±)
    // GRI_EXAM_REVIEW : deneme bitince true â†’ inceleme (cevap+doÄŸru+aÃ§Ä±klama) modu
    var GRI_DENEME_PARAM = null;
    var GRI_EXAM_REVIEW = false;
    function examStoreKey() { return 'gri.exam.' + (GRI_DENEME_PARAM || ''); }
    function examGetAll() {
      try { return JSON.parse(sessionStorage.getItem(examStoreKey()) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function examGet(slug) { var m = examGetAll(); return m[slug] || null; }
    function examSet(slug, letter) {
      try { var m = examGetAll(); m[slug] = letter; sessionStorage.setItem(examStoreKey(), JSON.stringify(m)); }
      catch (e) {}
    }
    // SonuÃ§ kesinleÅŸince (bitir): review navigatÃ¶rÃ¼ + panelim tutarlÄ±lÄ±ÄŸÄ± iÃ§in hafif kayÄ±t.
    // NOT: setAnswerStatus'un aksine gÃ¼nlÃ¼k limiti ARTIRMAZ (deneme limitten muaf) ve SRS'e dokunmaz.
    function examPersistResult(slug, status) {
      try { sessionStorage.setItem('gri.answer.' + slug, status); } catch (e) {}
      if (GRI_USER_ID) {
        supabase.from('user_answers').upsert({
          user_id: GRI_USER_ID, question_slug: slug, status: status,
          answered_at: new Date().toISOString()
        }, { onConflict: 'user_id,question_slug' }).then(function (r) {
          if (r && r.error) console.warn('[deneme] persist failed:', r.error.message);
        });
      }
    }
    function griTodayKey() { var d = new Date(); return 'gri.daily.' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function griDailyCount() { return parseInt(localStorage.getItem(griTodayKey()) || '0', 10) || 0; }
    function griDailyInc() { try { localStorage.setItem(griTodayKey(), String(griDailyCount() + 1)); } catch (e) {} }
    function griIsPremiumNow() { try { return !!(window.GriPremium && window.GriPremium.isActive()); } catch (e) { return false; } }
    function griLimitReached() { return !griIsPremiumNow() && griDailyCount() >= GRI_DAILY_LIMIT; }
    // Login kullanÄ±cÄ±da bugÃ¼nkÃ¼ DB cevap sayÄ±sÄ±nÄ± al, yerel sayaca tohum at (cihazlar arasÄ± tutarlÄ±lÄ±k)
    async function griSeedDailyFromDb() {
      if (!GRI_USER_ID) return;
      try {
        var d = new Date();
        var start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        var res = await supabase.from('user_answers')
          .select('question_slug', { count: 'exact', head: true })
          .eq('user_id', GRI_USER_ID).gte('answered_at', start);
        if (res && typeof res.count === 'number' && res.count > griDailyCount()) {
          localStorage.setItem(griTodayKey(), String(res.count));
        }
      } catch (e) {}
    }
    function griShowPaywall() {
      if (document.getElementById('gri-paywall')) return;
      var ov = document.createElement('div');
      ov.id = 'gri-paywall';
      ov.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,15,10,.55);backdrop-filter:blur(4px)';
      ov.innerHTML = '<div style="max-width:420px;width:100%;background:var(--surface,#fff);border:1px solid var(--line,#E3D8C5);border-radius:18px;box-shadow:0 20px 60px rgba(20,15,10,.28);padding:30px 26px;text-align:center;font-family:Inter,system-ui,sans-serif">' +
        '<div style="display:inline-block;background:#7A3B3B;color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;padding:5px 12px;border-radius:100px">GÃœNLÃœK HAK DOLDU</div>' +
        '<h3 style="font-family:Georgia,serif;font-size:1.4rem;margin:16px 0 8px;color:var(--text,#1A2230)">BugÃ¼nlÃ¼k bu kadar!</h3>' +
        '<p style="color:var(--text-muted,#8A7F6E);font-size:14.5px;line-height:1.6;margin:0 0 20px">Ãœcretsiz planla gÃ¼nde ' + GRI_DAILY_LIMIT + ' soru Ã§Ã¶zebilirsin. HakkÄ±n yarÄ±n sÄ±fÄ±rlanÄ±r. SÄ±nÄ±rsÄ±z Ã§Ã¶zmek ve reklamsÄ±z Ã§alÄ±ÅŸmak iÃ§in Premium\'a geÃ§ebilirsin.</p>' +
        '<a href="premium" style="display:block;background:var(--teal,#2C5856);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px;border-radius:12px;margin-bottom:10px">Premium ile sÄ±nÄ±rsÄ±z Ã§Ã¶z</a>' +
        '<a href="panelim" style="display:block;color:var(--text-muted,#8A7F6E);text-decoration:none;font-size:13px">Ã‡alÄ±ÅŸma Masama dÃ¶n</a>' +
        '</div>';
      document.body.appendChild(ov);
    }
    function setAnswerStatus(slug, status) {
      var wasNew = !sessionStorage.getItem('gri.answer.' + slug);
      sessionStorage.setItem('gri.answer.' + slug, status);
      if (wasNew && !griIsPremiumNow()) griDailyInc();
      // Login kullanÄ±cÄ± iÃ§in DB'ye de kaydet (fire-and-forget)
      if (GRI_USER_ID) {
        supabase.from('user_answers').upsert({
          user_id: GRI_USER_ID,
          question_slug: slug,
          status: status,
          answered_at: new Date().toISOString(),
          time_spent_ms: (typeof timerSeconds === 'number' ? timerSeconds * 1000 : null),
        }, { onConflict: 'user_id,question_slug' }).then(function (r) {
          if (r.error) console.warn('[answers] persist failed:', r.error.message);
        });
        // AralÄ±klÄ± tekrar (SRS): yanlÄ±ÅŸ->kuyruÄŸa, doÄŸru->kutu ilerlet (fire-and-forget)
        supabase.rpc('srs_record', { p_slug: slug, p_correct: status === 'correct' })
          .then(function (r) { if (r && r.error) console.warn('[srs] failed:', r.error.message); });
        // Rozet deÄŸerlendirmesi (debounced, 30 sn'de en fazla bir kez)
        if (typeof window.triggerBadgeCheck === 'function') {
          window.triggerBadgeCheck();
        }
      }
    }
    function clearAnswersForSet(slugs) {
      slugs.forEach(s => sessionStorage.removeItem('gri.answer.' + s));
    }

    // Login kullanÄ±cÄ±nÄ±n tÃ¼m cevaplarÄ±nÄ± DB'den yÃ¼kle, sessionStorage'a serp
    async function preloadAnswersFromDb() {
      if (!GRI_USER_ID) return;
      try {
        const res = await supabase.from('user_answers')
          .select('question_slug, status')
          .eq('user_id', GRI_USER_ID);
        if (res && res.data) {
          res.data.forEach(function (row) {
            if (!sessionStorage.getItem('gri.answer.' + row.question_slug)) {
              sessionStorage.setItem('gri.answer.' + row.question_slug, row.status);
            }
          });
        }
      } catch (e) {
        console.warn('[answers] preload failed:', e);
      }
    }

    // Timer â€” counts up from 00:00 on each question load
    let timerInterval = null;
    let timerSeconds = 0;
    function startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      timerSeconds = 0;
      renderTimer();
      timerInterval = setInterval(() => {
        timerSeconds++;
        renderTimer();
      }, 1000);
    }
    function stopTimer() {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }
    function renderTimer() {
      const el = document.getElementById('qTimerText');
      if (!el) return;
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    async function loadQuestion() {
      // Auth state'i bir kez yakala (session varsa user_id'yi kaydet, cevaplarÄ± DB'den preload et)
      if (GRI_USER_ID === null) {
        try {
          const sessRes = await supabase.auth.getSession();
          if (sessRes && sessRes.data && sessRes.data.session) {
            GRI_USER_ID = sessRes.data.session.user.id;
            await preloadAnswersFromDb();
            await griSeedDailyFromDb();
          }
        } catch (e) { console.warn('[auth] init failed:', e); }
      }
      // Premium durumunu netleÅŸtir (limit yanlÄ±ÅŸ tetiklenmesin)
      try { if (window.GriPremium && typeof window.GriPremium.refresh === 'function') await window.GriPremium.refresh(); } catch (e) {}

      const params = new URLSearchParams(window.location.search);
      const slug = params.get('q');
      const id = params.get('id');
      const subcatParam = params.get('subcategory');
      const subcatParamAll = params.getAll('subcategory'); // for backward compat: ?subcategory=A&subcategory=B&...
      const subcatsParam = params.get('subcategories');
      const shuffleParam = params.get('shuffle') === '1';

      // Determine subcategory list defining the set (if any)
      let subcatList = [];
      if (subcatsParam) {
        subcatList = subcatsParam.split(',').map(s => s.trim()).filter(Boolean);
      } else if (subcatParamAll.length > 1) {
        // Backward-compat: legacy URLs with repeated ?subcategory=X&subcategory=Y
        subcatList = subcatParamAll.map(s => s.trim()).filter(Boolean);
      } else if (subcatParam) {
        subcatList = [subcatParam];
      }

      // Build SET_URL_PARAMS to preserve across navigation
      // Always normalize to subcategories=A,B,C form (modern, comma-separated)
      SET_URL_PARAMS = '';
      if (subcatList.length > 1) {
        SET_URL_PARAMS = '&subcategories=' + encodeURIComponent(subcatList.join(','));
      } else if (subcatList.length === 1) {
        SET_URL_PARAMS = '&subcategory=' + encodeURIComponent(subcatList[0]);
      }
      if (shuffleParam) SET_URL_PARAMS += '&shuffle=1';

      // Zorluk filtresi + kolaydan-zora sÄ±ralama
      const zorluk = params.get('zorluk');   // easy | medium | hard
      const sirala = params.get('sirala');    // 'kolay'
      if (zorluk) SET_URL_PARAMS += '&zorluk=' + encodeURIComponent(zorluk);
      if (sirala) SET_URL_PARAMS += '&sirala=' + encodeURIComponent(sirala);

      // AralÄ±klÄ± tekrar modu (?srs=1): kuyruktaki tekrar zamanÄ± gelmiÅŸ sorular
      const srsMode = params.get('srs') === '1';
      if (srsMode) SET_URL_PARAMS += '&srs=1';

      // Yer imleri modu (?bm=1): set = kullanÄ±cÄ±nÄ±n yer imleri; Sonraki/Ã–nceki bunlarÄ±n arasÄ±nda gezer
      const bmMode = params.get('bm') === '1';
      if (bmMode) SET_URL_PARAMS += '&bm=1';

      // Deneme (tam test) modu: ?deneme=yds-full-1 â†’ deneme:yds-full-1 tag'li tÃ¼m sorular, sabit sÄ±rada.
      // GÃ¼nlÃ¼k soru limitinden MUAF (deneme tek oturuÅŸta Ã§Ã¶zÃ¼lÃ¼r).
      const denemeParam = params.get('deneme');
      if (denemeParam) SET_URL_PARAMS += '&deneme=' + encodeURIComponent(denemeParam);
      GRI_DENEME_MODE = !!denemeParam;
      GRI_DENEME_PARAM = denemeParam || null;
      // Ä°nceleme modu tam sayfa yeniden yÃ¼klemelerinde (Sonraki/Ã–nceki/harita) korunur.
      if (denemeParam) {
        try { GRI_EXAM_REVIEW = sessionStorage.getItem('gri.exam.review.' + denemeParam) === '1'; } catch (e) { GRI_EXAM_REVIEW = false; }
      } else {
        GRI_EXAM_REVIEW = false;
      }

      // SET_KEY identifies this set in sessionStorage
      SET_KEY = denemeParam
        ? 'gri.set.deneme.' + denemeParam
        : srsMode
        ? 'gri.set.srs'
        : bmMode
          ? 'gri.set.bookmarks'
        : subcatList.length > 0
          ? 'gri.set.' + subcatList.join(',') + (shuffleParam ? ':shuffle' : '') + (zorluk ? ':d-' + zorluk : '') + (sirala ? ':s-' + sirala : '')
          : null;

      console.log('[soru.html] set params:', { subcatList, shuffleParam, srsMode, slug });

      let currentQuestion = null;
      let setSlugs = null;   // ordered list of slugs in this set
      let isFreshEntry = false;  // user just clicked BaÅŸla / KarÄ±ÅŸÄ±k BaÅŸla

      // === Resolve set order ===
      if (denemeParam) {
        if (slug && SET_KEY) {
          const stored = sessionStorage.getItem(SET_KEY);
          if (stored) { try { setSlugs = JSON.parse(stored); } catch (e) { setSlugs = null; } }
        }
        if (!setSlugs || setSlugs.length === 0) {
          const tag = 'deneme:' + denemeParam;
          const { data: list, error } = await supabase
            .from('questions').select('slug')
            .eq('active', true).contains('tags', [tag]).order('slug');
          if (error || !list || list.length === 0) { showError('Deneme yÃ¼klenemedi.'); return; }
          setSlugs = list.map(r => r.slug);   // sabit deneme sÄ±rasÄ± (slug: ...-01..-80)
          sessionStorage.setItem(SET_KEY, JSON.stringify(setSlugs));
          if (!slug) isFreshEntry = true;
        }
      } else if (srsMode) {
        if (slug && SET_KEY) {
          const stored = sessionStorage.getItem(SET_KEY);
          if (stored) { try { setSlugs = JSON.parse(stored); } catch (e) { setSlugs = null; } }
        }
        if (!setSlugs || setSlugs.length === 0) {
          const { data: due, error } = await supabase.rpc('srs_due_slugs', { p_limit: 50 });
          if (error) { showError('Tekrar listesi yÃ¼klenemedi.'); return; }
          setSlugs = (due || []).map(r => r.question_slug);
          if (setSlugs.length === 0) { showError('Tekrar zamanÄ± gelen soru yok â€” hepsini tazeledin. ğŸ‰'); return; }
          sessionStorage.setItem(SET_KEY, JSON.stringify(setSlugs));
          // SRS'te cevaplar temizlenmez; tekrar Ã§Ã¶zÃ¼nce kuyruk gÃ¼ncellenir
        }
      } else if (bmMode) {
        if (slug && SET_KEY) {
          const stored = sessionStorage.getItem(SET_KEY);
          if (stored) { try { setSlugs = JSON.parse(stored); } catch (e) { setSlugs = null; } }
        }
        if (!setSlugs || setSlugs.length === 0) {
          if (!GRI_USER_ID) { showError('Yer imlerini gÃ¶rmek iÃ§in giriÅŸ yapmalÄ±sÄ±n.'); return; }
          const { data: bms } = await supabase.from('user_bookmarks').select('question_slug').eq('user_id', GRI_USER_ID);
          setSlugs = (bms || []).map(function (r) { return r.question_slug; });
          if (setSlugs.length === 0) { showError('Yer imin yok â€” bir soruyu aÃ§Ä±p yer imine ekle.'); return; }
          sessionStorage.setItem(SET_KEY, JSON.stringify(setSlugs));
          // Yer imi modu: Ã§Ã¶zÃ¼lenler dÄ±ÅŸlanmaz (tekrar Ã§Ã¶zebilirsin).
        }
      } else if (subcatList.length > 0) {
        // Try restoring from sessionStorage (mid-set navigation)
        if (slug && SET_KEY) {
          const stored = sessionStorage.getItem(SET_KEY);
          if (stored) {
            try { setSlugs = JSON.parse(stored); } catch (e) { setSlugs = null; }
          }
        }

        // No stored order â†’ build from DB
        if (!setSlugs || setSlugs.length === 0) {
          const { data: list, error } = await supabase
            .from('questions')
            .select('slug,difficulty,created_at,tags')
            .eq('active', true)
            .in('subcategory', subcatList)
            .order('slug');
          if (error || !list || list.length === 0) {
            showError('Bu kategoride henÃ¼z soru yok.');
            return;
          }
          // Deneme (adaptif tam test) sorularÄ±nÄ± topic drill'inden DIÅLA â€” deneme iÃ§eriÄŸi pratik ekranÄ±nda Ã¶nceden ifÅŸa olmasÄ±n.
          let rows = list.filter(r => !(r.tags || []).some(t => typeof t === 'string' && t.indexOf('deneme:') === 0));
          if (rows.length === 0) { showError('Bu kategoride henÃ¼z soru yok.'); return; }
          if (zorluk) rows = rows.filter(r => r.difficulty === zorluk);
          if (rows.length === 0) { showError('Bu zorlukta soru yok. FarklÄ± bir zorluk seÃ§.'); return; }
          rows.forEach(r => { DIFF_MAP[r.slug] = r.difficulty || 'medium'; });
          const CREATED_MAP = {};
          rows.forEach(r => { CREATED_MAP[r.slug] = r.created_at || ''; });
          if (sirala === 'kolay') {
            const _RANK = { easy: 1, medium: 2, hard: 3 };
            rows = rows.slice().sort((a, b) => {
              const ra = _RANK[a.difficulty] || 2, rb = _RANK[b.difficulty] || 2;
              return ra !== rb ? ra - rb : (a.slug < b.slug ? -1 : 1);
            });
          }
          // Sunum sÄ±rasÄ±: Ã¶nce gÃ¶rÃ¼lmemiÅŸ (yeni) sorular, sonra gÃ¶rÃ¼lenler (tekrar);
          // her grup kendi iÃ§inde karÄ±ÅŸtÄ±rÄ±lÄ±r (shuffle) veya created_at DESC. Ã‡Ã¶zÃ¼lmÃ¼ÅŸ
          // sorular artÄ±k setten atÄ±lmaz â€” tekrar iÃ§in sona alÄ±nÄ±r (Ã¶ÄŸrenci istemeden gÃ¶rdÃ¼ÄŸÃ¼
          // yeniyi bir daha gÃ¶rmez, ama gÃ¶rdÃ¼klerini gÃ¶zden geÃ§irebilir).
          setSlugs = orderUnseenFirst(rows.map(r => r.slug), { shuffle: shuffleParam, sirala: sirala, created: CREATED_MAP });
          if (SET_KEY) sessionStorage.setItem(SET_KEY, JSON.stringify(setSlugs));

          // No q in URL â†’ taze baÅŸlangÄ±Ã§; Ã§Ã¶zÃ¼len iÅŸaretler KORUNUR (artÄ±k silinmiyor).
          if (!slug) {
            isFreshEntry = true;
          }
        }
      }

      // === Resolve target question slug ===
      let targetSlug = slug;
      if (!targetSlug && setSlugs && setSlugs.length > 0) {
        targetSlug = setSlugs[0];
      }

      // === Fetch current question ===
      if (targetSlug) {
        const { data, error } = await supabase
          .from('questions')
          .select('*, passage:passages(*)')
          .eq('active', true)
          .eq('slug', targetSlug)
          .maybeSingle();
        if (error) { showError('Sunucu hatasÄ±: ' + (error.message || 'bilinmiyor')); return; }
        if (!data)  { showError('Bu soru bulunamadÄ±.'); return; }
        currentQuestion = data;
      } else if (id) {
        const { data, error } = await supabase
          .from('questions')
          .select('*, passage:passages(*)')
          .eq('active', true)
          .eq('id', id)
          .maybeSingle();
        if (error || !data) { showError('Bu soru bulunamadÄ±.'); return; }
        currentQuestion = data;
      } else {
        // No params at all â€” first active question
        const { data, error } = await supabase
          .from('questions')
          .select('*, passage:passages(*)')
          .eq('active', true)
          .order('slug')
          .limit(1)
          .maybeSingle();
        if (error || !data) { showError('Soru bulunamadÄ±.'); return; }
        currentQuestion = data;
      }

      // === If no set was built (direct ?q= access), derive from question's subcategory ===
      if (!setSlugs || setSlugs.length === 0) {
        const { data: list } = await supabase
          .from('questions')
          .select('slug,difficulty,created_at,tags')
          .eq('active', true)
          .eq('subcategory', currentQuestion.subcategory)
          .order('slug');
        // Deneme sorularÄ±nÄ± topic drill'inden dÄ±ÅŸla (sÄ±zÄ±ntÄ± Ã¶nleme).
        let rows = (list || []).filter(r => !(r.tags || []).some(t => typeof t === 'string' && t.indexOf('deneme:') === 0));
        if (zorluk) rows = rows.filter(r => r.difficulty === zorluk);
        rows.forEach(r => { DIFF_MAP[r.slug] = r.difficulty || 'medium'; });
        const CREATED_MAP2 = {};
        rows.forEach(r => { CREATED_MAP2[r.slug] = r.created_at || ''; });
        if (sirala === 'kolay') {
          const _RANK = { easy: 1, medium: 2, hard: 3 };
          rows = rows.slice().sort((a, b) => {
            const ra = _RANK[a.difficulty] || 2, rb = _RANK[b.difficulty] || 2;
            return ra !== rb ? ra - rb : (a.slug < b.slug ? -1 : 1);
          });
        }
        // DoÄŸrudan ?q= ile geliÅŸte de gÃ¶rÃ¼lmemiÅŸ-Ã¶nce sÄ±rasÄ± (implicit set â€” SET_KEY yok).
        setSlugs = orderUnseenFirst(rows.map(r => r.slug), { shuffle: shuffleParam, sirala: sirala, created: CREATED_MAP2 });
        // Implicit set â€” no SET_KEY persistence
      }

      // Nav renkleri: DIFF_MAP doluysa anÄ±nda; deÄŸilse arka planda parÃ§alÄ± Ã§ekilir.
      SUBCATEGORY_LIST = setSlugs.map(s => ({ slug: s, difficulty: DIFF_MAP[s] || 'medium' }));
      CURRENT_INDEX = Math.max(0, setSlugs.indexOf(currentQuestion.slug));

      // === If fresh entry, replace URL to include ?q= so refresh keeps the position ===
      if (isFreshEntry && currentQuestion.slug) {
        const newUrl = 'soru.html?q=' + encodeURIComponent(currentQuestion.slug) + SET_URL_PARAMS;
        window.history.replaceState(null, '', newUrl);
      }

      renderQuestion(currentQuestion);
      renderNavigator();
      showContent();
      attachInteractivity();

      // === Difficulty renklerini arka planda, 150'ÅŸerli parÃ§alarla Ã§ek ===
      (async function loadDifficulties() {
        try {
          const diffMap = new Map();
          for (let i = 0; i < setSlugs.length; i += 150) {
            const chunk = setSlugs.slice(i, i + 150);
            const { data } = await supabase
              .from('questions')
              .select('slug, difficulty')
              .in('slug', chunk);
            (data || []).forEach(r => diffMap.set(r.slug, r.difficulty));
          }
          if (diffMap.size) {
            SUBCATEGORY_LIST = setSlugs.map(s => ({ slug: s, difficulty: diffMap.get(s) || 'medium' }));
            renderNavigator();
          }
        } catch (e) { console.warn('[difficulty] load failed:', e); }
      })();
    }

    function gotoSlug(slug) {
      if (typeof window.__setInternalNav === 'function') window.__setInternalNav();
      window.location.href = 'soru.html?q=' + encodeURIComponent(slug) + SET_URL_PARAMS;
    }

    // === Progresif harita: yalnÄ±zca Ã¶ÄŸrencinin ULAÅTIÄI sorular gÃ¶sterilir ===
    // UlaÅŸÄ±lan en yÃ¼ksek index sessionStorage'da tutulur (her soru ayrÄ± sayfa yÃ¼klemesi
    // olduÄŸu iÃ§in kalÄ±cÄ± olmalÄ±). Harita ileriyi ifÅŸa etmez; toplam soru sayÄ±sÄ± gizli.
    function reachedStoreKey() {
      return 'gri.reached.' + (SET_KEY || ('q' + SET_URL_PARAMS));
    }
    function getReached() {
      try {
        const v = parseInt(sessionStorage.getItem(reachedStoreKey()) || '0', 10);
        return isNaN(v) ? 0 : v;
      } catch (e) { return 0; }
    }
    function bumpReached(idx) {
      try {
        if (idx > getReached()) sessionStorage.setItem(reachedStoreKey(), String(idx));
      } catch (e) {}
    }
    function resetReached() {
      try { sessionStorage.removeItem(reachedStoreKey()); } catch (e) {}
    }

    function renderNavigator() {
      const total = SUBCATEGORY_LIST.length;
      // Ä°lerleme gÃ¶stergesi: yalnÄ±zca sÄ±ra numarasÄ±, toplam YOK.
      document.getElementById('npCurrent').textContent = String(CURRENT_INDEX + 1);

      // UlaÅŸÄ±lan yÃ¼ksek noktayÄ± gÃ¼ncelle ve haritayÄ± o noktaya kadar Ã§iz.
      bumpReached(CURRENT_INDEX);
      const reachedCount = Math.min(total, Math.max(CURRENT_INDEX, getReached()) + 1);

      const gridEl = document.getElementById('npGrid');
      gridEl.innerHTML = SUBCATEGORY_LIST.slice(0, reachedCount).map((item, idx) => {
        const num = idx + 1;
        const isCurrent = idx === CURRENT_INDEX;
        const classes = ['nav-sq', `diff-${item.difficulty || 'medium'}`];
        if (isCurrent) classes.push('sq-current');

        // Status badge from sessionStorage
        const ans = getAnswerStatus(item.slug);
        let badge = '';
        if (GRI_DENEME_MODE && !GRI_EXAM_REVIEW) {
          // SINAV: doÄŸru/yanlÄ±ÅŸ GÃ–STERME â€” yalnÄ±zca "cevaplandÄ±" (nÃ¶tr) iÅŸareti
          if (examGet(item.slug)) {
            badge = `<span class="sq-status answered-neutral" aria-label="CevaplandÄ±"></span>`;
          }
        } else if (ans === 'correct') {
          badge = `<span class="sq-status correct" aria-label="DoÄŸru"><svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"/></svg></span>`;
        } else if (ans === 'incorrect') {
          badge = `<span class="sq-status incorrect" aria-label="YanlÄ±ÅŸ"><svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg></span>`;
        }

        return `<button class="${classes.join(' ')}" data-slug="${item.slug}" type="button">${num}${badge}</button>`;
      }).join('');
    }

    // Returns count of answered slugs in current set
    function countAnswered() {
      return SUBCATEGORY_LIST.reduce((acc, item) => acc + (getAnswerStatus(item.slug) ? 1 : 0), 0);
    }

    function showCompletionScreen() {
      const total = SUBCATEGORY_LIST.length;
      let correct = 0, incorrect = 0;
      SUBCATEGORY_LIST.forEach(item => {
        const v = getAnswerStatus(item.slug);
        if (v === 'correct') correct++;
        else if (v === 'incorrect') incorrect++;
      });
      const skipped = total - correct - incorrect;
      const answered = correct + incorrect;
      const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

      // Dinamik baÅŸlÄ±k + alt mesaj + kedi varyantÄ±
      let title, sub, ringClass, catVariant;
      if (pct >= 85) {
        title = 'OlaÄŸanÃ¼stÃ¼';
        sub = 'Konuya hÃ¢kimsin. Daha zor setlerle test et.';
        ringClass = 'high';
        catVariant = 'happy';
      } else if (pct >= 70) {
        title = 'Ã‡ok iyi';
        sub = 'SaÄŸlam ilerliyorsun. YanlÄ±ÅŸlarÄ±na bakarak son cilayÄ± Ã§ek.';
        ringClass = 'high';
        catVariant = 'happy';
      } else if (pct >= 50) {
        title = 'Ä°yi gidiyorsun';
        sub = 'YarÄ±sÄ±nÄ±n Ã¼zerindesin. YanlÄ±ÅŸlarÄ± incelemek farkÄ± kapatÄ±r.';
        ringClass = 'mid';
        catVariant = 'face';
      } else if (answered > 0) {
        title = 'Pratik gerek';
        sub = 'YanlÄ±ÅŸlarÄ± gÃ¶zden geÃ§ir, sonra baÅŸka bir setle dene.';
        ringClass = 'low';
        catVariant = 'face';
      } else {
        title = 'TamamlandÄ±';
        sub = 'HiÃ§ cevap yok. Tekrar baÅŸlamak ister misin?';
        ringClass = 'mid';
        catVariant = 'sleep';
      }

      // Kedi SVG path'leri (3 varyant)
      const catPaths = {
        face: `<path d="M4 5c1.667 -1.333 3 -2.333 4 -3c.333 1.333 .667 4 1 5"/>
               <path d="M20 5c-1.667 -1.333 -3 -2.333 -4 -3c-.333 1.333 -.667 4 -1 5"/>
               <path d="M3 9c0 -1.5 1 -3 3 -3h12c2 0 3 1.5 3 3a4 4 0 0 1 -4 4v3c0 1.667 -.333 3 -1 4h-9c-.667 -1 -1 -2.333 -1 -4v-3a4 4 0 0 1 -3 -4z"/>
               <path d="M10 12v.01"/>
               <path d="M14 12v.01"/>
               <path d="M10 16c.667 .333 1.333 .5 2 .5s1.333 -.167 2 -.5"/>`,
        happy: `<path d="M4 5c1.667 -1.333 3 -2.333 4 -3c.333 1.333 .667 4 1 5"/>
                <path d="M20 5c-1.667 -1.333 -3 -2.333 -4 -3c-.333 1.333 -.667 4 -1 5"/>
                <path d="M3 9c0 -1.5 1 -3 3 -3h12c2 0 3 1.5 3 3a4 4 0 0 1 -4 4v3c0 1.667 -.333 3 -1 4h-9c-.667 -1 -1 -2.333 -1 -4v-3a4 4 0 0 1 -3 -4z"/>
                <path d="M9.5 11c.5 -.5 1.5 -.5 2 0"/>
                <path d="M12.5 11c.5 -.5 1.5 -.5 2 0"/>
                <path d="M10 16c.667 .5 1.333 .8 2 .8s1.333 -.3 2 -.8"/>`,
        sleep: `<path d="M4 5c1.667 -1.333 3 -2.333 4 -3c.333 1.333 .667 4 1 5"/>
                <path d="M20 5c-1.667 -1.333 -3 -2.333 -4 -3c-.333 1.333 -.667 4 -1 5"/>
                <path d="M3 9c0 -1.5 1 -3 3 -3h12c2 0 3 1.5 3 3a4 4 0 0 1 -4 4v3c0 1.667 -.333 3 -1 4h-9c-.667 -1 -1 -2.333 -1 -4v-3a4 4 0 0 1 -3 -4z"/>
                <path d="M9 12c.5 -.3 1 -.3 1.5 0"/>
                <path d="M13.5 12c.5 -.3 1 -.3 1.5 0"/>
                <path d="M11 16h2"/>`
      };

      // SVG dasharray hesaplama (r=66 â†’ Ã§evre â‰ˆ 414.69)
      const r = 66;
      const circ = 2 * Math.PI * r;
      const dashOffset = circ * (1 - pct / 100);

      const html = `
        <div class="q-completion">
          <div class="q-completion-circle">
            <svg viewBox="0 0 150 150">
              <circle class="ring-bg" cx="75" cy="75" r="${r}"></circle>
              <circle class="ring-fg ${ringClass}" cx="75" cy="75" r="${r}"
                stroke-dasharray="${circ.toFixed(2)}"
                stroke-dashoffset="${dashOffset.toFixed(2)}"></circle>
            </svg>
            <div class="pct">
              <div class="pct-num">${pct}%</div>
              <div class="pct-label">DoÄŸruluk</div>
            </div>
            <div class="q-completion-cat ${catVariant}" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                ${catPaths[catVariant]}
              </svg>
            </div>
          </div>
          <h2>${title}</h2>
          <p class="q-completion-sub">${sub}</p>
          <div class="q-completion-stats">
            <div class="q-stat q-stat-correct">
              <span class="q-stat-num">${correct}</span>
              <span class="q-stat-label">DoÄŸru</span>
            </div>
            <div class="q-stat q-stat-incorrect">
              <span class="q-stat-num">${incorrect}</span>
              <span class="q-stat-label">YanlÄ±ÅŸ</span>
            </div>
            ${skipped > 0 ? `
            <div class="q-stat q-stat-skipped">
              <span class="q-stat-num">${skipped}</span>
              <span class="q-stat-label">AtlanmÄ±ÅŸ</span>
            </div>` : ''}
          </div>
          ${incorrect > 0 ? `
          <a class="q-completion-review" href="panelim#wrong" id="reviewWrongBtn">
            YanlÄ±ÅŸlarÄ± Ä°ncele &rsaquo;
          </a>` : ''}
          <div class="q-completion-actions">
            <button class="q-comp-btn q-comp-btn-primary" type="button" id="restartSetBtn">Tekrar BaÅŸla</button>
            <a class="q-comp-btn q-comp-btn-ghost" href="sat-soru-bankasi-rw">Soru BankasÄ±na DÃ¶n</a>
          </div>
        </div>
      `;

      document.getElementById('qPageWrap').innerHTML = html;
      document.getElementById('qActionbar').style.display = 'none';

      document.getElementById('restartSetBtn').addEventListener('click', () => {
        clearAnswersForSet(SUBCATEGORY_LIST.map(i => i.slug));
        resetReached();
        if (SET_KEY) {
          if (SET_URL_PARAMS.includes('shuffle=1')) {
            const slugsOnly = SUBCATEGORY_LIST.map(i => i.slug);
            shuffleInPlace(slugsOnly);
            sessionStorage.setItem(SET_KEY, JSON.stringify(slugsOnly));
            gotoSlug(slugsOnly[0]);
            return;
          }
        }
        gotoSlug(SUBCATEGORY_LIST[0].slug);
      });
    }

    // ==========================================================================
    // === DENEME (gerÃ§ek sÄ±nav) â€” Bitir akÄ±ÅŸÄ± + sonuÃ§ ekranÄ± + inceleme barÄ± ===
    // TÃ¼m bu fonksiyonlar YALNIZCA GRI_DENEME_MODE true iken Ã§aÄŸrÄ±lÄ±r.
    // ==========================================================================

    // "Denemeyi Bitir" â€” doÄŸru cevaplarÄ± TEK sorguda Ã§ek, puanla, sonucu gÃ¶ster.
    async function finishExam() {
      if (!GRI_DENEME_MODE || GRI_EXAM_REVIEW || !GRI_DENEME_PARAM) return;
      const answers = examGetAll();
      const total = SUBCATEGORY_LIST.length;
      const answeredCount = SUBCATEGORY_LIST.reduce((a, i) => a + (answers[i.slug] ? 1 : 0), 0);
      const unanswered = total - answeredCount;
      let msg = 'Denemeyi bitirmek istediÄŸine emin misin? Bitirdikten sonra cevaplarÄ±nÄ± deÄŸiÅŸtiremezsin.';
      if (unanswered > 0) msg = unanswered + ' soruyu boÅŸ bÄ±raktÄ±n. Yine de denemeyi bitirmek istiyor musun?';
      if (!window.confirm(msg)) return;

      const finishBtn = document.getElementById('examFinishBtn');
      if (finishBtn) { finishBtn.disabled = true; finishBtn.textContent = 'HesaplanÄ±yorâ€¦'; }

      const tag = 'deneme:' + GRI_DENEME_PARAM;
      let data = null, error = null;
      try {
        const res = await supabase.from('questions')
          .select('slug,correct_answer,subcategory')
          .eq('active', true).contains('tags', [tag]);
        data = res.data; error = res.error;
      } catch (e) { error = e; }

      if (error || !data || data.length === 0) {
        if (finishBtn) { finishBtn.disabled = false; finishBtn.textContent = 'Denemeyi Bitir'; }
        alert('SonuÃ§ hesaplanamadÄ±. Ä°nternet baÄŸlantÄ±nÄ± kontrol edip tekrar dene.');
        return;
      }

      let correct = 0;
      const bySub = {};
      data.forEach(row => {
        const sub = row.subcategory || 'diÄŸer';
        if (!bySub[sub]) bySub[sub] = { correct: 0, total: 0 };
        bySub[sub].total++;
        const chosen = answers[row.slug];
        const ok = !!chosen && chosen === row.correct_answer;
        if (ok) { correct++; bySub[sub].correct++; }
        // Ä°nceleme navigatÃ¶rÃ¼ + panelim tutarlÄ±lÄ±ÄŸÄ±: yalnÄ±zca cevaplananlarÄ± iÅŸaretle.
        if (chosen) examPersistResult(row.slug, ok ? 'correct' : 'incorrect');
      });

      const totalQ = data.length;
      const pct = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
      showExamResult({ correct: correct, total: totalQ, pct: pct, bySub: bySub });
    }

    // SonuÃ§ overlay'i: bÃ¼yÃ¼k skor + subcategory dÃ¶kÃ¼mÃ¼ + "YanÄ±tlarÄ± Ä°ncele".
    function showExamResult(res) {
      if (document.getElementById('gri-exam-result')) return;
      const rows = Object.keys(res.bySub).sort().map(sub => {
        const s = res.bySub[sub];
        const label = SUBCATEGORY_LABELS[sub] || humanize(sub);
        return `<div class="exr-row"><span class="exr-sub">${esc(label)}</span><span class="exr-val">${s.correct} / ${s.total}</span></div>`;
      }).join('');
      const ov = document.createElement('div');
      ov.id = 'gri-exam-result';
      ov.className = 'gri-exam-overlay';
      ov.innerHTML = `
        <div class="exr-card">
          <div class="exr-badge">DENEME SONUCU</div>
          <div class="exr-score"><span class="exr-score-num">${res.correct}</span><span class="exr-score-den">/ ${res.total}</span></div>
          <div class="exr-pct">%${res.pct} doÄŸru</div>
          <div class="exr-breakdown">${rows}</div>
          <button type="button" class="exr-review-btn" id="examReviewBtn">YanÄ±tlarÄ± Ä°ncele</button>
          <a class="exr-exit" href="panelim">Ã‡alÄ±ÅŸma Masama DÃ¶n</a>
        </div>`;
      document.body.appendChild(ov);
      const finishBtn = document.getElementById('examFinishBtn');
      if (finishBtn) finishBtn.style.display = 'none';
      document.getElementById('examReviewBtn').addEventListener('click', () => {
        try { sessionStorage.setItem('gri.exam.review.' + GRI_DENEME_PARAM, '1'); } catch (e) {}
        GRI_EXAM_REVIEW = true;
        if (SUBCATEGORY_LIST.length > 0) gotoSlug(SUBCATEGORY_LIST[0].slug);
      });
    }

    // "Denemeyi Bitir" sabit butonu (yalnÄ±zca sÄ±nav sÄ±rasÄ±nda, inceleme deÄŸil).
    function setupExamFinishButton() {
      if (!GRI_DENEME_MODE || GRI_EXAM_REVIEW) return;
      if (document.getElementById('examFinishBtn')) return;
      const btn = document.createElement('button');
      btn.id = 'examFinishBtn';
      btn.type = 'button';
      btn.className = 'gri-exam-finish';
      btn.textContent = 'Denemeyi Bitir';
      btn.addEventListener('click', finishExam);
      document.body.appendChild(btn);
    }

    // Ä°nceleme modu Ã§ubuÄŸu + Ã§Ä±kÄ±ÅŸ.
    function setupExamReviewBar() {
      if (!(GRI_DENEME_MODE && GRI_EXAM_REVIEW)) return;
      if (document.getElementById('examReviewBar')) return;
      const bar = document.createElement('div');
      bar.id = 'examReviewBar';
      bar.className = 'gri-exam-reviewbar';
      bar.innerHTML = '<span>Ä°nceleme modu</span><button type="button" id="examReviewExit">Ã‡Ä±kÄ±ÅŸ</button>';
      document.body.appendChild(bar);
      document.getElementById('examReviewExit').addEventListener('click', () => {
        try { sessionStorage.removeItem('gri.exam.review.' + GRI_DENEME_PARAM); } catch (e) {}
        location.href = 'panelim';
      });
    }

    // === SPR / Grid-in helpers ===
    // Bir soru SPR (Ã¶ÄŸrenci-Ã¼retimli cevap) tipiyse options boÅŸ dizidir.
    function isSprQuestion(q) {
      return !!q && Array.isArray(q.options) && q.options.length === 0;
    }
    // Girilen ham cevabÄ± sayÄ±sal deÄŸere normalize et.
    // Kabul edilen biÃ§imler: tam sayÄ±, ondalÄ±k (".5", "0.5"), kesir ("1/2"), Ã¶nde +/-.
    // GeÃ§ersizse null dÃ¶ner.
    function parseSprValue(raw) {
      if (raw == null) return null;
      var s = String(raw).trim();
      if (!s) return null;
      s = s.replace(/\s+/g, '').replace(/^\+/, '');
      // Basit kesir a/b
      if (/^-?\d+\/\d+$/.test(s)) {
        var parts = s.split('/');
        var a = parseFloat(parts[0]);
        var b = parseFloat(parts[1]);
        if (!b) return null;
        return a / b;
      }
      // OndalÄ±k / tam sayÄ± (Ã¶nde nokta destekli: ".5")
      if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
        var n = parseFloat(s);
        return isNaN(n) ? null : n;
      }
      return null;
    }
    // KullanÄ±cÄ±nÄ±n cevabÄ±, "|" ile ayrÄ±lmÄ±ÅŸ kabul listesindeki herhangi biriyle eÅŸleÅŸiyor mu?
    function sprIsCorrect(userRaw, acceptedRaw) {
      var u = parseSprValue(userRaw);
      if (u == null) return false;
      var accepted = String(acceptedRaw == null ? '' : acceptedRaw).split('|');
      for (var i = 0; i < accepted.length; i++) {
        var a = parseSprValue(accepted[i]);
        if (a == null) continue;
        if (Math.abs(u - a) < 1e-6) return true;
      }
      return false;
    }

    function renderQuestion(q) {
      // Freemium gate: gÃ¶rÃ¼lmemiÅŸ yeni soru + gÃ¼nlÃ¼k Ã¼cretsiz hak dolduysa â†’ paywall
      try {
        if (q && q.slug && !GRI_DENEME_MODE && !getAnswerStatus(q.slug) && griLimitReached()) {
          griShowPaywall();
          return;
        }
      } catch (e) {}
      // Body data-cat for color theming
      document.body.setAttribute('data-cat', q.exam_type);

      // Gri AI iÃ§in soru bilgisini global'e yaz
      window.GriCurrentQuestion = {
        id: q.id,
        slug: q.slug,
        exam_type: q.exam_type,
        section: q.section,
        category: q.category,
        subcategory: q.subcategory
      };
      try {
        window.dispatchEvent(new CustomEvent('gri-question-change', { detail: window.GriCurrentQuestion }));
      } catch (e) {}

      // Bookmark state'i yenile
      if (typeof window.refreshBookmarkState === 'function') {
        window.refreshBookmarkState();
      }
      // Not state'i yenile
      if (typeof window.refreshNoteState === 'function') {
        window.refreshNoteState();
      }

      // Page title
      const examLabel = EXAM_LABELS[q.exam_type] || q.exam_type;
      const subLabel = SUBCATEGORY_LABELS[q.subcategory] || humanize(q.subcategory);
      document.title = `${subLabel} | Gri English`;

      // Breadcrumb
      const examPage = q.exam_type + '.html';
      const bankPage = q.exam_type + '-soru-bankasi.html';
      document.getElementById('bcExam').textContent = examLabel;
      document.getElementById('bcExam').href = bankPage;

      // Section breadcrumb: sadece gerÃ§ekten section sayfasÄ± olan sÄ±navlarda gÃ¶ster
      // DiÄŸerleri (TOEFL, IB, IELTS, UDSP) tek soru bankasÄ± sayfasÄ±na sahip, section item gerekmez
      const SECTION_PAGES = {
        'sat': ['rw', 'math'],
        'yds': ['yds', 'yokdil-fen', 'yokdil-sosyal', 'yokdil-saglik']
      };
      const sectionWrap = document.getElementById('bcSectionWrap');
      const hasSectionPage = SECTION_PAGES[q.exam_type] && SECTION_PAGES[q.exam_type].includes(q.section);
      if (hasSectionPage) {
        const sectionPage = `${q.exam_type}-soru-bankasi-${q.section}.html`;
        document.getElementById('bcSection').textContent = SECTION_LABELS[q.section] || q.section || '';
        document.getElementById('bcSection').href = sectionPage;
        sectionWrap.style.display = '';
      } else {
        sectionWrap.style.display = 'none';
      }

      document.getElementById('bcCurrent').textContent = subLabel;

      // Texts (passage)
      const textsEl = document.getElementById('qTexts');
      const gridEl = document.getElementById('qGrid');
      if (q.passage && q.passage.texts) {
        // Smart split: bazÄ± kayÄ±tlarda Text 1 ve Text 2 tek bir content
        // iÃ§ine gÃ¶mÃ¼lÃ¼ymÃ¼ÅŸ gibi geliyor. Pattern bulunursa ikiye ayÄ±r.
        const splitInlineTexts = function (txts) {
          const out = [];
          txts.forEach(function (t) {
            const c = (t.content || '').toString();
            const hasMarkers = /Text\s*1\s*[:.\)]/i.test(c) && /Text\s*2\s*[:.\)]/i.test(c);
            if (hasMarkers) {
              // Marker'lardan ayÄ±r
              const parts = c.split(/(?=Text\s*\d+\s*[:.\)])/i).filter(Boolean);
              parts.forEach(function (p) {
                const m = p.match(/^(Text\s*\d+)\s*[:.\)]\s*([\s\S]*)$/i);
                if (m) {
                  out.push({ label: m[1].trim(), content: m[2].trim() });
                } else {
                  out.push({ label: t.label || '', content: p.trim() });
                }
              });
            } else {
              out.push(t);
            }
          });
          return out;
        };
        const renderedTexts = splitInlineTexts(q.passage.texts);
        // Åiir: "/" satÄ±r sonu, "//" kÄ±ta sonu. 3+ " / " varsa dize dÃ¼zeni uygula.
        const renderPassageContent = function (c) {
          const text = (c || '').toString();
          const slashCount = (text.match(/\s\/\s/g) || []).length;
          if (slashCount >= 3) {
            const v = safeHtml(text).replace(/\s*\/\/\s*/g, '\n\n').replace(/\s*\/\s*/g, '\n');
            return '<div class="q-verse">' + v + '</div>';
          }
          return '<p>' + safeHtml(text) + '</p>';
        };
        textsEl.innerHTML = renderedTexts.map(t =>
          `<p class="text-label">${esc(t.label)}</p>${renderPassageContent(t.content)}`
        ).join('') + '<p class="q-hint q-hint-texts">Vurgulamak iÃ§in metnin bir kÄ±smÄ±nÄ± seÃ§</p>';
        textsEl.style.display = '';
        if (gridEl) gridEl.classList.remove('no-texts');
      } else {
        textsEl.style.display = 'none';
        if (gridEl) gridEl.classList.add('no-texts');
      }

      // Prompt
      document.getElementById('qPrompt').innerHTML = safeHtml(q.question_text);

      // Options
      const optionsEl = document.getElementById('qOptions');
      optionsEl.dataset.correct = q.correct_answer;
      const spr = isSprQuestion(q);
      optionsEl.dataset.spr = spr ? '1' : '';
      const optHint = document.querySelector('.q-hint-options');
      if (spr) {
        // SPR / Grid-in: 4 ÅŸÄ±k yerine sayÄ±sal metin giriÅŸi
        if (optHint) optHint.style.display = 'none';
        optionsEl.innerHTML = `
          <div class="q-spr" id="qSpr">
            <label class="q-spr-label" for="qSprInput">CevabÄ±nÄ± gir</label>
            <div class="q-spr-row">
              <input type="text" id="qSprInput" class="q-spr-input" inputmode="text"
                     autocomplete="off" autocapitalize="off" spellcheck="false"
                     placeholder="Ã¶r. 7 Â· 1.5 Â· 3/4" aria-label="CevabÄ±n">
              <button type="button" id="qSprCheck" class="q-spr-check">Kontrol Et</button>
            </div>
            <div class="q-spr-feedback" id="qSprFeedback" aria-live="polite"></div>
            <p class="q-spr-note">Tam sayÄ±, ondalÄ±k veya kesir girebilirsin. 1/2, 0.5 ve .5 aynÄ± kabul edilir.</p>
          </div>`;
      } else {
        if (optHint) optHint.style.display = '';
        optionsEl.innerHTML = q.options.map(opt => `
        <label class="q-option">
          <input type="radio" name="answer" value="${esc(opt.letter)}">
          <span class="q-letter">${esc(opt.letter)}</span>
          <span class="q-option-text">${safeHtml(opt.text)}</span>
          <span class="q-status-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 8 7 12 13 4" class="icon-check"/>
              <g class="icon-x"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></g>
            </svg>
          </span>
        </label>
      `).join('');
      }

      // Explanation tabs and panels
      const tabsEl = document.getElementById('expTabs');
      const contentEl = document.getElementById('expContent');
      const correctLetter = q.correct_answer;

      // Detect explanation format:
      //   "single"  â†’ explanations.answer.steps  (one solution path, no per-option tabs)
      //   "perOpt"  â†’ explanations.{letter}.steps (one explanation per option, A-E or more)
      const hasPerOptExp = q.explanations && q.options && q.options.some(o =>
        q.explanations[o.letter]
      );
      const hasSingleExp = q.explanations && q.explanations.answer && q.explanations.answer.steps;

      // Debug log: hangi format algÄ±landÄ±, explanations ÅŸekli ne
      console.log('[soru.html] explanation diag:', {
        slug: q.slug,
        hasPerOptExp,
        hasSingleExp,
        explanationsType: typeof q.explanations,
        explanationsKeys: q.explanations ? Object.keys(q.explanations) : null,
        rawExplanations: q.explanations
      });

      try {
        if (spr) {
        // SPR / Grid-in EXPLANATION â€” no tabs; doÄŸru cevabÄ± + adÄ±m adÄ±m Ã§Ã¶zÃ¼mÃ¼ gÃ¶ster
        tabsEl.innerHTML = '';
        tabsEl.style.display = 'none';
        const accDisplay = String(q.correct_answer || '').split('|').join('  Â·  ');
        const sprSteps = (q.explanations && q.explanations.answer && q.explanations.answer.steps) || [];
        const sprStepsHtml = sprSteps.map(step => `
          <div class="exp-step">
            <h4>${esc(step.title || '')}</h4>
            ${step.body ? `<div class="exp-body">${safeHtml(step.body)}</div>` : ''}
            ${step.quote ? `<blockquote>${safeHtml(step.quote)}</blockquote>` : ''}
          </div>
        `).join('') || '<div class="exp-empty">Bu soru iÃ§in adÄ±m adÄ±m aÃ§Ä±klama henÃ¼z eklenmemiÅŸ.</div>';
        contentEl.innerHTML = `
          <div class="exp-panel active">
            <div class="exp-answer-box correct">
              <span class="exp-answer-letter">âœ“</span>
              <div class="exp-answer-text">
                <span class="exp-answer-status">DoÄŸru Cevap</span>
                <strong>${esc(accDisplay)}</strong>
              </div>
            </div>
            ${sprStepsHtml}
          </div>
        `;
      } else if (!hasPerOptExp && hasSingleExp) {
        // SINGLE EXPLANATION MODE â€” no tabs
        tabsEl.innerHTML = '';
        tabsEl.style.display = 'none';
        const correctOpt = q.options.find(o => o.letter === correctLetter) || {};
        const stepsHtml = (q.explanations.answer.steps || []).map(step => `
          <div class="exp-step">
            <h4>${esc(step.title || '')}</h4>
            ${step.body ? `<div class="exp-body">${safeHtml(step.body)}</div>` : ''}
            ${step.quote ? `<blockquote>${safeHtml(step.quote)}</blockquote>` : ''}
          </div>
        `).join('');
        contentEl.innerHTML = `
          <div class="exp-panel active">
            <div class="exp-answer-box correct">
              <span class="exp-answer-letter">${esc(correctLetter)}</span>
              <div class="exp-answer-text">
                <span class="exp-answer-status">DoÄŸru Cevap</span>
                ${safeHtml(correctOpt.text || '')}
              </div>
            </div>
            ${stepsHtml}
          </div>
        `;
      } else if (!hasPerOptExp && !hasSingleExp) {
        // NO EXPLANATION AVAILABLE â€” show fallback with at least the correct answer
        tabsEl.innerHTML = '';
        tabsEl.style.display = 'none';
        const correctOpt = q.options.find(o => o.letter === correctLetter) || {};
        contentEl.innerHTML = `
          <div class="exp-panel active">
            <div class="exp-answer-box correct">
              <span class="exp-answer-letter">${esc(correctLetter)}</span>
              <div class="exp-answer-text">
                <span class="exp-answer-status">DoÄŸru Cevap</span>
                ${safeHtml(correctOpt.text || '')}
              </div>
            </div>
            <div class="exp-empty">Bu soru iÃ§in adÄ±m adÄ±m aÃ§Ä±klama henÃ¼z eklenmemiÅŸ.</div>
          </div>
        `;
      } else {
        // PER-OPTION EXPLANATION MODE â€” one tab per option (A-E or any count)
        tabsEl.style.display = '';
        tabsEl.innerHTML = q.options.map(opt => `
          <button class="exp-tab${opt.letter === correctLetter ? ' active' : ''}" data-opt="${esc(opt.letter)}">
            SeÃ§enek ${esc(opt.letter)}
          </button>
        `).join('');

        contentEl.innerHTML = q.options.map(opt => {
          const explanation = q.explanations[opt.letter];
          if (!explanation) return '';
          const isCorrect = opt.letter === correctLetter;
          const boxClass = isCorrect ? 'correct' : 'incorrect';
          const statusLabel = isCorrect ? 'DoÄŸru Cevap' : 'YanlÄ±ÅŸ Cevap';
          const stepsHtml = (explanation.steps || []).map(step => `
            <div class="exp-step">
              <h4>${esc(step.title || '')}</h4>
              ${step.body ? `<div class="exp-body">${safeHtml(step.body)}</div>` : ''}
              ${step.quote ? `<blockquote>${safeHtml(step.quote)}</blockquote>` : ''}
            </div>
          `).join('');

          return `
            <div class="exp-panel${isCorrect ? ' active' : ''}" data-opt="${esc(opt.letter)}">
              <div class="exp-answer-box ${boxClass}">
                <span class="exp-answer-letter">${esc(opt.letter)}</span>
                <div class="exp-answer-text">
                  <span class="exp-answer-status">${statusLabel}</span>
                  ${safeHtml(opt.text)}
                </div>
              </div>
              ${stepsHtml}
            </div>
          `;
        }).join('');
        }
      } catch (renderErr) {
        console.error('[soru.html] explanation render error:', renderErr, 'q.explanations:', q.explanations);
        const correctOpt = q.options.find(o => o.letter === correctLetter) || {};
        tabsEl.innerHTML = '';
        tabsEl.style.display = 'none';
        contentEl.innerHTML = `
          <div class="exp-panel active">
            <div class="exp-answer-box correct">
              <span class="exp-answer-letter">${esc(correctLetter)}</span>
              <div class="exp-answer-text">
                <span class="exp-answer-status">DoÄŸru Cevap</span>
                ${safeHtml(correctOpt.text || '')}
              </div>
            </div>
            <div class="exp-empty">AÃ§Ä±klama yÃ¼klenirken bir hata oluÅŸtu. SayfayÄ± yenile veya yÃ¶neticiye bildir.</div>
          </div>
        `;
      }

      // Tags chip bar (category + subcategory only; difficulty shown via grid colors)
      const tagsBarEl = document.getElementById('qTagsBar');
      const tagsHtml = [];
      // Ä°ngilizce etiket â†’ lang="en" (noktasÄ±z uppercase); TÃ¼rkÃ§e etiket â†’ dokunma (Ä° korunur).
      // TÃ¼rkÃ§e-Ã¶zel harf yoksa ama ASCII-TÃ¼rkÃ§e ("Dilbilgisi") ise de Ä°ngilizce sayma.
      const _isEnLabel = s => !/[Ã§ÄŸÄ±Ã¶ÅŸÃ¼Ä°Ã‡ÄÃ–ÅÃœ]/.test(s) && !/\b(dilbilgisi)\b/i.test(s);
      if (q.category) {
        const _cl = CATEGORY_LABELS[q.category] || humanize(q.category);
        tagsHtml.push(`<span class="q-tag-chip primary"${_isEnLabel(_cl) ? ' lang="en"' : ''}>${esc(_cl)}</span>`);
      }
      if (q.subcategory) {
        const _sl = SUBCATEGORY_LABELS[q.subcategory] || humanize(q.subcategory);
        tagsHtml.push(`<span class="q-tag-chip"${_isEnLabel(_sl) ? ' lang="en"' : ''}>${esc(_sl)}</span>`);
      }
      tagsBarEl.innerHTML = tagsHtml.join('');

      // Highlight restore (login kullanÄ±cÄ± + 12 saatlik kayÄ±t varsa)
      if (window.GriHighlights && q.slug) {
        window.GriHighlights.restoreHighlights(q.slug);
      }

      // Navigator is now populated by renderNavigator() from real DB data
    }

    function attachInteractivity() {
      // Option selection â€” multi-attempt: wrong locks only that one, correct locks all
      const options = document.querySelectorAll('.q-option');
      const optionsContainer = document.getElementById('qOptions');
      const isSpr = optionsContainer.dataset.spr === '1';
      const correctLetter = optionsContainer.dataset.correct;
      const currentSlug = SUBCATEGORY_LIST[CURRENT_INDEX]?.slug;
      const priorAnswer = currentSlug ? getAnswerStatus(currentSlug) : null;
      let firstAttemptRecorded = !!priorAnswer; // already answered â†’ don't overwrite

      // === SPR / Grid-in: sayÄ±sal giriÅŸ + Kontrol ===
      if (isSpr) {
        const sprInput = document.getElementById('qSprInput');
        const sprCheck = document.getElementById('qSprCheck');
        const sprFeedback = document.getElementById('qSprFeedback');
        const acceptedRaw = correctLetter; // "|" ile ayrÄ±lmÄ±ÅŸ kabul listesi
        const firstAccepted = String(acceptedRaw || '').split('|')[0] || '';

        function submitSpr() {
          if (!sprInput || sprInput.disabled) return;
          const val = sprInput.value;
          if (parseSprValue(val) == null) {
            sprFeedback.textContent = 'GeÃ§erli bir sayÄ± gir (Ã¶r. 7, 1.5 veya 3/4).';
            sprFeedback.className = 'q-spr-feedback incorrect';
            return;
          }
          const ok = sprIsCorrect(val, acceptedRaw);
          if (!firstAttemptRecorded) {
            if (currentSlug) {
              setAnswerStatus(currentSlug, ok ? 'correct' : 'incorrect');
              renderNavigator();
            }
            firstAttemptRecorded = true;
          }
          sprInput.disabled = true;
          sprCheck.disabled = true;
          sprInput.classList.remove('correct', 'incorrect');
          if (ok) {
            sprInput.classList.add('correct');
            sprFeedback.textContent = 'DoÄŸru! AdÄ±m adÄ±m Ã§Ã¶zÃ¼m iÃ§in AÃ§Ä±klamaâ€™ya bakabilirsin.';
            sprFeedback.className = 'q-spr-feedback correct';
            stopTimer();
          } else {
            sprInput.classList.add('incorrect');
            sprFeedback.textContent = 'YanlÄ±ÅŸ. DoÄŸru cevap ve Ã§Ã¶zÃ¼m iÃ§in AÃ§Ä±klamaâ€™yÄ± aÃ§.';
            sprFeedback.className = 'q-spr-feedback incorrect';
          }
        }

        if (priorAnswer && sprInput) {
          // Revizit: doÄŸru cevabÄ± gÃ¶ster (MCQ'deki gibi doÄŸru ÅŸÄ±k her zaman aÃ§Ä±lÄ±r)
          sprInput.value = firstAccepted;
          sprInput.disabled = true;
          if (sprCheck) sprCheck.disabled = true;
          sprInput.classList.add('correct');
          sprFeedback.textContent = priorAnswer === 'correct'
            ? 'Bu soruyu doÄŸru cevaplamÄ±ÅŸtÄ±n.'
            : 'Ã–nceki denemende yanlÄ±ÅŸtÄ± â€” doÄŸru cevap gÃ¶steriliyor.';
          sprFeedback.className = 'q-spr-feedback ' + (priorAnswer === 'correct' ? 'correct' : 'incorrect');
        }

        if (sprCheck) sprCheck.addEventListener('click', submitSpr);
        if (sprInput) sprInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); submitSpr(); }
        });
      }

      // === DENEME (sÄ±nav) modu geri-yÃ¼kleme Ã§atalÄ± ===
      // SÄ±nav: nÃ¶tr seÃ§im gÃ¶ster (reveal YOK). Ä°nceleme: kullanÄ±cÄ± cevabÄ± + doÄŸru + kilit.
      if (GRI_DENEME_MODE && !isSpr) {
        const examChosen = currentSlug ? examGet(currentSlug) : null;
        if (GRI_EXAM_REVIEW) {
          // Ä°nceleme: doÄŸru ÅŸÄ±kÄ± yeÅŸil iÅŸaretle; kullanÄ±cÄ± yanlÄ±ÅŸ seÃ§tiyse onu kÄ±rmÄ±zÄ± iÅŸaretle.
          options.forEach(o => {
            const letter = o.querySelector('input')?.value;
            const inp = o.querySelector('input');
            if (letter === correctLetter) o.classList.add('answered', 'correct');
            if (examChosen && letter === examChosen) {
              if (inp) inp.checked = true;
              if (letter !== correctLetter) o.classList.add('answered', 'incorrect');
            }
          });
          optionsContainer.classList.add('locked');
        } else {
          // SÄ±nav sÄ±rasÄ±nda: yalnÄ±zca nÃ¶tr seÃ§im iÅŸareti (doÄŸru/yanlÄ±ÅŸ BELLÄ° ETMEZ).
          if (examChosen) {
            options.forEach(o => {
              const letter = o.querySelector('input')?.value;
              if (letter === examChosen) {
                o.classList.add('sel');
                const inp = o.querySelector('input');
                if (inp) inp.checked = true;
              }
            });
          }
        }
      }

      // Restore visual state if question was previously answered (any revisit)
      // NOT: Deneme modunda bu blok ATLANIR â€” yukarÄ±daki sÄ±nav Ã§atalÄ± devreye girer.
      if (!isSpr && priorAnswer && !GRI_DENEME_MODE) {
        options.forEach(o => {
          const letter = o.querySelector('input')?.value;
          if (letter === correctLetter) {
            o.classList.add('answered', 'correct');
            const inp = o.querySelector('input');
            if (inp) inp.checked = true;
          }
        });
        optionsContainer.classList.add('locked');
      }

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          // === DENEME (sÄ±nav) modu: anÄ±nda feedback YOK â€” nÃ¶tr seÃ§ + sakla ===
          if (GRI_DENEME_MODE) {
            if (GRI_EXAM_REVIEW) return; // inceleme: seÃ§im deÄŸiÅŸtirilemez
            const inputEx = opt.querySelector('input');
            const chosenLetter = inputEx ? inputEx.value : null;
            if (!chosenLetter) return;
            opt.classList.remove('eliminated');
            options.forEach(o => o.classList.remove('sel'));
            opt.classList.add('sel');
            inputEx.checked = true;
            if (currentSlug) { examSet(currentSlug, chosenLetter); renderNavigator(); }
            return;
          }

          // Skip already-answered options (could be tried-wrong or set-correct)
          if (opt.classList.contains('answered')) return;
          // Skip everything if container is locked (correct already found)
          if (optionsContainer.classList.contains('locked')) return;

          const input = opt.querySelector('input');
          const clickedLetter = input ? input.value : null;
          if (!clickedLetter) return;

          const isCorrect = clickedLetter === correctLetter;

          // Record first attempt only (subsequent retries don't change recorded status)
          if (!firstAttemptRecorded) {
            if (currentSlug) {
              setAnswerStatus(currentSlug, isCorrect ? 'correct' : 'incorrect');
              renderNavigator();
            }
            firstAttemptRecorded = true;
          }

          opt.classList.add('answered');
          if (isCorrect) {
            opt.classList.add('correct');
            optionsContainer.classList.add('locked');
            stopTimer();
          } else {
            opt.classList.add('incorrect');
          }

          input.checked = true;
        });

        // Eleme â€” saÄŸ tÄ±k (desktop). Deneme modunda kutu kilidi elemeyi engellemez.
        opt.addEventListener('contextmenu', (e) => {
          if (opt.classList.contains('answered')) return;
          if (!GRI_DENEME_MODE && optionsContainer.classList.contains('locked')) return;
          e.preventDefault();
          opt.classList.toggle('eliminated');
        });

        // Eleme â€” basÄ±lÄ± tutma (touch)
        let pressTimer = null;
        opt.addEventListener('touchstart', () => {
          if (opt.classList.contains('answered')) return;
          if (!GRI_DENEME_MODE && optionsContainer.classList.contains('locked')) return;
          pressTimer = setTimeout(() => {
            opt.classList.toggle('eliminated');
            pressTimer = null;
          }, 500);
        }, { passive: true });
        opt.addEventListener('touchend', () => {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        });
        opt.addEventListener('touchmove', () => {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        });
      });

      // Timer â€” auto-starts on fresh question; for already-answered, show 00:00 stopped
      const timerEl = document.getElementById('qTimer');
      const timerToggle = document.getElementById('qTimerToggle');
      if (priorAnswer) {
        stopTimer();
        timerSeconds = 0;
        renderTimer();
      } else {
        startTimer();
      }
      // Restore hidden preference from session
      if (sessionStorage.getItem('gri.timer.hidden') === '1') {
        timerEl.classList.add('timer-hidden');
        timerToggle.setAttribute('aria-label', 'ZamanlayÄ±cÄ±yÄ± gÃ¶ster');
      }
      timerToggle.addEventListener('click', () => {
        const nowHidden = !timerEl.classList.contains('timer-hidden');
        timerEl.classList.toggle('timer-hidden', nowHidden);
        sessionStorage.setItem('gri.timer.hidden', nowHidden ? '1' : '0');
        timerToggle.setAttribute('aria-label', nowHidden ? 'ZamanlayÄ±cÄ±yÄ± gÃ¶ster' : 'ZamanlayÄ±cÄ±yÄ± gizle');
      });

      // Explanation panel toggle
      const grid = document.getElementById('qGrid');
      const explainBtn = document.getElementById('explainBtn');
      const expClose = document.getElementById('expClose');

      // SINAV sÄ±rasÄ±nda (inceleme deÄŸil) aÃ§Ä±klama butonunu gizle â€” cevap sÄ±zmasÄ±n.
      // Ä°nceleme modunda ve normal soru bankasÄ±nda gÃ¶rÃ¼nÃ¼r kalÄ±r.
      if (explainBtn) {
        explainBtn.style.display = (GRI_DENEME_MODE && !GRI_EXAM_REVIEW) ? 'none' : '';
      }

      // Deneme (sÄ±nav) yardÄ±mcÄ± UI'larÄ± â€” yalnÄ±zca deneme modunda.
      if (GRI_DENEME_MODE) {
        setupExamFinishButton();
        setupExamReviewBar();
      }

      function openExplanation() {
        grid.classList.add('show-explanation');
        explainBtn.classList.add('active');
        const checked = document.querySelector('.q-option input:checked');
        if (checked) showExpPanel(checked.value);
        if (window.innerWidth <= 1000) {
          setTimeout(() => {
            document.getElementById('qExplanation').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      }
      function closeExplanation() {
        grid.classList.remove('show-explanation');
        explainBtn.classList.remove('active');
      }

      explainBtn.addEventListener('click', () => {
        if (grid.classList.contains('show-explanation')) closeExplanation();
        else openExplanation();
      });
      if (expClose) expClose.addEventListener('click', closeExplanation);

      // SÃ¶zlÃ¼k butonu
      const vocabBtn = document.getElementById('vocabBtn');
      if (vocabBtn) {
        vocabBtn.addEventListener('click', function () {
          // EÄŸer kullanÄ±cÄ± pasajdan kelime seÃ§tiyse onu prefill et
          const sel = window.getSelection();
          const selectedText = sel ? sel.toString().trim() : '';
          const rect = vocabBtn.getBoundingClientRect();
          if (window.GriVocab) {
            if (selectedText && selectedText.length <= 60) {
              // DoÄŸrudan ara
              window.GriVocab.openWithWord(selectedText, rect);
            } else {
              // Arama kutusu aÃ§
              window.GriVocab.openSearch(rect, '');
            }
          }
        });
      }

      function showExpPanel(opt) {
        document.querySelectorAll('.exp-tab').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-opt') === opt);
        });
        document.querySelectorAll('.exp-panel').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-opt') === opt);
        });
      }
      document.querySelectorAll('.exp-tab').forEach(t => {
        t.addEventListener('click', () => showExpPanel(t.getAttribute('data-opt')));
      });

      // Prev (previous in set), KarÄ±ÅŸtÄ±r (reshuffle whole set), Next (next unanswered, completion when none)
      document.getElementById('prevBtn').addEventListener('click', () => {
        if (SUBCATEGORY_LIST.length === 0) return;
        if (SUBCATEGORY_LIST.length === 1) {
          alert('Bu sette tek soru var.');
          return;
        }
        const prevIdx = (CURRENT_INDEX - 1 + SUBCATEGORY_LIST.length) % SUBCATEGORY_LIST.length;
        gotoSlug(SUBCATEGORY_LIST[prevIdx].slug);
      });

      // DENEME modunda sÄ±ra sabittir â†’ KarÄ±ÅŸtÄ±r butonunu gizle (yeniden sÄ±ralama yok).
      const _remixBtn = document.getElementById('remixBtn');
      if (_remixBtn && GRI_DENEME_MODE) _remixBtn.style.display = 'none';
      document.getElementById('remixBtn').addEventListener('click', () => {
        if (GRI_DENEME_MODE) return; // deneme: sÄ±ra sabit, karÄ±ÅŸtÄ±rma yok
        if (SUBCATEGORY_LIST.length <= 1) {
          alert('Bu sette baÅŸka soru yok.');
          return;
        }

        // Reshuffle entire order
        const slugs = SUBCATEGORY_LIST.map(i => i.slug);
        shuffleInPlace(slugs);
        if (SET_KEY) sessionStorage.setItem(SET_KEY, JSON.stringify(slugs));
        // Yeni sÄ±ra â†’ harita ilerlemesini sÄ±fÄ±rla (yeniden progresif aÃ§Ä±lsÄ±n)
        resetReached();

        // Update local list with new order (preserve difficulty info)
        const diffByOldSlug = new Map(SUBCATEGORY_LIST.map(i => [i.slug, i.difficulty]));
        SUBCATEGORY_LIST = slugs.map(s => ({ slug: s, difficulty: diffByOldSlug.get(s) || 'medium' }));

        // Navigate to first unanswered slug; if none, completion
        const firstUnanswered = slugs.find(s => !getAnswerStatus(s));
        if (!firstUnanswered) {
          CURRENT_INDEX = 0;
          showCompletionScreen();
          return;
        }
        gotoSlug(firstUnanswered);
      });

      document.getElementById('nextBtn').addEventListener('click', () => {
        if (SUBCATEGORY_LIST.length === 0) return;

        // DENEME (sÄ±nav/inceleme): sÄ±ralÄ± ilerle (cevaplananlarÄ± atlama, tamamlama ekranÄ± yok).
        if (GRI_DENEME_MODE) {
          if (SUBCATEGORY_LIST.length === 1) return;
          const nextIdx = (CURRENT_INDEX + 1) % SUBCATEGORY_LIST.length;
          gotoSlug(SUBCATEGORY_LIST[nextIdx].slug);
          return;
        }

        // Find next UNANSWERED slug starting after current position (wrap around)
        let nextSlug = null;
        for (let step = 1; step <= SUBCATEGORY_LIST.length; step++) {
          const idx = (CURRENT_INDEX + step) % SUBCATEGORY_LIST.length;
          const candidate = SUBCATEGORY_LIST[idx];
          if (!getAnswerStatus(candidate.slug)) {
            nextSlug = candidate.slug;
            break;
          }
        }

        if (nextSlug) {
          gotoSlug(nextSlug);
          return;
        }

        // No unanswered remaining â†’ if current is also answered, show completion
        const currentSlug = SUBCATEGORY_LIST[CURRENT_INDEX]?.slug;
        if (currentSlug && getAnswerStatus(currentSlug)) {
          showCompletionScreen();
        } else {
          alert('CevaplanmamÄ±ÅŸ baÅŸka soru yok.');
        }
      });

      // Nav panel toggle
      const navPill = document.getElementById('navPill');
      const navPanel = document.getElementById('navPanel');
      const navOverlay = document.getElementById('navOverlay');
      const navClose = document.getElementById('navClose');

      function openNavPanel() {
        navPanel.classList.add('open');
        navOverlay.classList.add('open');
        navPill.setAttribute('aria-expanded', 'true');
      }
      function closeNavPanel() {
        navPanel.classList.remove('open');
        navOverlay.classList.remove('open');
        navPill.setAttribute('aria-expanded', 'false');
      }
      navPill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navPanel.classList.contains('open')) closeNavPanel();
        else openNavPanel();
      });
      if (navClose) navClose.addEventListener('click', closeNavPanel);
      if (navOverlay) navOverlay.addEventListener('click', closeNavPanel);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navPanel.classList.contains('open')) closeNavPanel();
      });

      // Grid square click â†’ navigate to that question (preserving set context)
      // Event delegation on parent: handlers survive renderNavigator() innerHTML rebuilds
      const npGrid = document.getElementById('npGrid');
      if (npGrid && !npGrid.dataset.clickBound) {
        npGrid.addEventListener('click', (e) => {
          const sq = e.target.closest('.nav-sq');
          if (!sq || !npGrid.contains(sq)) return;
          if (sq.classList.contains('sq-current')) return;
          const targetSlug = sq.getAttribute('data-slug');
          if (targetSlug) gotoSlug(targetSlug);
        });
        npGrid.dataset.clickBound = '1';
      }

      // Report (Bildir) modal
      const reportBtn = document.getElementById('reportBtn');
      const reportOverlay = document.getElementById('reportOverlay');
      const reportModal = document.getElementById('reportModal');
      const reportClose = document.getElementById('reportClose');
      const reportCancel = document.getElementById('reportCancel');
      const reportForm = document.getElementById('reportForm');
      const reportSubmit = document.getElementById('reportSubmit');
      const reportFeedback = document.getElementById('reportFeedback');

      // Bookmark button setup
      const bookmarkBtn = document.getElementById('bookmarkBtn');
      let isCurrentBookmarked = false;

      function getCurrentSlug() {
        return (window.GriCurrentQuestion && window.GriCurrentQuestion.slug) || null;
      }

      window.refreshBookmarkState = async function () {
        if (!bookmarkBtn) return;
        const slug = getCurrentSlug();
        if (!GRI_USER_ID || !slug) {
          bookmarkBtn.classList.remove('bookmarked');
          isCurrentBookmarked = false;
          return;
        }
        try {
          const res = await supabase.from('user_bookmarks')
            .select('question_slug')
            .eq('user_id', GRI_USER_ID)
            .eq('question_slug', slug)
            .maybeSingle();
          isCurrentBookmarked = !!(res && res.data);
          bookmarkBtn.classList.toggle('bookmarked', isCurrentBookmarked);
        } catch (e) {
          console.warn('[bookmark] load failed:', e);
        }
      };

      async function toggleBookmark() {
        if (!GRI_USER_ID) {
          location.href = 'giris?return=' + encodeURIComponent(location.pathname + location.search);
          return;
        }
        const slug = getCurrentSlug();
        if (!slug) return;
        bookmarkBtn.disabled = true;
        try {
          if (isCurrentBookmarked) {
            const res = await supabase.from('user_bookmarks')
              .delete()
              .eq('user_id', GRI_USER_ID)
              .eq('question_slug', slug);
            if (res.error) throw res.error;
            isCurrentBookmarked = false;
          } else {
            const res = await supabase.from('user_bookmarks')
              .insert({ user_id: GRI_USER_ID, question_slug: slug });
            if (res.error) throw res.error;
            isCurrentBookmarked = true;
          }
          bookmarkBtn.classList.toggle('bookmarked', isCurrentBookmarked);
          // Rozet deÄŸerlendirmesi
          if (typeof window.triggerBadgeCheck === 'function') {
            window.triggerBadgeCheck();
          }
        } catch (e) {
          console.warn('[bookmark] toggle failed:', e);
        }
        bookmarkBtn.disabled = false;
      }

      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', toggleBookmark);
      }

      function openReportModal() {
        reportFeedback.textContent = '';
        reportFeedback.className = 'q-modal-feedback';
        reportSubmit.disabled = false;
        reportSubmit.textContent = 'GÃ¶nder';
        reportOverlay.classList.add('open');
        reportModal.classList.add('open');
        reportModal.setAttribute('aria-hidden', 'false');
      }

      function closeReportModal() {
        reportOverlay.classList.remove('open');
        reportModal.classList.remove('open');
        reportModal.setAttribute('aria-hidden', 'true');
      }

      if (reportBtn) {
        reportBtn.addEventListener('click', openReportModal);
      }
      if (reportClose) reportClose.addEventListener('click', closeReportModal);
      if (reportCancel) reportCancel.addEventListener('click', closeReportModal);
      if (reportOverlay) reportOverlay.addEventListener('click', closeReportModal);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && reportModal.classList.contains('open')) closeReportModal();
      });

      if (reportForm && !reportForm.dataset.bound) {
        reportForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const category = document.getElementById('reportCategory').value.trim();
          const detail = document.getElementById('reportDetail').value.trim();
          if (!category || !detail) {
            reportFeedback.textContent = 'LÃ¼tfen kategori seÃ§in ve detay yazÄ±n.';
            reportFeedback.className = 'q-modal-feedback error';
            return;
          }
          reportSubmit.disabled = true;
          reportSubmit.textContent = 'GÃ¶nderiliyor...';
          reportFeedback.textContent = '';
          reportFeedback.className = 'q-modal-feedback';
          try {
            let reporterEmail = null, reporterId = GRI_USER_ID;
            try {
              const sess = await supabase.auth.getSession();
              if (sess && sess.data && sess.data.session && sess.data.session.user) {
                reporterEmail = sess.data.session.user.email || null;
                reporterId = sess.data.session.user.id || GRI_USER_ID;
              }
            } catch (e) {}
            const { error } = await supabase
              .from('soru_bildirimleri')
              .insert({
                kategori: category,
                detay: detail,
                soru_slug: currentSlug || null,
                soru_url: window.location.href,
                user_agent: navigator.userAgent,
                user_id: reporterId,
                reporter_email: reporterEmail
              });
            if (!error) {
              reportFeedback.textContent = 'TeÅŸekkÃ¼rler. Bildiriminiz iletildi.';
              reportFeedback.className = 'q-modal-feedback success';
              reportForm.reset();
              setTimeout(closeReportModal, 1800);
            } else {
              console.error('Report insert error:', error);
              reportFeedback.textContent = 'GÃ¶nderim baÅŸarÄ±sÄ±z oldu. LÃ¼tfen tekrar deneyin.';
              reportFeedback.className = 'q-modal-feedback error';
              reportSubmit.disabled = false;
              reportSubmit.textContent = 'GÃ¶nder';
            }
          } catch (err) {
            reportFeedback.textContent = 'BaÄŸlantÄ± hatasÄ±: ' + err.message;
            reportFeedback.className = 'q-modal-feedback error';
            reportSubmit.disabled = false;
            reportSubmit.textContent = 'GÃ¶nder';
          }
        });
        reportForm.dataset.bound = '1';
      }

      // ===========================================================================
      // NOT AL (Question Notes) modal
      // ===========================================================================
      const noteBtn = document.getElementById('noteBtn');
      const noteOverlay = document.getElementById('noteOverlay');
      const noteModal = document.getElementById('noteModal');
      const noteClose = document.getElementById('noteClose');
      const noteCancel = document.getElementById('noteCancel');
      const noteDelete = document.getElementById('noteDelete');
      const noteForm = document.getElementById('noteForm');
      const noteSubmit = document.getElementById('noteSubmit');
      const noteText = document.getElementById('noteText');
      const noteFeedback = document.getElementById('noteFeedback');
      const noteCounter = document.getElementById('noteCounter');

      let currentNote = null; // null = yok, string = mevcut not

      function updateNoteCounter() {
        if (!noteText || !noteCounter) return;
        const len = noteText.value.length;
        noteCounter.textContent = len + ' / 2000';
      }
      if (noteText) noteText.addEventListener('input', updateNoteCounter);

      window.refreshNoteState = async function () {
        if (!noteBtn) return;
        const slug = getCurrentSlug();
        currentNote = null;
        noteBtn.classList.remove('noted');
        if (!slug) return;
        // Session'Ä± her seferinde fresh oku, GRI_USER_ID closure'Ä±na gÃ¼venme
        let uid = GRI_USER_ID;
        if (!uid) {
          try {
            const sess = await supabase.auth.getSession();
            uid = sess && sess.data && sess.data.session && sess.data.session.user && sess.data.session.user.id;
            if (uid) GRI_USER_ID = uid;
          } catch (e) {}
        }
        if (!uid) return;
        try {
          const res = await supabase.from('user_question_notes')
            .select('note')
            .eq('user_id', uid)
            .eq('question_slug', slug)
            .maybeSingle();
          if (res && res.data && res.data.note) {
            currentNote = res.data.note;
            noteBtn.classList.add('noted');
          }
        } catch (e) {
          console.warn('[note] load failed:', e);
        }
      };

      async function openNoteModal() {
        // Session fresh oku
        let uid = GRI_USER_ID;
        if (!uid) {
          try {
            const sess = await supabase.auth.getSession();
            uid = sess && sess.data && sess.data.session && sess.data.session.user && sess.data.session.user.id;
            if (uid) GRI_USER_ID = uid;
          } catch (e) {}
        }
        if (!uid) {
          location.href = 'giris?return=' + encodeURIComponent(location.pathname + location.search);
          return;
        }
        const slug = getCurrentSlug();
        if (!slug) return;

        // Modal'Ä± aÃ§madan DB'den notu fresh al, closure state'ine gÃ¼venme
        let freshNote = '';
        try {
          const res = await supabase.from('user_question_notes')
            .select('note')
            .eq('user_id', uid)
            .eq('question_slug', slug)
            .maybeSingle();
          if (res && res.data && res.data.note) {
            freshNote = res.data.note;
            currentNote = freshNote;
            noteBtn.classList.add('noted');
          }
        } catch (e) {
          console.warn('[note] modal open fetch failed:', e);
        }

        noteFeedback.textContent = '';
        noteFeedback.className = 'q-modal-feedback';
        noteSubmit.disabled = false;
        noteSubmit.textContent = 'Kaydet';
        noteText.value = freshNote;
        noteDelete.style.display = freshNote ? 'inline-flex' : 'none';
        updateNoteCounter();
        noteOverlay.classList.add('open');
        noteModal.classList.add('open');
        noteModal.setAttribute('aria-hidden', 'false');
        setTimeout(function () { try { noteText.focus(); } catch (e) {} }, 80);
      }

      function closeNoteModal() {
        noteOverlay.classList.remove('open');
        noteModal.classList.remove('open');
        noteModal.setAttribute('aria-hidden', 'true');
      }

      if (noteBtn) noteBtn.addEventListener('click', openNoteModal);
      if (noteClose) noteClose.addEventListener('click', closeNoteModal);
      if (noteCancel) noteCancel.addEventListener('click', closeNoteModal);
      if (noteOverlay) noteOverlay.addEventListener('click', closeNoteModal);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && noteModal && noteModal.classList.contains('open')) closeNoteModal();
      });

      if (noteForm && !noteForm.dataset.bound) {
        noteForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          const slug = getCurrentSlug();
          const text = (noteText.value || '').trim();
          if (!slug) {
            noteFeedback.textContent = 'Soru bilgisi alÄ±namadÄ±.';
            noteFeedback.className = 'q-modal-feedback error';
            return;
          }
          if (!text) {
            noteFeedback.textContent = 'Not boÅŸ olamaz. Silmek istiyorsan Sil tuÅŸunu kullan.';
            noteFeedback.className = 'q-modal-feedback error';
            return;
          }
          if (text.length > 2000) {
            noteFeedback.textContent = 'Not 2000 karakteri aÅŸamaz.';
            noteFeedback.className = 'q-modal-feedback error';
            return;
          }
          noteSubmit.disabled = true;
          noteSubmit.textContent = 'Kaydediliyor...';
          try {
            const { error } = await supabase
              .from('user_question_notes')
              .upsert({
                user_id: GRI_USER_ID,
                question_slug: slug,
                note: text
              }, { onConflict: 'user_id,question_slug' });
            if (error) throw error;
            currentNote = text;
            noteBtn.classList.add('noted');
            noteFeedback.textContent = 'Not kaydedildi.';
            noteFeedback.className = 'q-modal-feedback success';
            noteDelete.style.display = 'inline-flex';
            setTimeout(closeNoteModal, 1200);
          } catch (err) {
            console.error('[note] save error:', err);
            noteFeedback.textContent = 'Kaydedilemedi: ' + (err.message || 'bilinmeyen hata');
            noteFeedback.className = 'q-modal-feedback error';
            noteSubmit.disabled = false;
            noteSubmit.textContent = 'Kaydet';
          }
        });
        noteForm.dataset.bound = '1';
      }

      if (noteDelete && !noteDelete.dataset.bound) {
        noteDelete.addEventListener('click', async function () {
          const slug = getCurrentSlug();
          if (!slug || !GRI_USER_ID) return;
          if (!confirm('Bu sorudaki notu silmek istiyor musun?')) return;
          noteDelete.disabled = true;
          try {
            const { error } = await supabase
              .from('user_question_notes')
              .delete()
              .eq('user_id', GRI_USER_ID)
              .eq('question_slug', slug);
            if (error) throw error;
            currentNote = null;
            noteBtn.classList.remove('noted');
            noteText.value = '';
            updateNoteCounter();
            noteDelete.style.display = 'none';
            noteFeedback.textContent = 'Not silindi.';
            noteFeedback.className = 'q-modal-feedback success';
            setTimeout(closeNoteModal, 1000);
          } catch (err) {
            console.error('[note] delete error:', err);
            noteFeedback.textContent = 'Silinemedi: ' + (err.message || 'bilinmeyen hata');
            noteFeedback.className = 'q-modal-feedback error';
          }
          noteDelete.disabled = false;
        });
        noteDelete.dataset.bound = '1';
      }
    }

    // Kick off
    // ===========================================================================
    // HIGHLIGHT TOOL
    // ===========================================================================
    // - Pasaj veya soru metninde seÃ§im yapÄ±nca floating toolbar Ã§Ä±kar
    // - 3 renk + sil
    // - Login kullanÄ±cÄ± iÃ§in DB'ye 12 saat persist
    // - Anonim iÃ§in sadece geÃ§ici (sayfa yenileninde kaybolur)
    // ===========================================================================

    function initHighlightTool() {
      // Toolbar oluÅŸtur
      const toolbar = document.createElement('div');
      toolbar.className = 'hl-toolbar';
      toolbar.innerHTML = `
        <button type="button" class="hl-btn hl-yellow" data-color="yellow" title="SarÄ±"></button>
        <button type="button" class="hl-btn hl-blue" data-color="blue" title="Mavi"></button>
        <button type="button" class="hl-btn hl-pink" data-color="pink" title="Pembe"></button>
        <button type="button" class="hl-btn hl-clear" data-action="clear" title="Sil">Ã—</button>
      `;
      document.body.appendChild(toolbar);

      function hide() { toolbar.classList.remove('show'); }
      function show(rect) {
        toolbar.classList.add('show');
        const tw = toolbar.offsetWidth || 140;
        const left = Math.max(8, rect.left + rect.width / 2 - tw / 2 + window.scrollX);
        const top = Math.max(8, rect.top - toolbar.offsetHeight - 8 + window.scrollY);
        toolbar.style.left = left + 'px';
        toolbar.style.top = top + 'px';
      }

      // Hangi kapsayÄ±cÄ±larda highlight Ã§alÄ±ÅŸÄ±r
      function getTargetRoot(node) {
        if (!node) return null;
        const el = node.nodeType === 1 ? node : node.parentElement;
        if (!el) return null;
        return el.closest('#qTexts, #qPrompt');
      }

      function getTargetKey(root) {
        if (root.id === 'qPrompt') return 'qPrompt';
        if (root.id === 'qTexts') return 'qTexts';
        return null;
      }

      // Selection ile text offset hesapla (root iÃ§inde)
      function getOffsetWithin(root, node, offsetInNode) {
        let offset = 0;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let current = walker.nextNode();
        while (current && current !== node) {
          offset += current.textContent.length;
          current = walker.nextNode();
        }
        return offset + offsetInNode;
      }

      // Belirli text offset aralÄ±ÄŸÄ±nÄ± root iÃ§inde wrap et
      function wrapRangeByOffset(root, startOffset, endOffset, color) {
        if (startOffset >= endOffset) return;
        let offset = 0;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodesToWrap = [];
        let node;
        while ((node = walker.nextNode())) {
          const len = node.textContent.length;
          if (offset + len > startOffset && offset < endOffset) {
            const localStart = Math.max(0, startOffset - offset);
            const localEnd = Math.min(len, endOffset - offset);
            nodesToWrap.push({ node, localStart, localEnd });
          }
          offset += len;
          if (offset >= endOffset) break;
        }
        nodesToWrap.forEach(function (item) {
          try {
            const range = document.createRange();
            range.setStart(item.node, item.localStart);
            range.setEnd(item.node, item.localEnd);
            const mark = document.createElement('mark');
            mark.className = 'hl-' + color;
            mark.dataset.color = color;
            range.surroundContents(mark);
          } catch (e) { /* skip if cross-boundary */ }
        });
      }

      // Selection'Ä± highlight ile sar
      function applyHighlight(color) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;
        const range = sel.getRangeAt(0);
        if (range.collapsed) return null;

        const root = getTargetRoot(range.startContainer);
        if (!root || root !== getTargetRoot(range.endContainer)) return null;

        const startOffset = getOffsetWithin(root, range.startContainer, range.startOffset);
        const endOffset = getOffsetWithin(root, range.endContainer, range.endOffset);
        const selectedText = range.toString();

        wrapRangeByOffset(root, startOffset, endOffset, color);
        sel.removeAllRanges();

        return {
          target: getTargetKey(root),
          color: color,
          start_offset: startOffset,
          end_offset: endOffset,
          selected_text: selectedText,
        };
      }

      // Selection iÃ§indeki mark'larÄ± temizle
      function clearHighlightInSelection() {
        const sel = window.getSelection();
        if (!sel.rangeCount) return [];
        const range = sel.getRangeAt(0);
        const root = getTargetRoot(range.startContainer);
        if (!root) return [];

        const removed = [];
        const marks = Array.from(root.querySelectorAll('mark'));
        marks.forEach(function (mark) {
          if (sel.containsNode(mark, true)) {
            const parent = mark.parentNode;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
            removed.push(mark);
          }
        });
        sel.removeAllRanges();
        // Adjacent text node'larÄ± birleÅŸtir
        if (root.normalize) root.normalize();
        return removed;
      }

      // DB persist
      function persistHighlight(payload, slug) {
        if (!GRI_USER_ID || !slug) return;
        supabase.from('user_highlights').insert({
          user_id: GRI_USER_ID,
          question_slug: slug,
          target: payload.target,
          color: payload.color,
          start_offset: payload.start_offset,
          end_offset: payload.end_offset,
          selected_text: payload.selected_text,
        }).then(function (r) {
          if (r.error) console.warn('[hl] persist failed:', r.error.message);
        });
      }

      function persistClear(slug) {
        if (!GRI_USER_ID || !slug) return;
        // TÃ¼m highlight'larÄ± silip yeniden ekleyeceÄŸiz (basitlik iÃ§in)
        const root = document.getElementById('qTexts');
        const root2 = document.getElementById('qPrompt');
        const remaining = [];
        [root, root2].forEach(function (r) {
          if (!r) return;
          const target = r.id;
          r.querySelectorAll('mark').forEach(function (mark) {
            // Bu mark iÃ§in offset hesapla
            const color = mark.dataset.color || mark.className.replace('hl-', '');
            // Re-walk to find offsets (yeniden hesaplama)
            const walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
            let offset = 0;
            let startOff = -1;
            let node;
            while ((node = walker.nextNode())) {
              if (mark.contains(node)) {
                if (startOff === -1) startOff = offset;
              }
              offset += node.textContent.length;
            }
            if (startOff >= 0) {
              const len = mark.textContent.length;
              remaining.push({
                user_id: GRI_USER_ID,
                question_slug: slug,
                target: target,
                color: color,
                start_offset: startOff,
                end_offset: startOff + len,
                selected_text: mark.textContent,
              });
            }
          });
        });

        supabase.from('user_highlights')
          .delete()
          .eq('user_id', GRI_USER_ID)
          .eq('question_slug', slug)
          .then(function () {
            if (remaining.length) {
              supabase.from('user_highlights').insert(remaining).then(function () {});
            }
          });
      }

      // DB'den yÃ¼kle ve uygula
      async function restoreHighlights(slug) {
        if (!GRI_USER_ID || !slug) return;
        try {
          const cutoff = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
          const res = await supabase.from('user_highlights')
            .select('target, color, start_offset, end_offset')
            .eq('user_id', GRI_USER_ID)
            .eq('question_slug', slug)
            .gte('created_at', cutoff)
            .order('created_at', { ascending: true });
          if (!res || !res.data) return;
          res.data.forEach(function (hl) {
            const root = document.getElementById(hl.target);
            if (root) wrapRangeByOffset(root, hl.start_offset, hl.end_offset, hl.color);
          });
        } catch (e) { console.warn('[hl] restore failed:', e); }
      }

      // Selection deÄŸiÅŸimini izle
      document.addEventListener('mouseup', function (e) {
        // Toolbar tÄ±klamasÄ±ndan sonra mouseup gelirse gÃ¶rmezden gel
        if (toolbar.contains(e.target)) return;
        setTimeout(function () {
          const sel = window.getSelection();
          if (!sel.rangeCount || sel.toString().trim().length === 0) {
            hide();
            return;
          }
          const range = sel.getRangeAt(0);
          const root = getTargetRoot(range.startContainer);
          if (!root || root !== getTargetRoot(range.endContainer)) {
            hide();
            return;
          }
          show(range.getBoundingClientRect());
        }, 10);
      });

      document.addEventListener('selectionchange', function () {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.toString().trim().length === 0) {
          hide();
        }
      });

      // Toolbar tÄ±klamasÄ±
      toolbar.addEventListener('mousedown', function (e) { e.preventDefault(); });
      toolbar.addEventListener('click', function (e) {
        const btn = e.target.closest('.hl-btn');
        if (!btn) return;
        const slug = SUBCATEGORY_LIST[CURRENT_INDEX] && SUBCATEGORY_LIST[CURRENT_INDEX].slug;

        if (btn.dataset.action === 'clear') {
          clearHighlightInSelection();
          persistClear(slug);
        } else if (btn.dataset.color) {
          const payload = applyHighlight(btn.dataset.color);
          if (payload) persistHighlight(payload, slug);
        }
        hide();
      });

      // Expose
      window.GriHighlights = { restoreHighlights: restoreHighlights };
    }

    initHighlightTool();

    // ===========================================================================
    // VOCAB POPUP
    // ===========================================================================
    // - Highlight toolbar'daki kitap ikonu ile tetiklenir
    // - Ã–nce vocabulary cache'i sorgulanÄ±r (Edge Function Ã¼zerinden)
    // - Cache miss + login varsa OpenAI Ã§aÄŸrÄ±lÄ±r
    // - "Listeme Ekle" â†’ user_vocab tablosuna yazar
    // ===========================================================================
    function initVocabPopup() {
      const popup = document.createElement('div');
      popup.className = 'vocab-popup';
      popup.innerHTML = '<div class="vocab-loading"><div class="vocab-spinner"></div><span>AranÄ±yor...</span></div>';
      document.body.appendChild(popup);

      const backdrop = document.createElement('div');
      backdrop.className = 'vocab-backdrop';
      document.body.appendChild(backdrop);

      let currentVocabularyId = null;
      let currentWord = null;
      let currentAnchorRect = null;
      const isMobile = function () { return window.matchMedia('(max-width: 600px)').matches; };

      function positionPopup(anchorRect) {
        if (isMobile()) return;
        if (!anchorRect) anchorRect = currentAnchorRect;
        if (!anchorRect) return;

        const ph = popup.offsetHeight || 300;
        const pw = popup.offsetWidth || 360;

        // Yatay: anchor'a gÃ¶re ortalÄ±, ekran kenarlarÄ±nÄ± aÅŸmasÄ±n
        let left = anchorRect.left + anchorRect.width / 2 - pw / 2 + window.scrollX;
        const maxLeft = window.scrollX + window.innerWidth - pw - 12;
        if (left > maxLeft) left = maxLeft;
        if (left < window.scrollX + 12) left = window.scrollX + 12;

        // Dikey: Ã¶nce Ã¼st, yer yoksa alt, ikisi yoksa ortala
        const spaceAbove = anchorRect.top;
        const spaceBelow = window.innerHeight - anchorRect.bottom;
        let top;
        if (spaceAbove >= ph + 16) {
          top = anchorRect.top - ph - 8 + window.scrollY;
        } else if (spaceBelow >= ph + 16) {
          top = anchorRect.bottom + 8 + window.scrollY;
        } else {
          top = window.scrollY + Math.max(12, (window.innerHeight - ph) / 2);
        }

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
      }

      function show(anchorRect) {
        currentAnchorRect = anchorRect;
        popup.classList.add('show');
        if (isMobile()) backdrop.classList.add('show');
        setTimeout(function () { positionPopup(); }, 0);
      }

      function hide() {
        popup.classList.remove('show');
        backdrop.classList.remove('show');
        currentVocabularyId = null;
        currentWord = null;
        currentAnchorRect = null;
      }

      function renderLoading() {
        popup.innerHTML = '<div class="vocab-loading"><div class="vocab-spinner"></div><span>AranÄ±yor...</span></div>';
        setTimeout(function () { positionPopup(); }, 0);
      }

      function renderSearch(prefill) {
        popup.innerHTML = [
          '<div class="vocab-head">',
          '  <h3 class="vocab-word" style="font-size: 1.1rem;">SÃ¶zlÃ¼k</h3>',
          '  <div class="vocab-actions">',
          '    <button class="vocab-icon-btn" data-action="close" title="Kapat">',
          '      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
          '    </button>',
          '  </div>',
          '</div>',
          '<div class="vocab-divider"></div>',
          '<form class="vocab-search-form" data-action="search-form" style="display: flex; gap: 0.5rem; margin: 0;">',
          '  <input type="text" id="vocab-search-input" placeholder="Ä°ngilizce kelime yaz..." value="' + escapeHtml(prefill || '') + '" style="flex: 1; padding: 0.6rem 0.8rem; border: 1px solid var(--line, #ddd); background: transparent; font-family: var(--font-body, Georgia, serif); font-size: 0.95rem; color: var(--text, #333); outline: none; border-radius: 2px;" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">',
          '  <button type="submit" class="vocab-save-btn" style="width: auto; padding: 0.5rem 1rem; font-size: 10px;">ARA</button>',
          '</form>'
        ].join('');
        const inp = popup.querySelector('#vocab-search-input');
        if (inp) {
          setTimeout(function () { inp.focus(); if (prefill) inp.select(); }, 60);
        }
        setTimeout(function () { positionPopup(); }, 0);
      }

      function renderError(message, action) {
        var actionHtml = '';
        if (action && action.url && action.text) {
          actionHtml = ' <a href="' + escapeHtml(action.url) + '">' + escapeHtml(action.text) + '</a>';
        }
        popup.innerHTML = [
          '<div class="vocab-head">',
          '  <h3 class="vocab-word">Hata</h3>',
          '  <div class="vocab-actions">',
          '    <button class="vocab-icon-btn" data-action="close" title="Kapat">',
          '      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
          '    </button>',
          '  </div>',
          '</div>',
          '<div class="vocab-divider"></div>',
          '<div class="vocab-error">' + escapeHtml(message) + actionHtml + '</div>'
        ].join('');
        setTimeout(function () { positionPopup(); }, 0);
      }

      function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }

      function renderResult(data, alreadySaved) {
        currentVocabularyId = data.vocabulary_id;
        currentWord = data.word;

        // Backward compat: eski cache entries 'turkish' string ile gelir, yenisi 'meanings' array
        const meanings = Array.isArray(data.meanings) && data.meanings.length
          ? data.meanings.slice(0, 3)
          : (data.turkish ? [data.turkish] : []);
        const synonyms = Array.isArray(data.synonyms) && data.synonyms.length
          ? data.synonyms.slice(0, 3)
          : [];
        const level = (data.level || '').toLowerCase();

        const saveLabel = alreadySaved ? 'âœ“ LÄ°STENDE' : '+ LÄ°STEME EKLE';
        const saveClass = alreadySaved ? 'vocab-save-btn saved' : 'vocab-save-btn';
        const saveDisabled = (alreadySaved || !GRI_USER_ID) ? 'disabled' : '';

        const meaningsHtml = meanings.map(function (m, i) {
          return (i > 0 ? '<span class="sep">Â·</span>' : '') + escapeHtml(m);
        }).join('');

        const synonymsHtml = synonyms.length
          ? '<div class="vocab-synonyms-block">' +
            '  <span class="vocab-syn-label">Benzer</span>' +
            '  <span class="vocab-syn-list">' + synonyms.map(function (s, i) {
              return (i > 0 ? '<span class="sep">Â·</span>' : '') + escapeHtml(s);
            }).join('') + '</span>' +
            '</div>'
          : '';

        const levelLabel = level === 'advanced' ? 'Ä°leri'
          : level === 'intermediate' ? 'Orta'
          : level === 'basic' ? 'Temel'
          : '';
        const levelHtml = levelLabel
          ? '<span class="vocab-level ' + escapeHtml(level) + '">' + escapeHtml(levelLabel) + '</span>'
          : '';

        popup.innerHTML = [
          '<div class="vocab-head">',
          '  <div class="vocab-word-block">',
          '    <h3 class="vocab-word">' + escapeHtml(data.word) + '</h3>',
          '    ' + levelHtml,
          '  </div>',
          '  <div class="vocab-actions">',
          '    <button class="vocab-icon-btn" data-action="speak" title="Telaffuz">',
          '      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
          '    </button>',
          '    <button class="vocab-icon-btn" data-action="close" title="Kapat">',
          '      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
          '    </button>',
          '  </div>',
          '</div>',
          meanings.length ? '<p class="vocab-meanings">' + meaningsHtml + '</p>' : '',
          data.example ? '<div class="vocab-example-block">' +
            '  <p class="vocab-example">"' + escapeHtml(data.example) + '"</p>' +
            (data.translation ? '  <p class="vocab-translation">' + escapeHtml(data.translation) + '</p>' : '') +
            '</div>' : '',
          synonymsHtml,
          GRI_USER_ID
            ? '<button class="' + saveClass + '" data-action="save" ' + saveDisabled + '>' + saveLabel + '</button>'
            : '<div class="vocab-error">Listene kaydetmek iÃ§in <a href="giris">giriÅŸ yap</a>.</div>'
        ].join('');
        setTimeout(function () { positionPopup(); }, 0);
      }

      async function checkIfSaved(vocabularyId) {
        if (!GRI_USER_ID || !vocabularyId) return false;
        try {
          const res = await supabase.from('user_vocab')
            .select('id')
            .eq('user_id', GRI_USER_ID)
            .eq('vocabulary_id', vocabularyId)
            .maybeSingle();
          return !!(res && res.data);
        } catch (e) { return false; }
      }

      async function lookup(word) {
        try {
          const sessRes = await supabase.auth.getSession();
          const token = sessRes && sessRes.data && sessRes.data.session
            ? sessRes.data.session.access_token : null;

          const headers = {
            'Content-Type': 'application/json',
            'apikey': window.SUPABASE_KEY,
          };
          if (token) headers['Authorization'] = 'Bearer ' + token;

          const res = await fetch(window.SUPABASE_URL + '/functions/v1/vocab-lookup', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ word: word })
          });

          const data = await res.json();
          if (!res.ok || !data.ok) {
            if (data.error === 'login_required') {
              renderError('Bu kelime henÃ¼z kayÄ±tlÄ± deÄŸil. Yeni kelime iÃ§in giriÅŸ yapmalÄ±sÄ±n.', { url: 'giris.html', text: 'GiriÅŸ Yap' });
            } else if (data.error === 'ai_unavailable') {
              renderError('SÃ¶zlÃ¼k ÅŸu an eriÅŸilemez. Birazdan tekrar dene.');
            } else {
              renderError('Kelime bulunamadÄ±: ' + (data.message || data.error || 'bilinmeyen hata'));
            }
            return;
          }

          const alreadySaved = await checkIfSaved(data.vocabulary_id);
          renderResult(data, alreadySaved);
        } catch (e) {
          console.error('[vocab] lookup failed:', e);
          renderError('BaÄŸlantÄ± hatasÄ±. Ä°nternetini kontrol et.');
        }
      }

      async function saveCurrentWord() {
        if (!GRI_USER_ID || !currentVocabularyId) return;
        try {
          const res = await supabase.from('user_vocab').insert({
            user_id: GRI_USER_ID,
            vocabulary_id: currentVocabularyId,
          });
          if (res.error && res.error.code !== '23505') {
            console.warn('[vocab] save failed:', res.error);
            return;
          }
          const btn = popup.querySelector('.vocab-save-btn');
          if (btn) {
            btn.classList.add('saved');
            btn.textContent = 'âœ“ LÄ°STENDE';
            btn.disabled = true;
          }
          // Rozet deÄŸerlendirmesi
          if (typeof window.triggerBadgeCheck === 'function') {
            window.triggerBadgeCheck();
          }
        } catch (e) {
          console.error('[vocab] save error:', e);
        }
      }

      function speakWord() {
        if (!currentWord) return;
        try {
          const utter = new SpeechSynthesisUtterance(currentWord);
          utter.lang = 'en-US';
          utter.rate = 0.85;
          window.speechSynthesis.speak(utter);
        } catch (e) {}
      }

      // Popup iÃ§i tÄ±klamalar
      popup.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'close') hide();
        else if (action === 'speak') speakWord();
        else if (action === 'save') saveCurrentWord();
      });

      // Form submit (arama)
      popup.addEventListener('submit', function (e) {
        const form = e.target.closest('[data-action="search-form"]');
        if (!form) return;
        e.preventDefault();
        const inp = form.querySelector('#vocab-search-input');
        const word = inp ? inp.value.trim() : '';
        if (!word) return;
        renderLoading();
        lookup(word);
      });

      // Backdrop ve ESC ile kapat
      backdrop.addEventListener('click', hide);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && popup.classList.contains('show')) hide();
      });

      // DÄ±ÅŸ tÄ±klama ile kapat (desktop)
      document.addEventListener('mousedown', function (e) {
        if (!popup.classList.contains('show')) return;
        if (popup.contains(e.target)) return;
        if (isMobile()) return; // mobilde backdrop hallediyor
        hide();
      });

      // Expose
      window.GriVocab = {
        openWithWord: function (word, anchorRect) {
          if (!word || word.length > 80) return;
          renderLoading();
          show(anchorRect || { left: window.innerWidth / 2, right: window.innerWidth / 2, top: 100, bottom: 100, width: 0, height: 0 });
          lookup(word);
        },
        openSearch: function (anchorRect, prefill) {
          renderSearch(prefill);
          show(anchorRect || { left: window.innerWidth / 2, right: window.innerWidth / 2, top: 100, bottom: 100, width: 0, height: 0 });
        },
        close: hide,
      };
    }

    initVocabPopup();

    // === Internal navigation flag â€” sadece browser back/forward/refresh iÃ§in uyar ===
    let __isInternalNav = false;
    // TÃ¼m same-origin link click'lerinde flag set
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank') return;
      try {
        const url = new URL(href, location.href);
        if (url.origin === location.origin) __isInternalNav = true;
      } catch (err) {}
    }, true);

    // === YanlÄ±ÅŸlÄ±kla geri / refresh / sekme kapatma uyarÄ±sÄ± ===
    window.addEventListener('beforeunload', function (e) {
      if (__isInternalNav) return; // app iÃ§i navigation â†’ uyarma
      if (window.GriCurrentQuestion && window.GriCurrentQuestion.slug) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });

    // Expose flag globally so gotoSlug ve diÄŸer programatik navigation set edebilsin
    window.__setInternalNav = function () { __isInternalNav = true; };

    loadQuestion();
  
