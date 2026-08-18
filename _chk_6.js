
  (function () {
    // Aktivasyon: yalnÄ±z iframe'e gÃ¶mÃ¼lÃ¼yken. Ãœst pencerede kÃ¶prÃ¼ kapalÄ±.
    if (window.parent === window) return;

    var applying = false;   // apply sÄ±rasÄ±nda yeniden-post'u engelle (dÃ¶ngÃ¼ korumasÄ±)
    var lastSel = null;     // en son tÄ±klanan ÅŸÄ±k harfi (echo/faithful seÃ§im iÃ§in)

    function curSlug() {
      try { return (window.GriCurrentQuestion && window.GriCurrentQuestion.slug) || null; }
      catch (e) { return null; }
    }
    function okOrigin(o) {
      if (!o || o === 'null') return true;
      try { var h = new URL(o).hostname; return h === location.hostname || /(^|\.)gringlizce\.com$/.test(h); }
      catch (e) { return false; }
    }

    // Mevcut seÃ§im + reveal durumunu DOM'dan oku (MCQ ve SPR).
    function readState() {
      var box = document.getElementById('qOptions');
      if (!box) return null;
      if (box.dataset.spr === '1') {
        var inp = document.getElementById('qSprInput');
        if (!inp) return null;
        var v = inp.value;
        if (v == null || v === '') return null;
        var rev = !!(inp.disabled && (inp.classList.contains('correct') || inp.classList.contains('incorrect')));
        return { q: curSlug(), sel: v, revealed: rev };
      }
      var sel = lastSel;
      if (sel == null) { var c = box.querySelector('.q-option input:checked'); sel = c ? c.value : null; }
      if (sel == null) return null;
      var revealed = !!box.querySelector('.q-option.correct, .q-option.incorrect');
      return { q: curSlug(), sel: sel, revealed: revealed };
    }

    var postTimer = null;
    function schedulePost() {
      if (applying) return;
      clearTimeout(postTimer);
      postTimer = setTimeout(function () {
        if (applying) return;
        var st = readState();
        if (st && st.q) { try { window.parent.postMessage({ __gmex: 1, state: st }, '*'); } catch (e) {} }
      }, 250);
    }

    // Ã–ÄŸrencinin seÃ§tiÄŸi ÅŸÄ±kkÄ± (yanlÄ±ÅŸ olsa bile) + reveal ise doÄŸru cevabÄ± uygula.
    function applySel(sel, revealed) {
      var box = document.getElementById('qOptions');
      if (!box) return;
      if (box.dataset.spr === '1') {
        var inp = document.getElementById('qSprInput'), chk = document.getElementById('qSprCheck');
        if (inp && !inp.disabled) { inp.value = sel; if (revealed && chk && !chk.disabled) chk.click(); }
        return;
      }
      var correct = box.dataset.correct;
      var opts = box.querySelectorAll('.q-option');
      if (!revealed) {
        opts.forEach(function (o) {
          var i = o.querySelector('input'), l = i ? i.value : null;
          if (l === sel) { o.classList.add('selected'); if (i) i.checked = true; }
          else { o.classList.remove('selected'); }
        });
        return;
      }
      // Reveal: Ã¶ÄŸretmen hem Ã¶ÄŸrencinin gerÃ§ek cevabÄ±nÄ± hem doÄŸrusunu gÃ¶rsÃ¼n.
      opts.forEach(function (o) {
        var i = o.querySelector('input'), l = i ? i.value : null;
        o.classList.remove('selected');
        if (l === correct) o.classList.add('answered', 'correct');
        if (l === sel && sel !== correct) { o.classList.add('answered', 'incorrect'); if (i) i.checked = true; }
        if (l === sel && i) i.checked = true;
      });
      box.classList.add('locked');
    }

    // === SeÃ§im / kontrol olaylarÄ±nÄ± yakala (capture; sayfanÄ±n kendi handler'Ä±ndan
    //     baÄŸÄ±msÄ±z ve her renderQuestion sonrasÄ± yeniden baÄŸlanmaya gerek yok). ===
    document.addEventListener('click', function (e) {
      if (applying) return;
      var t = e.target; if (!t || !t.closest) return;
      var optEl = t.closest('#qOptions .q-option');
      if (optEl) { var inp = optEl.querySelector('input'); lastSel = inp ? inp.value : lastSel; schedulePost(); return; }
      if (t.closest('#qSprCheck')) schedulePost();
    }, true);
    document.addEventListener('change', function (e) {
      if (applying) return;
      var t = e.target; if (t && t.closest && t.closest('#qOptions')) schedulePost();
    }, true);

    // Soru deÄŸiÅŸince seÃ§imi sÄ±fÄ±rla; sÃ¼rÃ¼cÃ¼ yeni soruda (cevaplÄ±ysa) durumu yeniden yayÄ±nlasÄ±n.
    window.addEventListener('gri-question-change', function () {
      lastSel = null;
      clearTimeout(postTimer);
      postTimer = setTimeout(function () {
        if (applying) return;
        var st = readState();
        if (st && st.q) { try { window.parent.postMessage({ __gmex: 1, state: st }, '*'); } catch (e) {} }
      }, 350);
    });

    // === Gelen apply: {q, sel, revealed} ===
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || d.__gmex !== 1 || !d.apply) return;
      if (!okOrigin(e.origin)) return;
      var s = d.apply;
      if (!s || typeof s.sel === 'undefined' || s.sel === null) return;
      // FarklÄ± soruysa yok say (nav-sync ayrÄ± Ã§alÄ±ÅŸÄ±r; yanlÄ±ÅŸ soruya iÅŸaret koymayalÄ±m).
      var cs = curSlug();
      if (s.q && cs && s.q !== cs) return;
      applying = true;
      try { applySel(s.sel, !!s.revealed); } catch (err) {}
      applying = false;
    });
  })();
  
