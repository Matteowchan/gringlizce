/* Gri flair — hub kartlarina zarif giris animasyonu */
(function(){
  function reveal(){
    var cards=document.querySelectorAll('.qb-hub-card,.mod-card,.skill-card');
    if(!cards.length) return;
    if(!('IntersectionObserver' in window)){cards.forEach(function(c){c.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08});
    cards.forEach(function(c,i){c.classList.add('gri-reveal');c.style.transitionDelay=(Math.min(i,6)*45)+'ms';io.observe(c);});
    setTimeout(function(){cards.forEach(function(c){c.classList.add('in');});},1600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reveal);else reveal();
})();
