/* gri-bg.js — Deneysel yüksek-kalite arka plan işlemcisi (Gri Meet).
 * track-processors sert (binary) maske kullanıyor → kenarlar kaba, arkadaki nesneler sızıyor.
 * Bu modül MediaPipe ImageSegmenter'ı CONFIDENCE (yumuşak/alpha) maske ile çalıştırır,
 * maskeyi tüylendirip (blur) kamera karesini arka planla alpha-harmanlar → yumuşak kenar.
 * LiveKit Track.Processor arayüzünü uygular: init/restart/destroy + processedTrack.
 * Yalnızca ?hqbg=1 bayrağıyla devreye girer (grimeet.js). Hata olursa çağıran taraf
 * eski track-processors yoluna düşer.
 *
 * OTOMATİK ÇERÇEVELEME (opt-in, opts.autoframe): MediaPipe FaceDetector ile yüz(ler)i bulup
 * hesaplanan kırpma dikdörtgenini (headroom + zamansal yumuşatma) çıkışa cover-fit çizer —
 * kişi kadraja ortalanır (Center Stage benzeri). Arka plan modundan bağımsız çalışır:
 *   - mode!=='none' + autoframe: segmentasyon + kişi/maske aynı kırpma ile çizilir.
 *   - mode==='none' + autoframe: segmentasyon YOK, ucuz passthrough+crop.
 * autoframe=false iken kod yolu ESKİSİYLE BİREBİR AYNI kalır (regression yok).
 */
