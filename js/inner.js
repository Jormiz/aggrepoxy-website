/* ================================================================
   AGGREPOXY — INNER.JS
   Interactions for service pages. Load after core.js.
================================================================ */

/* ─── IMAGE SLIDESHOW (.svc-slideshow) ───────────────────────── */
document.querySelectorAll('.svc-slideshow').forEach(function(show){
  var slides=show.querySelectorAll('.svc-slide');
  if(slides.length<2)return;
  var dotsWrap=show.querySelector('.svc-slideshow-dots');
  var idx=0,timer=null,DELAY=5000,dots=[];
  slides.forEach(function(s,i){
    if(s.classList.contains('on'))idx=i;
    if(!dotsWrap)return;
    var d=document.createElement('button');
    d.type='button';d.className='svc-slideshow-dot';d.setAttribute('aria-label','Go to slide '+(i+1));
    d.addEventListener('click',function(){go(i);restart();});
    dotsWrap.appendChild(d);dots.push(d);
  });
  function go(i){
    idx=(i+slides.length)%slides.length;
    slides.forEach(function(s,j){s.classList.toggle('on',j===idx);});
    dots.forEach(function(d,j){d.classList.toggle('on',j===idx);});
  }
  function restart(){clearInterval(timer);timer=setInterval(function(){go(idx+1);},DELAY);}
  var prev=show.querySelector('.svc-slideshow-btn.prev'),next=show.querySelector('.svc-slideshow-btn.next');
  if(prev)prev.addEventListener('click',function(){go(idx-1);restart();});
  if(next)next.addEventListener('click',function(){go(idx+1);restart();});
  show.addEventListener('mouseenter',function(){clearInterval(timer);});
  show.addEventListener('mouseleave',restart);
  var sx=null;
  show.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
  show.addEventListener('touchend',function(e){
    if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;
    if(Math.abs(dx)>40){go(dx<0?idx+1:idx-1);restart();}
  });
  go(idx);restart();
});

/* ─── LAYER STACK (.agx-stack) ───────────────────────────────── */
document.querySelectorAll('.agx-stack').forEach(function(stack){
  var layers=stack.querySelectorAll('.agx-layer');
  layers.forEach(function(l){
    l.setAttribute('role','button');l.setAttribute('tabindex','0');
    function activate(){layers.forEach(function(o){o.classList.toggle('active',o===l);});}
    l.addEventListener('click',activate);
    l.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
  });
});

/* ─── AGX PRECISION SYSTEM accordion (mirrors home.js) ───────── */
(function(){
  var list=document.getElementById('precision-list');
  if(!list||document.getElementById('hero'))return; /* homepage handles its own */
  var items=Array.prototype.slice.call(list.querySelectorAll('.precision-item'));
  var layers=document.querySelectorAll('.precision-layer');
  function closeAll(){
    items.forEach(function(it){
      it.classList.remove('active');
      it.querySelector('.precision-item-head').setAttribute('aria-expanded','false');
      it.querySelector('.precision-item-body').style.maxHeight=null;
    });
    layers.forEach(function(l){l.classList.remove('active');});
  }
  function open(i){
    closeAll();var it=items[i];it.classList.add('active');
    it.querySelector('.precision-item-head').setAttribute('aria-expanded','true');
    var b=it.querySelector('.precision-item-body');b.style.maxHeight=b.scrollHeight+'px';
    layers.forEach(function(l){l.classList.toggle('active',l.dataset.layer===it.dataset.layer);});
  }
  items.forEach(function(it,i){
    it.querySelector('.precision-item-head').addEventListener('click',function(){it.classList.contains('active')?closeAll():open(i);});
  });
  var visual=document.getElementById('precision-visual');
  if(visual){
    var order=['3','2','1','0'];
    visual.addEventListener('click',function(e){
      var r=visual.getBoundingClientRect();
      var band=Math.min(3,Math.max(0,Math.floor((e.clientY-r.top)/r.height*4)));
      var idx=items.findIndex(function(it){return it.dataset.layer===order[band];});
      if(idx<0)return;items[idx].classList.contains('active')?closeAll():open(idx);
    });
  }
  window.addEventListener('resize',function(){
    var b=list.querySelector('.precision-item.active .precision-item-body');
    if(b)b.style.maxHeight=b.scrollHeight+'px';
  });
})();

/* ─── TESTIMONIAL CAROUSEL (data from window.AGX_TESTIS) ─────── */
(function(){
  var card=document.getElementById('testi-card'),data=window.AGX_TESTIS;
  if(!card||!data||!data.length||document.getElementById('hero'))return;
  var hl=document.getElementById('testi-headline'),bd=document.getElementById('testi-body'),au=document.getElementById('testi-author'),dotsEl=document.getElementById('testi-dots'),idx=0;
  data.forEach(function(_,i){
    var d=document.createElement('div');d.className='testi-dot';
    d.addEventListener('click',function(){set(i);});dotsEl.appendChild(d);
  });
  function set(i){
    idx=i;card.style.opacity='0';card.style.transform='translateX(-8px)';
    setTimeout(function(){
      hl.textContent=data[i].hl;bd.textContent=data[i].body;au.textContent=data[i].author;
      dotsEl.querySelectorAll('.testi-dot').forEach(function(d,j){d.classList.toggle('on',j===i);});
      card.style.opacity='1';card.style.transform='none';
    },220);
  }
  card.style.transition='opacity .3s ease,transform .3s ease';
  set(0);
  var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){card.classList.add('on');obs.unobserve(card);}});},{threshold:.12});
  obs.observe(card);
  document.getElementById('testi-prev').addEventListener('click',function(){set((idx-1+data.length)%data.length);});
  document.getElementById('testi-next').addEventListener('click',function(){set((idx+1)%data.length);});
})();
