/* gri-ses-kaydi.js — paylasilan ses kaydedici.
 *
 * Calisma Programim'daki odev satirinda ve konusma pratigi sayfasinda ayni
 * kaydedici kullanilir; ikisi ayri kopya olsaydi dalga formu/silme mantigi
 * zamanla birbirinden ayrilirdi.
 *
 *   GriSesKaydi.mount({ sb, el, folder, onUpload })
 *     sb       : supabase istemcisi
 *     el       : icine render edilecek eleman
 *     folder   : storage yolu, "<uid>/<program_id>/hw<index>"
 *     onUpload : yukleme basarili olunca cagrilir (opsiyonel)
 *
 * Donen nesne: { yenile() }  — liste disaridan tazelenebilsin diye.
 *
 * NOT: bilesen kendi CSS'ini enjekte eder; main.css'e guvenmez (paylasilan
 * bilesenlerin sayfa stiline bagimli olmamasi kurali).
 */
(function () {
  'use strict';

  var BUCKET = 'speaking-submissions';
  var MAX_MS = 12 * 60 * 1000;
  var MAX_BYTES = 10 * 1024 * 1024;
  var stilKondu = false;

  function stil() {
    if (stilKondu) return;
    stilKondu = true;
    var css = document.createElement('style');
    css.textContent = [
      '.gsk{margin:8px 0 2px;padding:10px 12px;border:1px solid var(--gri-line,#e5ddc9);',
      '     border-left:3px solid var(--wr,#c0672a);border-radius:8px;background:var(--gri-gold-soft,#f5ecd4)}',
      '.gsk-h{font-size:.68rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;',
      '       color:var(--wr,#c0672a);margin:0 0 7px}',
      '.gsk-btn{border:1px solid var(--gri-line,#e5ddc9);background:var(--bg-card,#fff);',
      '         color:var(--text,#23291f);border-radius:8px;padding:6px 13px;cursor:pointer;',
      '         font-family:inherit;font-size:.82rem;font-weight:600;margin-right:6px}',
      '.gsk-btn:hover{border-color:var(--wr,#c0672a)}',
      '.gsk-btn.on{background:#a33b3b;border-color:#a33b3b;color:#fff}',
      '.gsk-btn:disabled{opacity:.5;cursor:default}',
      '.gsk-viz{display:flex;align-items:center;gap:9px;margin:9px 0 2px}',
      '.gsk-viz canvas{flex:1;height:40px;width:100%;color:var(--wr,#c0672a);',
      '                background:rgba(192,103,42,.1);border-radius:6px}',
      '.gsk-clock{font-variant-numeric:tabular-nums;font-size:.86rem;font-weight:700;color:var(--wr,#c0672a)}',
      '.gsk-st{font-size:.78rem;color:var(--text-muted,#6f6a58);margin-top:6px}',
      '.gsk-row{display:flex;align-items:center;gap:8px;margin-top:7px}',
      '.gsk-row audio{flex:1;min-width:0;height:34px}',
      '.gsk-del{border:1px solid var(--gri-line,#e5ddc9);background:var(--bg-card,#fff);',
      '         color:var(--text-muted,#6f6a58);border-radius:7px;padding:4px 9px;',
      '         font-family:inherit;font-size:.76rem;font-weight:600;cursor:pointer}',
      '.gsk-del:hover{border-color:#a33b3b;color:#a33b3b}',
      '.gsk-del:disabled{opacity:.5;cursor:default}'
    ].join('');
    document.head.appendChild(css);
  }

  function sure(sn) {
    return Math.floor(sn / 60) + ':' + ('0' + (sn % 60)).slice(-2);
  }

  window.GriSesKaydi = {
    mount: function (opt) {
      stil();
      var sb = opt.sb, el = opt.el, folder = opt.folder;
      var kutu = document.createElement('div');
      kutu.className = 'gsk';
      kutu.innerHTML =
        '<div class="gsk-h">' + (opt.baslik || 'Ses kaydı') + '</div>' +
        '<div><button type="button" class="gsk-btn" data-a="rec">● Kaydet</button>' +
        '<button type="button" class="gsk-btn" data-a="file">Dosya yükle</button>' +
        '<input type="file" accept="audio/*" hidden></div>' +
        '<div class="gsk-viz" data-r="viz" hidden><canvas></canvas><span class="gsk-clock" data-r="clock">0:00</span></div>' +
        '<div class="gsk-st" data-r="st"></div><div data-r="list"></div>';
      el.appendChild(kutu);

      // Salt okunur: ogretmen bu bilesenle kayit alamaz (zaten storage politikasi
      // baskasinin klasorune yazmaya izin vermez), yalnizca dinler ve silebilir.
      if (opt.saltOkunur) {
        kutu.querySelector('[data-a="rec"]').remove();
        kutu.querySelector('[data-a="file"]').remove();
      }
      var recBtn = kutu.querySelector('[data-a="rec"]');
      var fileBtn = kutu.querySelector('[data-a="file"]');
      var fileInp = kutu.querySelector('input[type=file]');
      var vizWrap = kutu.querySelector('[data-r="viz"]');
      var cv = vizWrap.querySelector('canvas');
      var clock = kutu.querySelector('[data-r="clock"]');
      var stEl = kutu.querySelector('[data-r="st"]');
      var listEl = kutu.querySelector('[data-r="list"]');

      var mediaRec = null, chunks = [], kesTimer = null;
      var audioCtx = null, raf = null, gecmis = [];

      // Mikrofondan gelen sinyalin RMS'i her karede olculup kaydirmali cubuk
      // grafigi cizilir. Amac olcum degil, "ses geliyor mu" geri bildirimi.
      function vizBaslat(stream, bitisSn) {
        vizWrap.hidden = false;
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          var an = audioCtx.createAnalyser();
          an.fftSize = 1024;
          audioCtx.createMediaStreamSource(stream).connect(an);
          var buf = new Uint8Array(an.fftSize);
          gecmis = [];
          var t0 = Date.now();
          (function ciz() {
            an.getByteTimeDomainData(buf);
            var t = 0;
            for (var i = 0; i < buf.length; i++) { var d = (buf[i] - 128) / 128; t += d * d; }
            gecmis.push(Math.sqrt(t / buf.length));

            var w = cv.clientWidth || 300, h = cv.clientHeight || 40;
            if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
            var kalin = 3, bosluk = 2, adet = Math.max(1, Math.floor(w / (kalin + bosluk)));
            if (gecmis.length > adet) gecmis = gecmis.slice(-adet);
            var g = cv.getContext('2d');
            g.clearRect(0, 0, w, h);
            g.fillStyle = getComputedStyle(cv).color;
            for (var j = 0; j < gecmis.length; j++) {
              var y = Math.max(2, Math.min(h - 2, gecmis[j] * h * 3.2));
              g.fillRect(j * (kalin + bosluk), (h - y) / 2, kalin, y);
            }
            var sn = Math.floor((Date.now() - t0) / 1000);
            clock.textContent = bitisSn ? sure(Math.max(0, bitisSn - sn)) : sure(sn);
            raf = requestAnimationFrame(ciz);
          })();
        } catch (e) { vizWrap.hidden = true; }   // AudioContext yoksa kayit yine surer
      }
      function vizDurdur() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
        vizWrap.hidden = true;
      }

      async function yukle(blob, ext) {
        if (blob.size > MAX_BYTES) { stEl.textContent = 'Kayıt çok büyük (>10MB). Daha kısa kaydet.'; return; }
        stEl.textContent = 'Yükleniyor…';
        var ad = 'kayit-' + Date.now() + '.' + ext;
        var r = await sb.storage.from(BUCKET).upload(folder + '/' + ad, blob,
          { contentType: blob.type || 'audio/webm', upsert: false });
        if (r.error) { stEl.textContent = 'Yüklenemedi: ' + r.error.message; return; }
        stEl.textContent = 'Yüklendi (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB). Öğretmenin dinleyebilir.';
        if (opt.onUpload) { try { opt.onUpload(); } catch (e) {} }
        yenile();
      }

      async function yenile() {
        var l = await sb.storage.from(BUCKET).list(folder,
          { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });
        listEl.innerHTML = '';
        (l.data || []).forEach(function (f) {
          var yol = folder + '/' + f.name;
          var row = document.createElement('div');
          row.className = 'gsk-row';
          var del = document.createElement('button');
          del.type = 'button'; del.className = 'gsk-del'; del.textContent = 'Sil';
          del.addEventListener('click', async function () {
            if (!confirm('Bu ses kaydını silmek istediğine emin misin? Geri alınamaz.')) return;
            del.disabled = true; stEl.textContent = 'Siliniyor…';
            var d = await sb.storage.from(BUCKET).remove([yol]);
            if (d.error) { stEl.textContent = 'Silinemedi: ' + d.error.message; del.disabled = false; return; }
            stEl.textContent = 'Kayıt silindi.'; yenile();
          });
          sb.storage.from(BUCKET).createSignedUrl(yol, 3600).then(function (s) {
            if (s.data && s.data.signedUrl) {
              var a = document.createElement('audio');
              a.controls = true; a.src = s.data.signedUrl;
              row.insertBefore(a, del);
            }
          });
          row.appendChild(del);
          listEl.appendChild(row);
        });
      }

      // bitisSn verilirse o sureden sonra kayit kendiliginden durur (cue card 2 dk).
      async function kayitBaslat(bitisSn) {
        if (mediaRec && mediaRec.state === 'recording') { mediaRec.stop(); return; }
        try {
          var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          var o = { audioBitsPerSecond: 48000 };
          try { o.mimeType = 'audio/webm;codecs=opus'; } catch (e) {}
          mediaRec = new MediaRecorder(stream, o);
          chunks = [];
          mediaRec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          mediaRec.onstop = function () {
            clearTimeout(kesTimer); vizDurdur();
            if (recBtn) { recBtn.textContent = '● Kaydet'; recBtn.classList.remove('on'); }
            stream.getTracks().forEach(function (t) { t.stop(); });
            yukle(new Blob(chunks, { type: 'audio/webm' }), 'webm');
          };
          mediaRec.start();
          vizBaslat(stream, bitisSn);
          if (recBtn) { recBtn.textContent = '■ Durdur'; recBtn.classList.add('on'); }
          stEl.textContent = bitisSn
            ? ('Kaydediliyor… ' + sure(bitisSn) + ' sonunda kendiliğinden duracak.')
            : 'Kaydediliyor… (en fazla 12 dk)';
          var ms = bitisSn ? bitisSn * 1000 : MAX_MS;
          kesTimer = setTimeout(function () {
            if (mediaRec && mediaRec.state === 'recording') mediaRec.stop();
          }, Math.min(ms, MAX_MS));
        } catch (e) {
          stEl.textContent = 'Mikrofon izni gerekli. Tarayıcı izin penceresinde "İzin ver" de.';
        }
      }

      if (recBtn) recBtn.addEventListener('click', function () { kayitBaslat(null); });
      if (fileBtn) fileBtn.addEventListener('click', function () { fileInp.click(); });
      fileInp.addEventListener('change', function () {
        if (!fileInp.files[0]) return;
        var f = fileInp.files[0];
        yukle(f, (f.name.split('.').pop() || 'webm').toLowerCase());
      });

      yenile();
      return { yenile: yenile, kayitBaslat: kayitBaslat, durdur: function () { if (mediaRec && mediaRec.state === 'recording') mediaRec.stop(); } };
    }
  };
})();
