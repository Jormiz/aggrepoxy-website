/* ================================================================
   AGGREPOXY — HOME.JS
   Homepage-only interactivity: hero entrance, parallax, space
   selector, testimonials, before/after slider, stat counters,
   pillar reveal, and the two on-page quote forms.
   Requires core.js (Lenis/GSAP already initialized) to run first.
================================================================ */
(function(){'use strict';
/* NOTE: gsap is a nice-to-have for entrance/parallax polish, but every
   DOM-population block below (counters, coat tabs, testimonials,
   before/after, forms) must run whether or not the GSAP CDN loaded —
   a blocked/slow CDN should never take down the actual page content. */

var nav=document.getElementById('nav');

if(window.gsap){
  /* ─── HERO ENTRANCE ───────────────────────────────────────── */
  var hEls=['#h-eyebrow','#h-h1','#h-sub','#h-form','#h-proof'];
  gsap.set([nav,...hEls].filter(Boolean),{opacity:0,y:16});
  var tl=gsap.timeline({delay:.05});
  tl.to(nav,{opacity:1,y:0,duration:.45,ease:'power3.out'})
    .to('#h-eyebrow',{opacity:1,y:0,duration:.5,ease:'power3.out'},'-=.1')
    .to('#h-h1',{opacity:1,y:0,duration:.82,ease:'expo.out'},'-=.32')
    .to('#h-sub',{opacity:1,y:0,duration:.58,ease:'power3.out'},'-=.5')
    .to('#h-form',{opacity:1,y:0,duration:.5,ease:'power3.out'},'-=.4')
    .to('#h-proof',{opacity:1,y:0,duration:.48,ease:'power3.out'},'-=.34');

  /* ─── HERO PARALLAX ───────────────────────────────────────── */
  if(window.ScrollTrigger){
    gsap.to('.hero-bg',{yPercent:13,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('#pain-bg',{yPercent:22,ease:'none',scrollTrigger:{trigger:'.pain-section',start:'top bottom',end:'bottom top',scrub:true}});
  }
}

/* ─── PAIN COLUMNS STAGGER ───────────────────────────────────── */
var painObs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');painObs.unobserve(e.target);}});
},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('[data-pain]').forEach(function(el){painObs.observe(el);});

/* ─── ANIMATED COUNTERS ──────────────────────────────────────── */
(function(){
  function easeOut(t){return 1-Math.pow(1-t,3);}
  function animateCounter(el){
    var target=parseFloat(el.dataset.target);
    var suffix=el.dataset.suffix||'';
    var prefix=el.dataset.prefix||'';
    var duration=1400,start=performance.now();
    function tick(now){
      var elapsed=Math.min(now-start,duration);
      var progress=easeOut(elapsed/duration);
      var current=Math.round(progress*target);
      el.textContent=prefix+current+suffix;
      if(elapsed<duration)requestAnimationFrame(tick);
      else el.textContent=prefix+target+suffix;
    }
    requestAnimationFrame(tick);
  }
  var counterObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      e.target.querySelectorAll('.why-counter').forEach(function(c){c.classList.add('on');});
      e.target.querySelectorAll('.count-num').forEach(function(el,i){setTimeout(function(){animateCounter(el);},i*110+80);});
      counterObs.unobserve(e.target);
    });
  },{threshold:.2});
  var countersEl=document.getElementById('why-counters');
  if(countersEl)counterObs.observe(countersEl);
})();

/* ─── PRECISION SYSTEM PILLARS — reveal + hover ─────────────── */
var pillarGrid=document.getElementById('pillar-grid');
if(pillarGrid){
  var pillarObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){document.querySelectorAll('[data-pillar]').forEach(function(item){item.classList.add('on');});pillarObs.unobserve(e.target);}
    });
  },{threshold:.1,rootMargin:'0px 0px -30px 0px'});
  pillarObs.observe(pillarGrid);
}
if(window.gsap){
  document.querySelectorAll('[data-pillar]').forEach(function(item){
    item.addEventListener('mouseenter',function(){gsap.to(item.querySelector('.pillar-icon'),{scale:1.08,duration:.22,ease:'power2.out'});});
    item.addEventListener('mouseleave',function(){gsap.to(item.querySelector('.pillar-icon'),{scale:1,duration:.3,ease:'power2.out'});});
  });
}

