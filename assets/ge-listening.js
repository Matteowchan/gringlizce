/* ============================================================
   Gri English — Genel İngilizce DİNLEME bileşeni (yeniden kullanılabilir)
   Her ünite sayfası:
     <div class="ge-lismount" data-slug-base="ge-c1-u1-l"></div>
     <script type="application/json" class="ge-lisdata"> {..config..} </script>
     <script src="assets/ge-listening.js?v=1" defer></script>
   Config: { video:{provider:"ted"|"youtube", ref:"slug|id"}, source:"künye",
     minutes:5, rounds:[ {label:"...", tasks:[ TASK, ... ]}, ... ] }
   TASK tipleri: mcq | gap | tf | match | order | table  (aşağıda örnek).
   Puanlama otomatik; recAns(slug,status) varsa user_answers'a yazar.
   ============================================================ */
(function(){
  "use strict";
  function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
  function norm(s){return String(s==null?"":s).toLowerCase().replace(/[^a-z0-9]/g,"");}
  function shuffle(a,seed){ // deterministik karıştırma (seed=index toplamı)
    a=a.slice(); var s=seed||7; for(var i=a.length-1;i>0;i--){ s=(s*9301+49297)%233280; var j=Math.floor(s/233280*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a;
  }
  function rec(slug,ok){ if(slug && typeof window.recAns==="function"){ try{ window.recAns(slug, ok?"correct":"incorrect"); }catch(e){} } }

  function injectCSS(){
    if(document.getElementById("ge-lis-css")) return;
    var s=document.createElement("style"); s.id="ge-lis-css";
    s.textContent=[
      ".ge-lisw .ge-lvideo{position:relative;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000}",
      ".ge-lisw .ge-lvideo iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
      ".ge-lisw .ge-lsrc{font-size:.76rem;color:var(--text-muted,#8a8a8a);margin:.5rem 0 0}",
      ".ge-lisw .ge-ltask{margin:1.1rem 0;padding-top:.4rem}",
      ".ge-lisw .ge-ltask>h3{font-size:1rem;margin:0 0 .2rem}",
      ".ge-lisw .ge-linst{font-size:.86rem;color:var(--text-muted,#888);margin:0 0 .6rem}",
      ".ge-lisw .ge-lq{padding:.6rem 0;border-bottom:1px solid var(--line,#eee)}",
      ".ge-lisw .ge-lq-q{font-size:.94rem;line-height:1.5;margin-bottom:.45rem}",
      ".ge-lisw .ge-lopt{display:block;width:100%;text-align:left;margin:.22rem 0;padding:.48rem .7rem;border:1px solid var(--line,#ddd);border-radius:8px;background:var(--bg-card,#fff);cursor:pointer;font-size:.9rem;color:inherit;font-family:inherit}",
      ".ge-lisw .ge-lopt.sel{border-color:var(--teal,#2c7a7b);background:rgba(44,120,110,.10)}",
      ".ge-lisw .ge-lgap{padding:.32rem .55rem;border:1px solid var(--line,#ccc);border-radius:6px;font-size:.9rem;min-width:90px;font-family:inherit}",
      ".ge-lisw select.ge-lsel{padding:.32rem .5rem;border:1px solid var(--line,#ccc);border-radius:6px;font-size:.88rem;font-family:inherit;background:var(--bg-card,#fff);color:inherit}",
      ".ge-lisw .ge-lrow{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;padding:.35rem 0}",
      ".ge-lisw table.ge-ltbl{border-collapse:collapse;width:100%;font-size:.88rem}",
      ".ge-lisw table.ge-ltbl th,.ge-lisw table.ge-ltbl td{border:1px solid var(--line,#ddd);padding:.4rem .5rem;text-align:left}",
      ".ge-lisw table.ge-ltbl th{background:rgba(44,120,110,.08)}",
      ".ge-lisw .ge-lfb{font-size:.83rem;font-weight:600;margin-top:.3rem}",
      ".ge-lisw .ge-lq.ok .ge-lfb,.ge-lisw .ge-lrow.ok .ge-lfb{color:#2e7d32}",
      ".ge-lisw .ge-lq.no .ge-lfb,.ge-lisw .ge-lrow.no .ge-lfb{color:#c0392b}",
      ".ge-lisw .ge-lq.ok .ge-lopt.sel{border-color:#2e7d32;background:rgba(46,125,50,.12)}",
      ".ge-lisw .ge-lq.no .ge-lopt.sel{border-color:#c0392b;background:rgba(192,57,43,.12)}",
      ".ge-lisw .ge-lscore{margin-top:.7rem;font-size:1.02rem}",
      ".ge-lisw .ge-lbtn{font-family:inherit;font-size:.85rem;font-weight:600;padding:.5rem 1rem;border-radius:999px;border:1px solid var(--teal,#2c7a7b);background:var(--teal,#2c7a7b);color:#fff;cursor:pointer}",
      ".ge-lisw .ge-lbtn.ghost{background:transparent;color:var(--teal-deep,#245)}",
      ".ge-lisw .ge-lround{margin-top:1.1rem}"
    ].join("");
    (document.head||document.documentElement).appendChild(s);
  }

  // ---- Görev renderer'ları ---- her görev: render(box, task, idxBase, slugBase, refs) döner; check(refs) puan {correct,total}
  function renderMCQ(task, base, slugBase){
    var h='<div class="ge-ltask"><div class="ge-linst">'+esc(task.instruction||"")+'</div>';
    task.items.forEach(function(it,i){ var n=base+i;
      h+='<div class="ge-lq" data-slug="'+slugBase+'-'+n+'" data-a="'+it.answer+'"><div class="ge-lq-q"><b>'+n+'.</b> '+esc(it.q)+'</div>';
      it.options.forEach(function(op,oi){ h+='<button type="button" class="ge-lopt" data-o="'+oi+'">'+String.fromCharCode(65+oi)+') '+esc(op)+'</button>'; });
      h+='<div class="ge-lfb"></div></div>';
    });
    return h+'</div>';
  }
  function renderGap(task, base, slugBase){
    var h='<div class="ge-ltask"><div class="ge-linst">'+esc(task.instruction||"Boşluğa TEK kelime yaz.")+'</div>';
    task.items.forEach(function(it,i){ var n=base+i; var parts=esc(it.q).split("____");
      h+='<div class="ge-lq" data-slug="'+slugBase+'-'+n+'" data-t="gap" data-a="'+esc(it.answer.join("|"))+'"><div class="ge-lq-q"><b>'+n+'.</b> '+parts[0]+'<input type="text" class="ge-lgap" autocomplete="off" aria-label="Soru '+n+'">'+(parts[1]||"")+'</div><div class="ge-lfb"></div></div>';
    });
    return h+'</div>';
  }
  function renderTF(task, base, slugBase){
    var h='<div class="ge-ltask"><div class="ge-linst">'+esc(task.instruction||"True mı False mı?")+'</div>';
    task.items.forEach(function(it,i){ var n=base+i;
      h+='<div class="ge-lq" data-slug="'+slugBase+'-'+n+'" data-t="tf" data-a="'+it.answer+'"><div class="ge-lq-q"><b>'+n+'.</b> '+esc(it.q)+'</div><button type="button" class="ge-lopt" data-o="true">True</button><button type="button" class="ge-lopt" data-o="false">False</button><div class="ge-lfb"></div></div>';
    });
    return h+'</div>';
  }
  function renderMatch(task, base, slugBase){
    // items:[{left, right}] ; öğrenci her sol için doğru sağı seçer
    var rights=task.items.map(function(x){return x.right;});
    var opts=shuffle(rights, base).map(function(r){return '<option value="'+esc(r)+'">'+esc(r)+'</option>';}).join("");
    var h='<div class="ge-ltask"><div class="ge-linst">'+esc(task.instruction||"Eşleştir.")+'</div>';
    task.items.forEach(function(it,i){ var n=base+i;
      h+='<div class="ge-lrow ge-lq" data-slug="'+slugBase+'-'+n+'" data-t="match" data-a="'+esc(it.right)+'"><span><b>'+n+'.</b> '+esc(it.left)+'</span> &rarr; <select class="ge-lsel"><option value="">— seç —</option>'+opts+'</select><span class="ge-lfb"></span></div>';
    });
    return h+'</div>';
  }
  function renderOrder(task, base, slugBase){
    // items: doğru sıradaki metinler; karıştırıp göster, öğrenci 1..N seçer
    var N=task.items.length; var idx=task.items.map(function(_,i){return i;});
    var shown=shuffle(idx, base);
    var numOpts=""; for(var k=1;k<=N;k++) numOpts+='<option value="'+k+'">'+k+'</option>';
    var h='<div class="ge-ltask"><div class="ge-linst">'+esc(task.instruction||"Duyduğun sıraya göre numaralandır (1 = ilk).")+'</div>';
    shown.forEach(function(origIdx,i){ var n=base+i;
      h+='<div class="ge-lrow ge-lq" data-slug="'+slugBase+'-'+n+'" data-t="order" data-a="'+(origIdx+1)+'"><select class="ge-lsel"><option value="">#</option>'+numOpts+'</select> <span>'+esc(task.items[origIdx])+'</span><span class="ge-lfb"></span></div>';
    });
    return h+'</div>';
  }
  function renderTable(task, base, slugBase){
    // headers:[...], rows:[[cell,...]] ; cell = string (sabit) veya {gap:true, answer:[...]}
    var h='<div class="ge-ltask"><div class="ge-linst">'+esc(task.instruction||"Tabloyu doldur.")+'</div><table class="ge-ltbl"><thead><tr>';
    (task.headers||[]).forEach(function(hd){ h+='<th>'+esc(hd)+'</th>'; });
    h+='</tr></thead><tbody>'; var gi=0;
    task.rows.forEach(function(row){ h+='<tr>'; row.forEach(function(cell){
      if(cell && typeof cell==="object" && cell.gap){ var n=base+gi; gi++;
        h+='<td class="ge-lq" data-slug="'+slugBase+'-'+n+'" data-t="gap" data-a="'+esc(cell.answer.join("|"))+'"><input type="text" class="ge-lgap" autocomplete="off" aria-label="Hücre '+n+'"><span class="ge-lfb"></span></td>';
      } else { h+='<td>'+esc(cell)+'</td>'; }
    }); h+='</tr>'; });
    return h+'</tbody></table></div>';
  }

  var RENDER={mcq:renderMCQ, gap:renderGap, tf:renderTF, match:renderMatch, order:renderOrder, table:renderTable};
  function taskCount(t){ if(t.type==="table"){ var c=0; t.rows.forEach(function(r){r.forEach(function(cell){if(cell&&cell.gap)c++;});}); return c; } return (t.items||[]).length; }

  function scoreBox(box){
    var qs=box.querySelectorAll(".ge-lq"); var correct=0, total=0;
    qs.forEach(function(q){ total++; var t=q.getAttribute("data-t"); var ok=false; var want=q.getAttribute("data-a");
      if(t==="gap"){ var v=norm(q.querySelector(".ge-lgap").value); ok=want.split("|").some(function(a){return norm(a)===v;}); }
      else if(t==="match"||t==="order"){ var sel=q.querySelector(".ge-lsel"); ok=(sel && String(sel.value)===String(want)); }
      else if(t==="tf"){ ok=(q.getAttribute("data-sel")===want); }
      else { ok=(q.getAttribute("data-sel")===want); } // mcq
      q.classList.toggle("ok",ok); q.classList.toggle("no",!ok);
      var fb=q.querySelector(".ge-lfb"); if(fb){
        var corr="";
        if(t==="gap") corr="Doğru: "+want.split("|")[0];
        else if(t==="match"||t==="order") corr="Doğru: "+want;
        else if(t==="tf") corr="Doğru: "+(want==="true"?"True":"False");
        else corr="Doğru: "+String.fromCharCode(65+parseInt(want,10));
        fb.innerHTML=ok?"✓":"✗ "+esc(corr);
      }
      if(ok)correct++; rec(q.getAttribute("data-slug"), ok);
    });
    return {correct:correct,total:total};
  }

  function build(mount){
    var dataEl=mount.parentNode.querySelector(".ge-lisdata") || document.querySelector(".ge-lisdata");
    if(!dataEl) return; var cfg; try{ cfg=JSON.parse(dataEl.textContent); }catch(e){ return; }
    var slugBase=mount.getAttribute("data-slug-base")||"ge-lis";
    mount.classList.add("ge-lisw");
    var vsrc = cfg.video && cfg.video.provider==="ted" ? ("https://embed.ted.com/talks/"+cfg.video.ref)
             : cfg.video && cfg.video.provider==="youtube" ? ("https://www.youtube-nocookie.com/embed/"+cfg.video.ref)
             : (cfg.video && cfg.video.url) || "";
    var html='';
    html+='<p class="ge-linst" style="margin-bottom:.7rem">Bu videoyu <b>İKİ kez</b> izle. İlk izleyişte 1. görev grubunu, ikinci izleyişte 2. grubunu cevapla. (~'+(cfg.minutes||5)+' dakika.)</p>';
    html+='<div class="ge-lvideo"><iframe src="'+esc(vsrc)+'" allow="autoplay; fullscreen; encrypted-media" allowfullscreen title="Listening"></iframe></div>';
    if(cfg.source) html+='<p class="ge-lsrc">Kaynak: '+esc(cfg.source)+' · Sorular Gri English tarafından hazırlanmıştır.</p>';
    var base=1;
    (cfg.rounds||[]).forEach(function(round,ri){
      html+='<div class="ge-lround" id="'+slugBase+'-r'+ri+'"'+(ri>0?' style="display:none"':'')+'>';
      html+='<h3 style="margin:.2rem 0 .5rem">'+esc(round.label||((ri+1)+". Dinleme"))+'</h3>';
      (round.tasks||[]).forEach(function(task){ var fn=RENDER[task.type]; if(fn){ html+=fn(task, base, slugBase); base+=taskCount(task); } });
      html+='<div style="margin-top:.7rem;display:flex;gap:.6rem;flex-wrap:wrap">';
      html+='<button type="button" class="ge-lbtn ghost" data-check="'+ri+'">Cevapları kontrol et</button>';
      if(ri < (cfg.rounds.length-1)) html+='<button type="button" class="ge-lbtn" data-next="'+(ri+1)+'" style="display:none">Sonraki dinlemeye geç ›</button>';
      html+='</div><div class="ge-lscore" data-score="'+ri+'"></div></div>';
    });
    mount.innerHTML=html;

    mount.addEventListener("click",function(e){
      var opt=e.target.closest(".ge-lopt");
      if(opt){ var q=opt.closest(".ge-lq"); q.querySelectorAll(".ge-lopt").forEach(function(x){x.classList.remove("sel");}); opt.classList.add("sel"); q.setAttribute("data-sel",opt.getAttribute("data-o")); return; }
      var chk=e.target.closest("[data-check]");
      if(chk){ var ri=+chk.getAttribute("data-check"); var round=document.getElementById(slugBase+"-r"+ri);
        var res=scoreBox(round); round.querySelector('[data-score="'+ri+'"]').innerHTML='Skor: <b>'+res.correct+' / '+res.total+'</b>';
        var nb=round.querySelector("[data-next]"); if(nb) nb.style.display=""; return; }
      var nx=e.target.closest("[data-next]");
      if(nx){ var to=+nx.getAttribute("data-next"); var el=document.getElementById(slugBase+"-r"+to); if(el){ el.style.display=""; el.scrollIntoView({behavior:"smooth",block:"start"}); } }
    });
  }

  function boot(){ injectCSS(); document.querySelectorAll(".ge-lismount").forEach(build); }
  if(document.readyState!=="loading") boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