(function () {
  var VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18';
  // Çok-sınıflı model: background/hair/body/face/clothes/others → daha keskin sınır.
  // confidenceMasks[0] = ARKA PLAN güveni; kişi = 1 - background.
  var MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
  // Yüz bulucu (otomatik çerçeveleme): hafif, kısa menzil.
  var FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';
  var _seg = null, _segLoading = null;
  var _det = null, _detLoading = null;

  function loadSegmenter() {
    if (_seg) return Promise.resolve(_seg);
    if (_segLoading) return _segLoading;
    _segLoading = (async function () {
      var vision = await import(VISION + '/vision_bundle.mjs');
      var fileset = await vision.FilesetResolver.forVisionTasks(VISION + '/wasm');
      _seg = await vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
        outputCategoryMask: false
      });
      return _seg;
    })();
    return _segLoading;
  }

  // FaceDetector — segmenter gibi tekil (singleton) tutulur: toggle açılıp kapandıkça
  // yeniden yüklenmesin. CDN yüklemesi başarısızsa hata YUTULUR (autoframe sessizce devre dışı).
  function loadDetector() {
    if (_det) return Promise.resolve(_det);
    if (_detLoading) return _detLoading;
    _detLoading = (async function () {
      var vision = await import(VISION + '/vision_bundle.mjs');
      var fileset = await vision.FilesetResolver.forVisionTasks(VISION + '/wasm');
      _det = await vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO'
      });
      return _det;
    })();
    return _detLoading;
  }

  function drawCover(ctx, src, w, h, sw, sh, flip) {
    // cover-fit src (sw×sh) into w×h, optional horizontal flip
    var sc = Math.max(w / sw, h / sh);
    var dw = sw * sc, dh = sh * sc, dx = (w - dw) / 2, dy = (h - dh) / 2;
    ctx.save();
    if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, dx, dy, dw, dh);
    ctx.restore();
  }

  function create(opts) {
    // opts: { mode:'none'|'blur'|'image', blurRadius:number, imagePath:string|null, flip:bool, autoframe:bool }
    opts = opts || {};
    var proc = { name: 'gri-bg-soft' };
    var video, out, octx, work, wctx, maskC, mctx, bgImg = null, stopped = false, seg = null, detector = null, prevArr = null;
    var autoframe = !!opts.autoframe;
    var needSeg = opts.mode && opts.mode !== 'none';
    // Otomatik çerçeveleme durumu (video piksel koordinatlarında)
    var cropCur = null, cropTarget = null, noFaceCount = 0, _fc = 0, _ts = 0;
    var DETECT_EVERY = 3;          // her 3. karede yüz ara (perf)
    var EMA = 0.15;                // yumuşatma katsayısı (0.85 eski + 0.15 yeni)
    var MIN_CROP_FRAC = 0.55;      // kırpma genişliği ≥ video genişliğinin %55'i (aşırı zoom yok)

    function nextTs() { _ts = Math.max(_ts + 1, performance.now()); return _ts; }

    async function setup(track) {
      if (needSeg) seg = await loadSegmenter();
      if (autoframe) { try { detector = await loadDetector(); } catch (e) { detector = null; } }
      video = document.createElement('video');
      video.muted = true; video.playsInline = true; video.autoplay = true;
      video.srcObject = new MediaStream([track]);
      await new Promise(function (res) {
        if (video.readyState >= 1 && video.videoWidth) return res();
        video.onloadedmetadata = function () { res(); };
        setTimeout(res, 1500);
      });
      try { await video.play(); } catch (e) {}
      var w = video.videoWidth || 1280, h = video.videoHeight || 720;
      out = document.createElement('canvas'); out.width = w; out.height = h;
      octx = out.getContext('2d', { alpha: false });
      if (needSeg) {
        work = document.createElement('canvas'); work.width = w; work.height = h;
        wctx = work.getContext('2d');
        maskC = document.createElement('canvas'); mctx = maskC.getContext('2d');
      }
      if (opts.mode === 'image' && opts.imagePath) {
        bgImg = new Image(); bgImg.crossOrigin = 'anonymous'; bgImg.src = opts.imagePath;
        try { await bgImg.decode(); } catch (e) {}
      }
      proc.processedTrack = out.captureStream(60).getVideoTracks()[0];
      stopped = false;
      startLoop();
    }

    // ---- Otomatik çerçeveleme: hedef kırpma dikdörtgeni ----
    function updateCropTarget(ts) {
      if (!detector) return;
      var vw = video.videoWidth, vh = video.videoHeight;
      var full = { x: 0, y: 0, w: vw, h: vh };
      var res = detector.detectForVideo(video, ts);
      var dets = (res && res.detections) || [];
      if (!dets.length) {
        // Yüz yok → yavaşça tam kareye dön (birkaç kare bekle, flicker olmasın)
        if (++noFaceCount > 12) cropTarget = full;
        return;
      }
      noFaceCount = 0;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (var i = 0; i < dets.length; i++) {
        var b = dets[i].boundingBox; if (!b) continue;
        if (b.originX < minX) minX = b.originX;
        if (b.originY < minY) minY = b.originY;
        if (b.originX + b.width > maxX) maxX = b.originX + b.width;
        if (b.originY + b.height > maxY) maxY = b.originY + b.height;
      }
      if (minX === Infinity) { if (++noFaceCount > 12) cropTarget = full; return; }
      var fw = maxX - minX, fh = maxY - minY;
      // Baş boşluğu (üst) + gövde payı (alt) + yanlar
      var cx0 = minX - fw * 0.4, cx1 = maxX + fw * 0.4;
      var cy0 = minY - fh * 0.6, cy1 = maxY + fh * 0.9;
      var ccx = (cx0 + cx1) / 2, ccy = (cy0 + cy1) / 2;
      var cw = cx1 - cx0, ch = cy1 - cy0;
      var ar = vw / vh;
      // En-boy oranını ÇIKIŞ oranına sabitle
      if (cw / ch < ar) cw = ch * ar; else ch = cw / ar;
      // Min zoom sınırı (aşırı yakınlaşma yok)
      if (cw < vw * MIN_CROP_FRAC) { cw = vw * MIN_CROP_FRAC; ch = cw / ar; }
      // Tam kareyi aşma
      if (cw > vw) { cw = vw; ch = cw / ar; }
      if (ch > vh) { ch = vh; cw = ch * ar; }
      var x = ccx - cw / 2, y = ccy - ch / 2;
      x = Math.max(0, Math.min(vw - cw, x));
      y = Math.max(0, Math.min(vh - ch, y));
      // Ölü-bölge (deadzone): küçük hareketlerde hedefi oynatma → jitter yok
      if (cropTarget) {
        var dz = vw * 0.03;
        if (Math.abs(x - cropTarget.x) < dz && Math.abs(y - cropTarget.y) < dz &&
            Math.abs(cw - cropTarget.w) < dz && Math.abs(ch - cropTarget.h) < dz) return;
      }
      cropTarget = { x: x, y: y, w: cw, h: ch };
    }

    function stepCrop() {
      var vw = video.videoWidth, vh = video.videoHeight;
      if (!cropTarget) cropTarget = { x: 0, y: 0, w: vw, h: vh };
      if (!cropCur) { cropCur = { x: cropTarget.x, y: cropTarget.y, w: cropTarget.w, h: cropTarget.h }; return; }
      cropCur.x += (cropTarget.x - cropCur.x) * EMA;
      cropCur.y += (cropTarget.y - cropCur.y) * EMA;
      cropCur.w += (cropTarget.w - cropCur.w) * EMA;
      cropCur.h += (cropTarget.h - cropCur.h) * EMA;
    }

    function drawCropped(ctx, src, ow, oh, crop) {
      // crop en-boy oranı = ow/oh (aspect-locked) → düzgün ölçek
      ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, ow, oh);
    }

    function startLoop() {
      function frame() {
        if (stopped) return;
        try {
          if (video.readyState >= 2 && video.videoWidth) {
            if (out.width !== video.videoWidth) {
              out.width = video.videoWidth; out.height = video.videoHeight;
              if (work) { work.width = video.videoWidth; work.height = video.videoHeight; }
              cropCur = null; cropTarget = null; // boyut değişti → koordinatları sıfırla
            }
            if (autoframe && detector) {
              _fc++;
              if (_fc % DETECT_EVERY === 0) { try { updateCropTarget(nextTs()); } catch (e) {} }
              stepCrop();
            }
            if (seg) {
              seg.segmentForVideo(video, nextTs(), onSeg);
            } else {
              drawPassthrough();
            }
          }
        } catch (e) {
          try { octx.drawImage(video, 0, 0, out.width, out.height); } catch (_) {}
        }
        if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(frame);
        else setTimeout(frame, 33);
      }
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(frame);
      else setTimeout(frame, 33);
    }

    function drawPassthrough() {
      // Arka plan YOK: sadece video (autoframe açıksa kırpma bölgesi) çıkışa cover-fit
      var w = out.width, h = out.height;
      if (autoframe && cropCur) drawCropped(octx, video, w, h, cropCur);
      else octx.drawImage(video, 0, 0, w, h);
    }

    function onSeg(result) {
      try { composite(result); }
      catch (e) { try { octx.drawImage(video, 0, 0, out.width, out.height); } catch (_) {} }
      try { if (result && result.close) result.close(); } catch (e) {}
    }

    function drawBackground(w, h) {
      if (opts.mode === 'blur') {
        octx.save();
        octx.filter = 'blur(' + (opts.blurRadius || 14) + 'px)';
        drawCover(octx, video, w, h, video.videoWidth, video.videoHeight, false);
        octx.filter = 'none';
        octx.restore();
      } else if (bgImg && bgImg.complete && bgImg.naturalWidth) {
        drawCover(octx, bgImg, w, h, bgImg.naturalWidth, bgImg.naturalHeight, !!opts.flip);
      } else {
        octx.fillStyle = '#101418'; octx.fillRect(0, 0, w, h);
      }
    }

    function composite(result) {
      var w = out.width, h = out.height;
      drawBackground(w, h);
      var cm = result && result.confidenceMasks && result.confidenceMasks[0];
      if (!cm || !cm.getAsFloat32Array) {
        if (autoframe && cropCur) drawCropped(octx, video, w, h, cropCur);
        else octx.drawImage(video, 0, 0, w, h);
        return;
      }
      var mw = cm.width, mh = cm.height;
      var arr = cm.getAsFloat32Array();
      if (!prevArr || prevArr.length !== arr.length) prevArr = new Float32Array(arr);
      // person confidence -> alpha mask (mask-res), zamansal yumuşatma + kontrast + smoothstep
      maskC.width = mw; maskC.height = mh;
      var mid = mctx.createImageData(mw, mh);
      var d = mid.data;
      for (var i = 0, j = 0; i < arr.length; i++, j += 4) {
        var a = 1 - arr[i]; if (a < 0) a = 0; else if (a > 1) a = 1; // kişi = 1 - arka plan (multiclass)
        var sm = prevArr[i] * 0.72 + a * 0.28; prevArr[i] = sm;     // güçlü zamansal yumuşatma (dalgalı vücut-silme/flicker azalt)
        var v = (sm - 0.52) * 1.7 + 0.5; if (v < 0) v = 0; else if (v > 1) v = 1; // eşik hafif düşük (vücudu koru) + kontrast (sandalye)
        v = v * v * (3 - 2 * v);                                    // smoothstep: kenar yumuşat
        d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; d[j + 3] = (v * 255) | 0;
      }
      mctx.putImageData(mid, 0, 0);
      // person frame on work canvas — autoframe açıksa kişi katmanı KIRPMA bölgesinden çizilir
      wctx.clearRect(0, 0, w, h);
      if (autoframe && cropCur) drawCropped(wctx, video, w, h, cropCur);
      else wctx.drawImage(video, 0, 0, w, h);
      // apply feathered mask as alpha (scale mask up + blur = soft edges)
      wctx.save();
      wctx.globalCompositeOperation = 'destination-in';
      wctx.filter = 'blur(3px)';
      if (autoframe && cropCur) {
        // Maske de aynı kırpma ile ölçeklenmeli (mask-koordinatları = crop * (mask/video))
        var vw = video.videoWidth, vh = video.videoHeight;
        var msx = cropCur.x * mw / vw, msy = cropCur.y * mh / vh;
        var msw = cropCur.w * mw / vw, msh = cropCur.h * mh / vh;
        wctx.drawImage(maskC, msx, msy, msw, msh, 0, 0, w, h);
      } else {
        wctx.drawImage(maskC, 0, 0, mw, mh, 0, 0, w, h);
      }
      wctx.filter = 'none';
      wctx.restore();
      // composite person over background
      octx.drawImage(work, 0, 0);
    }

    proc.init = function (o) { return setup(o.track); };
    proc.restart = function (o) {
      // kaynak track değişti (ör. kamera değişimi)
      try { if (video) video.srcObject = new MediaStream([o.track]); } catch (e) {}
      cropCur = null; cropTarget = null; noFaceCount = 0;
      return Promise.resolve();
    };
    proc.destroy = function () {
      stopped = true;
      try { if (proc.processedTrack) proc.processedTrack.stop(); } catch (e) {}
      try { if (video) { video.pause(); video.srcObject = null; } } catch (e) {}
      // NOT: _seg / _det tekil (singleton) ve yeniden kullanılır — burada KAPATILMAZ
      // (mevcut destroy kalıbı; kapatmak sonraki oturumda ağır yeniden-yüklemeye yol açardı).
      return Promise.resolve();
    };
    return proc;
  }

  window.GriBg = { create: create, preload: loadSegmenter, preloadFace: loadDetector };
})();
