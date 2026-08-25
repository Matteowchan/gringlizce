/* gri-bg.js — Deneysel yüksek-kalite arka plan işlemcisi (Gri Meet).
 * track-processors sert (binary) maske kullanıyor → kenarlar kaba, arkadaki nesneler sızıyor.
 * Bu modül MediaPipe ImageSegmenter'ı CONFIDENCE (yumuşak/alpha) maske ile çalıştırır,
 * maskeyi tüylendirip (blur) kamera karesini arka planla alpha-harmanlar → yumuşak kenar.
 * LiveKit Track.Processor arayüzünü uygular: init/restart/destroy + processedTrack.
 * Yalnızca ?hqbg=1 bayrağıyla devreye girer (grimeet.js). Hata olursa çağıran taraf
 * eski track-processors yoluna düşer.
 */
(function () {
  var VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18';
  var MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
  var _seg = null, _segLoading = null;

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
    // opts: { mode:'blur'|'image', blurRadius:number, imagePath:string|null, flip:bool }
    opts = opts || {};
    var proc = { name: 'gri-bg-soft' };
    var video, out, octx, work, wctx, maskC, mctx, bgImg = null, stopped = false, seg = null, prevArr = null;

    async function setup(track) {
      seg = await loadSegmenter();
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
      work = document.createElement('canvas'); work.width = w; work.height = h;
      wctx = work.getContext('2d');
      maskC = document.createElement('canvas'); mctx = maskC.getContext('2d');
      if (opts.mode === 'image' && opts.imagePath) {
        bgImg = new Image(); bgImg.crossOrigin = 'anonymous'; bgImg.src = opts.imagePath;
        try { await bgImg.decode(); } catch (e) {}
      }
      proc.processedTrack = out.captureStream(30).getVideoTracks()[0];
      stopped = false;
      startLoop();
    }

    function startLoop() {
      function frame() {
        if (stopped) return;
        try {
          if (video.readyState >= 2 && video.videoWidth) {
            if (out.width !== video.videoWidth) {
              out.width = work.width = video.videoWidth;
              out.height = work.height = video.videoHeight;
            }
            seg.segmentForVideo(video, performance.now(), onSeg);
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
        octx.drawImage(video, 0, 0, w, h);
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
        var a = arr[i]; if (a < 0) a = 0; else if (a > 1) a = 1;
        var sm = prevArr[i] * 0.5 + a * 0.5; prevArr[i] = sm;      // titreme azalt (EMA)
        var v = (sm - 0.5) * 1.55 + 0.5; if (v < 0) v = 0; else if (v > 1) v = 1; // kontrast: sızıntı azalt
        v = v * v * (3 - 2 * v);                                   // smoothstep: kenar yumuşat
        d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; d[j + 3] = (v * 255) | 0;
      }
      mctx.putImageData(mid, 0, 0);
      // person frame on work canvas
      wctx.clearRect(0, 0, w, h);
      wctx.drawImage(video, 0, 0, w, h);
      // apply feathered mask as alpha (scale mask up + blur = soft edges)
      wctx.save();
      wctx.globalCompositeOperation = 'destination-in';
      wctx.filter = 'blur(3px)';
      wctx.drawImage(maskC, 0, 0, mw, mh, 0, 0, w, h);
      wctx.filter = 'none';
      wctx.restore();
      // composite person over background
      octx.drawImage(work, 0, 0);
    }

    proc.init = function (o) { return setup(o.track); };
    proc.restart = function (o) {
      // kaynak track değişti (ör. kamera değişimi)
      try { if (video) video.srcObject = new MediaStream([o.track]); } catch (e) {}
      return Promise.resolve();
    };
    proc.destroy = function () {
      stopped = true;
      try { if (proc.processedTrack) proc.processedTrack.stop(); } catch (e) {}
      try { if (video) { video.pause(); video.srcObject = null; } } catch (e) {}
      return Promise.resolve();
    };
    return proc;
  }

  window.GriBg = { create: create, preload: loadSegmenter };
})();
