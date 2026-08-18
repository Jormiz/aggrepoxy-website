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
  var hEls=['#h-h1','#h-sub','#h-form','#h-proof'];
  gsap.set([nav,...hEls].filter(Boolean),{opacity:0,y:16});
  var tl=gsap.timeline({delay:.05});
  tl.to(nav,{opacity:1,y:0,duration:.45,ease:'power3.out'})
    .to('#h-h1',{opacity:1,y:0,duration:.82,ease:'expo.out'},'-=.1')
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
  subject:'New estimate request: Aggrepoxy (Hero form)',
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
  subject:'New estimate request: Aggrepoxy (CTA form)',
  fields:[
    {id:'cqf-name',label:'Name'},{id:'cqf-phone',label:'Phone'},{id:'cqf-address',label:'Address'},
    {id:'cqf-email',label:'Email'},{id:'cqf-details',label:'Project details'},{id:'cqf-source',label:'Heard about us via'}
  ],
  submitSelector:'.ctaf-submit'
});

/* ─── TESTIMONIALS — floating card carousel ──────────────────── */
var testis=[
  {hl:'No Slipping, No Worries',body:"I was worried the floor would be slippery when my kids ran through the garage with wet feet. The anti-slip texture is barely visible but makes a huge difference. We've had zero issues, it's grippy even when wet.",author:'Sandra R., Pasadena, CA'},
  {hl:'Worth Every Penny',body:"I went in expecting sticker shock but the quote was fair and the results are incredible. No toxic smell during cure, they ventilated the garage properly and we were back in the next day. Best investment we've made in this house.",author:'Marcus T., Irvine, CA'},
  {hl:'Still Looks Brand New',body:"Two years in and our showroom floor still looks like it was installed yesterday. No yellowing, no peeling, no fading under the skylights. I've had three competitors ask who did our floors.",author:'Drew A., El Segundo, CA'}
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
if(window.AGX&&window.AGX.renderBeforeAfter){
  window.AGX.renderBeforeAfter('ba-grid',[
    {tag:'Decorative Flake',loc:'Residential garage, Los Angeles CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80'},
    {tag:'Polyaspartic',loc:'Commercial showroom, Irvine CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&auto=format&fit=crop&q=80'},
    {tag:'Metallic Finish',loc:'Restaurant floor, West Hollywood CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=900&auto=format&fit=crop&q=80'},
    {tag:'Industrial Coating',loc:'Distribution warehouse, Vernon CA',before:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80',after:'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=900&auto=format&fit=crop&q=80'}
  ]);
}

})();