/* ─── HOME FORMS — real mailto submission ────────────────────── */
window.AGX.wireForm({
  formId:'hero-estimate-form',
  requiredIds:['he-name','he-phone','he-email'],
  agreeId:'he-agree',
  successContainerId:'h-form',
  subject:'New estimate request — Aggrepoxy (Hero form)',
  fields:[
    {id:'he-name',label:'Name'},{id:'he-phone',label:'Phone'},{id:'he-address',label:'Address'},
    {id:'he-email',label:'Email'},{id:'he-details',label:'Project details'},{id:'he-source',label:'Heard about us via'}
  ],
  submitSelector:'.hc-submit'
});
window.AGX.wireForm({
  formId:'cta-quote-form',
  requiredIds:['cqf-name','cqf-phone','cqf-email'],
  agreeId:'cqf-agree',
  successContainerId:'cta-quote-panel',
  subject:'New estimate request — Aggrepoxy (CTA form)',
  fields:[
    {id:'cqf-name',label:'Name'},{id:'cqf-phone',label:'Phone'},{id:'cqf-address',label:'Address'},
    {id:'cqf-email',label:'Email'},{id:'cqf-details',label:'Project details'},{id:'cqf-source',label:'Heard about us via'}
  ],
  submitSelector:'.ctaf-submit'
});

/* ─── WHAT WE COAT — space selector ───────────────────────────── */
var spaceData=[
  {space:'Garage',name:'Decorative Flake System',headline:'The garage floor everyone stops to look at.',
   href:'services/decorative-flake.html',
   imgs:['images/Lambo-Volt-scaled.jpg','https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80'],
   popular:false,icon:'<path d="M3 21V10l9-6 9 6v11"/><path d="M3 21h18"/><path d="M8 21v-6h8v6"/>',
   bullets:['Popular heavy-duty system for garages','Slip-resistant texture built in','UV-stable, will not yellow']},
  {space:'Pool &amp; Patio',name:'Quartz Systems',headline:'Grip that holds up, even soaking wet.',
   href:'services/quartz-systems.html',
   imgs:['images/section-05.jpg','https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200&auto=format&fit=crop&q=80'],
   popular:false,icon:'<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
   bullets:['Maximum traction even when wet','Ideal for pool decks, patios, and kitchens','Chemical-resistant formulation']},
  {space:'Showroom',name:'Metallic Finish',headline:'Floors that sell the room before you do.',
   href:'services/metallic-finish.html',
   imgs:['images/section-04.jpg','https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80'],
   popular:true,icon:'<path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/>',
   bullets:['3D marbled finish that showcases your space','Unlimited custom color combinations','High gloss surface that wipes clean']},
  {space:'Warehouse',name:'Industrial Coatings',headline:'Built for forklifts. Not just foot traffic.',
   href:'services/industrial-coatings.html',
   imgs:['images/section-01.jpg','https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=1200&auto=format&fit=crop&q=80'],
   popular:false,icon:'<path d="M3 9l9-5 9 5v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"/><path d="M9 21V12h6v9"/>',
   bullets:['Forklifts, pallet jacks, and heavy equipment','Chemical and thermal shock resistant','OSHA slip-resistance requirements']},
  {space:'Retail &amp; Commercial',name:'Solid Color Epoxy',headline:'One consistent floor, wall to wall.',
   href:'services/solid-color-epoxy.html',
   imgs:['images/garage-flake.jpg','https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80'],
   popular:false,icon:'<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
   bullets:['Uniform look for showrooms and retail','Dozens of standard and custom colors','Easy mopping and maintenance']}
];

var coatTabsEl=document.getElementById('coat-tabs');
var coatPanelEl=document.getElementById('coat-panel');
var coatImgBgEl=document.getElementById('coat-panel-img-bg');
var coatBadgeEl=document.getElementById('coat-panel-badge-el');
var coatCatIdx=0,coatImgIdx=0;

