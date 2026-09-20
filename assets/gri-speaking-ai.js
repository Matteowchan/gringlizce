/* gri-speaking-ai.js — IELTS Speaking icin ChatGPT "sertifikali examiner" promptu.
 *
 * Ayni blok hem konusma pratigi sayfasinda hem ielts-speaking-part1/2/3
 * anlatim sayfalarinda gorunur; ogrenci hangisine giderse gitsin promptu bulur.
 * Cue card verilirse promptun [paste the cue card here] yer tutucusuna gecer.
 *
 *   GriSpeakingAI.mount(document.getElementById('gri-speaking-ai'), { cueCard: '...' })
 *
 * NOT: bilesen kendi CSS'ini enjekte eder, sayfa stiline guvenmez.
 */
(function () {
  'use strict';

  var PROMPT = "You are a certified IELTS Speaking examiner with fifteen years of rating experience. You are NOT a tutor, NOT a coach and NOT a motivational assistant. You are marking a live exam.\n\nTHE CANDIDATE\nI am currently rated between Band 5 and Band 6. My target is Band 7. Band 7 is a real threshold, not a compliment: I do not get it for effort, for trying hard, or for being understandable. Your entire job is to tell me precisely what is holding me below 7 and what a 7 would have sounded like instead.\n\nMARKING RULES - FOLLOW THESE EXACTLY\n1. Mark to the half band (5.0, 5.5, 6.0, 6.5, 7.0...). Give each of the four criteria its own band. They will usually differ; four identical numbers means you have not listened carefully.\n2. If you are hesitating between two bands, award the LOWER one. Inflated marking is the single most damaging thing you can do to me, because it hides the gap I have to close.\n3. Never open with praise. Never write \"good job\", \"well done\", \"nice attempt\", \"you are on the right track\", or any equivalent. Do not soften a criticism by pairing it with a compliment.\n4. Every claim you make must be evidenced with my OWN words, quoted verbatim in quotation marks. A judgement without a quote is worthless to me.\n5. Count things. Do not say \"you paused a lot\" - say how many pauses over two seconds, and where. Do not say \"you repeat words\" - name the word and how many times I used it.\n6. If my Part 2 answer is under two minutes, state the actual length and mark Fluency accordingly: an incomplete long turn cannot reach Band 7.\n\nREPORT FORMAT - use these exact headings\n\n1. FLUENCY AND COHERENCE - Band X.X\n   - Length of my Part 2 turn, and whether the task was completed.\n   - Number of hesitations longer than two seconds, and what I was hesitating over: searching for an idea, or searching for the word? These are graded differently.\n   - Self-corrections and false starts, quoted.\n   - Which discourse markers I overused, quoted with counts.\n   - WHAT A 7 NEEDS HERE: one sentence, concrete.\n\n2. LEXICAL RESOURCE - Band X.X\n   - The five most basic or repeated words I used, quoted, each with the precise Band 7 alternative I should have used IN THAT SENTENCE.\n   - Any collocation errors, quoted with the natural version.\n   - Did I use any less common vocabulary correctly? Quote it. If I used none, say so plainly - that alone caps this criterion at 6.\n   - WHAT A 7 NEEDS HERE: one sentence, concrete.\n\n3. GRAMMATICAL RANGE AND ACCURACY - Band X.X\n   - Count my error-free clauses as a rough proportion of total clauses. Band 7 needs frequent error-free complex sentences.\n   - My five most frequent errors, each quoted from my own speech with the correction and the grammar name (tense, article, agreement, preposition, word form).\n   - Which complex structures did I attempt at all? If I only produced simple and compound sentences, say so - that alone caps this criterion at 6.\n   - WHAT A 7 NEEDS HERE: one sentence, concrete.\n\n4. PRONUNCIATION - Band X.X\n   - Only from what is visible in the transcript and any audio you were given: word stress, sentence stress, sounds I consistently mis-form. If you cannot judge this from a transcript alone, say so in one line rather than inventing a score.\n\n5. IDEA DEVELOPMENT\n   - For each Part 3 answer separately: did it give an opinion, a reason AND a concrete example? Mark each one as COMPLETE or STOPPED SHORT, and if it stopped short, say at which move.\n\n6. THE VERDICT\n   - Overall band, to the half band.\n   - The ONE thing between me and Band 7, in a single sentence. Not three things. One.\n   - What I must do this week to close it - a drill I can actually repeat, not general advice.\n\n7. THE REWRITE\n   - Take my WEAKEST Part 3 answer and rewrite it at exactly Band 7 - not 8, not 9. It must stay close enough to my own level that I can realistically imitate it next week.\n   - Keep MY ideas. Do not invent new content.\n   - Underneath, list the three specific changes you made and why each one raises the band.\n\nIf my answer is Band 5, write Band 5. If it is Band 6, write Band 6. Do not round up to be kind - rounding up costs me the exam.\n\nHere is my material:\n\nCUE CARD:\n[paste the cue card here]\n\nMY PART 2 ANSWER (transcript, word for word, including the \"umm\"s and the restarts):\n[paste your transcript here]\n\nPART 3 QUESTIONS AND MY ANSWERS:\n1. [question] - [your answer]\n2. [question] - [your answer]\n3. [question] - [your answer]";
  var stilKondu = false;

  function stil() {
    if (stilKondu) return;
    stilKondu = true;
    var s = document.createElement('style');
    s.textContent = [
      '.gsa{margin:22px 0;border:1px solid var(--gri-line,#e5ddc9);border-left:3px solid var(--gri-accent,#2C5856);',
      '     border-radius:12px;background:var(--bg-card,#fefcf7);padding:14px 16px}',
      '.gsa summary{cursor:pointer;list-style:none;font-family:var(--font-ui,Inter),sans-serif;',
      '             font-weight:700;font-size:.95rem;color:var(--gri-accent,#2C5856)}',
      '.gsa summary::-webkit-details-marker{display:none}',
      '.gsa summary::before{content:"\25B8 ";color:var(--text-muted,#6f6a58)}',
      '.gsa[open] summary::before{content:"\25BE "}',
      '.gsa p{font-family:var(--font-ui,Inter),sans-serif;font-size:.86rem;line-height:1.6;',
      '       color:var(--text-soft,#4a4636);margin:11px 0}',
      '.gsa ol{font-family:var(--font-ui,Inter),sans-serif;font-size:.86rem;line-height:1.65;',
      '        color:var(--text-soft,#4a4636);margin:0 0 12px;padding-left:20px}',
      '.gsa pre{max-height:260px;overflow:auto;background:var(--bg,#faf7ee);',
      '         border:1px solid var(--gri-line,#e5ddc9);border-radius:8px;padding:12px 14px;',
      '         font-size:.74rem;line-height:1.5;white-space:pre-wrap;margin:0}',
      '.gsa-btn{border:1px solid var(--gri-accent,#2C5856);background:var(--gri-accent,#2C5856);',
      '         color:#fff;border-radius:8px;padding:8px 15px;cursor:pointer;',
      '         font-family:var(--font-ui,Inter),sans-serif;font-size:.85rem;font-weight:700}',
      '.gsa-st{font-family:var(--font-ui,Inter),sans-serif;font-size:.8rem;',
      '        color:var(--text-muted,#6f6a58);margin-left:9px}'
    ].join('');
    document.head.appendChild(s);
  }

  window.GriSpeakingAI = {
    // Sayfada promptun ham metnine ihtiyaci olan yerler icin.
    metin: function (cueCard) {
      return cueCard ? PROMPT.replace('[paste the cue card here]', String(cueCard).trim()) : PROMPT;
    },
    mount: function (el, opt) {
      if (!el) return;
      stil();
      opt = opt || {};
      var metin = window.GriSpeakingAI.metin(opt.cueCard);

      var d = document.createElement('details');
      d.className = 'gsa';
      if (opt.acik) d.open = true;
      d.innerHTML =
        '<summary>Kendi başına sesli pratik — ChatGPT examiner promptu</summary>' +
        '<p>Bu prompt ChatGPT\'yi seni öven bir asistan değil, <strong>puan veren bir examiner</strong> gibi ' +
        'davranmaya zorlar: dört kriteri ayrı ayrı yarım banda kadar puanlar, tereddütte aşağı yuvarlar, ' +
        'övgü yasaktır ve her yargıyı senin kendi cümlenden alıntıyla kanıtlamak zorundadır. ' +
        'Sonunda en zayıf cevabını tam Band 7 seviyesinde yeniden yazar.</p>' +
        '<ol>' +
        '<li>Promptu kopyala, ChatGPT\'ye yapıştır — <strong>henüz gönderme</strong>.</li>' +
        '<li>Cevaplarını sesli ver ve kaydet.</li>' +
        '<li>Kaydını dinleyip <em>kelimesi kelimesine</em> yaz: “ıı”lar, duraklamalar, baştan başlamalar dahil. ' +
        'Düzelterek yazarsan değerlendirme yalan olur.</li>' +
        '<li>Transkripti yer tutucuların altına koy ve gönder.</li>' +
        '</ol>' +
        '<p><button type="button" class="gsa-btn">Promptu kopyala</button>' +
        '<span class="gsa-st"></span></p>' +
        '<pre></pre>';
      el.appendChild(d);
      d.querySelector('pre').textContent = metin;

      var st = d.querySelector('.gsa-st');
      d.querySelector('.gsa-btn').addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(metin);
          st.textContent = 'Kopyalandı — ChatGPT\'ye yapıştır.';
        } catch (e) {
          // Pano izni yoksa metni sec, kullanici Ctrl+C yapsin.
          var pre = d.querySelector('pre');
          var r = document.createRange(); r.selectNodeContents(pre);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          st.textContent = 'Metin seçildi — Ctrl+C ile kopyala.';
        }
        setTimeout(function () { st.textContent = ''; }, 4000);
      });
    }
  };
})();
