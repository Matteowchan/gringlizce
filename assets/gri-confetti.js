/* gri-confetti.js — hafif canvas konfeti (kütüphanesiz). GriConfetti.burst(opts) */
(function(){
  if(window.GriConfetti)return;
  var COLORS=['#C79A3A','#2E6E4E','#2E6E6A','#e6a92e','#c0563a','#4c9f70','#d8a838','#8a5cff','#e86a92'];
  function reduce(){ try{ return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }

  function burst(opts){
    opts=opts||{};
    if(reduce())return;
    var N=opts.count||140;
    var cv=document.createElement('canvas');
    cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(cv);
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var W=cv.width=Math.floor(window.innerWidth*dpr), H=cv.height=Math.floor(window.innerHeight*dpr);
    var ctx=cv.getContext('2d');
    var ox=(opts.x!=null?opts.x:window.innerWidth/2)*dpr, oy=(opts.y!=null?opts.y:window.innerHeight*0.32)*dpr;
    var parts=[];
    for(var i=0;i<N;i++){
      var ang=(Math.PI*2)*(i/N)+ (Math.random()-0.5);
      var sp=(4+Math.random()*9)*dpr;
      parts.push({
        x:ox,y:oy,
        vx:Math.cos(ang)*sp*(0.6+Math.random()*0.9),
        vy:Math.sin(ang)*sp - (6+Math.random()*7)*dpr,
        g:(0.28+Math.random()*0.22)*dpr,
        w:(6+Math.random()*7)*dpr, h:(9+Math.random()*9)*dpr,
        rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.5,
        col:COLORS[(Math.random()*COLORS.length)|0], life:0, max:70+Math.random()*40,
        shape:Math.random()<0.35?'c':'r'
      });
    }
    var raf, t0=null;
    function tick(ts){
      if(t0==null)t0=ts;
      ctx.clearRect(0,0,W,H);
      var alive=0;
      for(var i=0;i<parts.length;i++){ var p=parts[i];
        p.life++; if(p.life>p.max)continue; alive++;
        p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.vx*=0.99;
        var a=1-(p.life/p.max);
        ctx.save(); ctx.globalAlpha=Math.max(0,a); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col;
        if(p.shape==='c'){ ctx.beginPath(); ctx.arc(0,0,p.w*0.5,0,Math.PI*2); ctx.fill(); }
        else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        ctx.restore();
      }
      if(alive>0){ raf=requestAnimationFrame(tick); }
      else { if(cv.parentNode)cv.parentNode.removeChild(cv); }
    }
    raf=requestAnimationFrame(tick);
    setTimeout(function(){ try{cancelAnimationFrame(raf);}catch(e){} if(cv.parentNode)cv.parentNode.removeChild(cv); },3000);
  }
  window.GriConfetti={ burst:burst };
})();