if(coatTabsEl&&coatPanelEl){
  spaceData.forEach(function(s,i){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='coat-tab'+(i===0?' active':'');
    btn.innerHTML='<svg viewBox="0 0 24 24">'+s.icon+'</svg>'+s.space+(s.popular?'<span class="coat-tab-dot"></span>':'');
    btn.addEventListener('click',function(){setSpace(i);});
    coatTabsEl.appendChild(btn);
  });

  function renderImg(){
    coatImgBgEl.style.opacity='0';
    setTimeout(function(){
      coatImgBgEl.style.backgroundImage="url('"+spaceData[coatCatIdx].imgs[coatImgIdx]+"')";
      coatImgBgEl.style.opacity='1';
    },220);
  }

  function renderLink(){
    var linkWrap=document.getElementById('coat-panel-cta-row');
    if(!linkWrap)return;
    linkWrap.querySelector('.coat-panel-viewmore').setAttribute('href',spaceData[coatCatIdx].href);
  }

  function setSpace(i){
    if(i===coatCatIdx)return;
    coatCatIdx=i;coatImgIdx=0;
    var s=spaceData[i];
    document.querySelectorAll('.coat-tab').forEach(function(t,j){t.classList.toggle('active',j===i);});
    coatBadgeEl.style.display=s.popular?'block':'none';
    renderImg();
    coatPanelEl.classList.add('fade-body','out');
    setTimeout(function(){
      document.getElementById('coat-panel-headline').textContent=s.name;
      document.getElementById('coat-panel-name').textContent=s.headline;
      document.getElementById('coat-panel-bullets').innerHTML=s.bullets.map(function(b){return '<li>'+b+'</li>';}).join('');
      renderLink();
      coatPanelEl.classList.remove('out');
    },260);
  }

  var prevBtn=document.getElementById('coat-img-prev'),nextBtn=document.getElementById('coat-img-next');
  if(prevBtn)prevBtn.addEventListener('click',function(){var imgs=spaceData[coatCatIdx].imgs;coatImgIdx=(coatImgIdx-1+imgs.length)%imgs.length;renderImg();});
  if(nextBtn)nextBtn.addEventListener('click',function(){var imgs=spaceData[coatCatIdx].imgs;coatImgIdx=(coatImgIdx+1)%imgs.length;renderImg();});

  coatImgBgEl.style.backgroundImage="url('"+spaceData[0].imgs[0]+"')";
  document.getElementById('coat-panel-headline').textContent=spaceData[0].name;
  document.getElementById('coat-panel-name').textContent=spaceData[0].headline;
  document.getElementById('coat-panel-bullets').innerHTML=spaceData[0].bullets.map(function(b){return '<li>'+b+'</li>';}).join('');
  coatBadgeEl.style.display=spaceData[0].popular?'block':'none';
  renderLink();
}

/* ─── TESTIMONIALS — floating card carousel ──────────────────── */
var testis=[
  {hl:'No Slipping, No Worries',body:"I was worried the floor would be slippery when my kids ran through the garage with wet feet. The anti-slip texture is barely visible but makes a huge difference. We've had zero issues, it's grippy even when wet.",author:'Sandra R. — Pasadena, CA'},
  {hl:'Worth Every Penny',body:"I went in expecting sticker shock but the quote was fair and the results are incredible. No toxic smell during cure, they ventilated the garage properly and we were back in the next day. Best investment we've made in this house.",author:'Marcus T. — Irvine, CA'},
  {hl:'Still Looks Brand New',body:"Two years in and our showroom floor still looks like it was installed yesterday. No yellowing, no peeling, no fading under the skylights. I've had three competitors ask who did our floors.",author:'Drew A. — El Segundo, CA'}
];
var tIdx=0;
var tCard=document.getElementById('testi-card');
if(tCard){
  var tHeadEl=document.getElementById('testi-headline'),tBodyEl=document.getElementById('testi-body'),tAuthEl=document.getElementById('testi-author'),tDotsEl=document.getElementById('testi-dots');
  testis.forEach(function(_,i){
    var dot=document.createElement('div');
    dot.className='testi-dot'+(i===0?' on':'');
    dot.addEventListener('click',function(){setTesti(i);});
    tDotsEl.appendChild(dot);
  });
  function setTesti(i){
    tIdx=i;
    tCard.style.opacity='0';tCard.style.transform='translateX(-8px)';
    setTimeout(function(){
      tHeadEl.textContent=testis[i].hl;tBodyEl.textContent=testis[i].body;tAuthEl.textContent=testis[i].author;
      document.querySelectorAll('.testi-dot').forEach(function(d,j){d.classList.toggle('on',j===i);});
      tCard.style.opacity='1';tCard.style.transform='none';
    },220);
  }
  tCard.style.transition='opacity .3s ease,transform .3s ease';
  setTesti(0);
  var testiObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');testiObs.unobserve(e.target);}});
  },{threshold:.12});
  testiObs.observe(tCard);
  document.getElementById('testi-prev').addEventListener('click',function(){setTesti((tIdx-1+testis.length)%testis.length);});
  document.getElementById('testi-next').addEventListener('click',function(){setTesti((tIdx+1)%testis.length);});
}

/* ─── BEFORE / AFTER ─────────────────────────────────────────── */
var baData=[
  {tag:'Decorative Flake',loc:'Residential garage, Los Angeles CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80'},
  {tag:'Polyaspartic',loc:'Commercial showroom, Irvine CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&auto=format&fit=crop&q=80'},
  {tag:'Metallic Finish',loc:'Restaurant floor, West Hollywood CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=900&auto=format&fit=crop&q=80'},
  {tag:'Industrial Coating',loc:'Distribution warehouse, Vernon CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=900&auto=format&fit=crop&q=80'}
];
var baGridEl=document.getElementById('ba-grid');
if(baGridEl){
  baData.forEach(function(d,idx){
    var item=document.createElement('div');item.className='ba-item';
    item.innerHTML=
      '<div class="ba-slider-wrap" id="bas-'+idx+'">'+
        '<div class="ba-before" style="background-image:url(\''+d.before+'\')"></div>'+
        '<div class="ba-after" id="baa-'+idx+'" style="background-image:url(\''+d.after+'\')"></div>'+
        '<div class="ba-handle" id="bah-'+idx+'">'+
          '<div class="ba-handle-arrows"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="display:block"><path d="M6 10H14M6 10L9 7M6 10L9 13M14 10L11 7M14 10L11 13" stroke="#0C0C0C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
        '</div>'+
        '<div class="ba-labels"><span class="ba-lbl">Before</span><span class="ba-lbl after">After</span></div>'+
      '</div>'+
      '<div class="ba-meta"><span class="ba-meta-tag">'+d.tag+'</span><span class="ba-meta-loc">'+d.loc+'</span></div>';
    baGridEl.appendChild(item);
    var drag=false,pos=0.5;
    var wrap=item.querySelector('.ba-slider-wrap');
    var afterEl=document.getElementById('baa-'+idx);
    var handleEl=document.getElementById('bah-'+idx);
    function setPos(p){
      pos=Math.max(.02,Math.min(.98,p));
      afterEl.style.clipPath='inset(0 '+((1-pos)*100).toFixed(1)+'% 0 0)';
      handleEl.style.left=(pos*100).toFixed(1)+'%';
    }
    function gx(e){return e.touches?e.touches[0].clientX:e.clientX;}
    function mv(e){if(!drag)return;var r=wrap.getBoundingClientRect();setPos((gx(e)-r.left)/r.width);}
    wrap.addEventListener('mousedown',function(e){drag=true;mv(e);});
    wrap.addEventListener('touchstart',function(e){drag=true;mv(e);},{passive:true});
    window.addEventListener('mousemove',mv);
    window.addEventListener('touchmove',mv,{passive:true});
    window.addEventListener('mouseup',function(){drag=false;});
    window.addEventListener('touchend',function(){drag=false;});
    setPos(0.5);
  });
}

})();
