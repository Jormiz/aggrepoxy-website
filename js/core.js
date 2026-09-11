/* ================================================================
   AGGREPOXY — CORE.JS
   Shared on every page: Lenis smooth scroll, GSAP reveal system,
   nav scroll/mobile behavior, geo-redirect, mailto form helper.
================================================================ */
(function(){'use strict';

/* ─── LENIS ─────────────────────────────────────────────────── */
var lenis=null;
if(window.Lenis){
  lenis=new Lenis({duration:1.1,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t));},smoothWheel:true});
  (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0);
}
window.AGX_LENIS=lenis;

/* ─── GSAP ──────────────────────────────────────────────────── */
if(window.gsap&&window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);

/* ─── NAV SCROLL BEHAVIOR ───────────────────────────────────── */
var nav=document.getElementById('nav');
if(nav){
  function onScroll(scroll){nav.classList.toggle('scrolled',scroll>60);}
  if(lenis)lenis.on('scroll',function(e){onScroll(e.scroll);});
  else window.addEventListener('scroll',function(){onScroll(window.scrollY);});
}

/* ─── MOBILE NAV TOGGLE ─────────────────────────────────────── */
(function(){
  var burger=document.getElementById('nav-burger');
  var mobile=document.getElementById('nav-mobile');
  if(!burger||!mobile)return;
  function close(){mobile.classList.remove('open');document.body.style.overflow='';}
  burger.addEventListener('click',function(){
    var open=mobile.classList.toggle('open');
    document.body.style.overflow=open?'hidden':'';
  });
  mobile.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close);});
})();

/* ─── NAV DROPDOWN ARIA STATE ─────────────────────────────────
   Keeps aria-expanded in sync with the hover/focus-driven CSS
   dropdown so screen readers get an accurate state. ──────────── */
document.querySelectorAll('.nav-drop').forEach(function(drop){
  var trigger=drop.querySelector('.nav-drop-trigger');
  if(!trigger)return;
  function setOpen(open){trigger.setAttribute('aria-expanded',open?'true':'false');}
  drop.addEventListener('mouseenter',function(){setOpen(true);});
  drop.addEventListener('mouseleave',function(){setOpen(false);});
  trigger.addEventListener('focus',function(){setOpen(true);});
  drop.addEventListener('focusout',function(e){
    if(!drop.contains(e.relatedTarget))setOpen(false);
  });
  trigger.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      setOpen(trigger.getAttribute('aria-expanded')!=='true');
    }
    if(e.key==='Escape')setOpen(false);
  });
});

/* ─── FORM ACCESSIBILITY: placeholder → aria-label fallback ───
   Auto-labels any input/textarea that has a placeholder but no
   associated <label> or explicit aria-label, site-wide. ──────── */
document.querySelectorAll('input,textarea,select').forEach(function(el){
  if(el.getAttribute('aria-label'))return;
  if(el.id&&document.querySelector('label[for="'+el.id+'"]'))return;
  if(el.closest('label'))return;
  var fallback=el.getAttribute('placeholder')||el.name;
  if(fallback)el.setAttribute('aria-label',fallback);
});

/* ─── SMOOTH ANCHOR LINKS (same-page only) ──────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var id=a.getAttribute('href');
    if(!id||id==='#')return;
    var t=document.querySelector(id);
    if(!t)return;
    e.preventDefault();
    if(lenis)lenis.scrollTo(t,{offset:-68,duration:1.25});
    else t.scrollIntoView({behavior:'smooth'});
  });
});

/* ─── GENERIC SCROLL REVEALS (.rv class) ────────────────────── */
var rvObs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('on');rvObs.unobserve(e.target);}
  });
},{threshold:.05,rootMargin:'0px 0px -24px 0px'});
document.querySelectorAll('.rv').forEach(function(el){rvObs.observe(el);});

/* ─── TRUST STRIP REVEAL ─────────────────────────────────────── */
document.querySelectorAll('.trust-strip-inner').forEach(function(grid){
  var items=grid.querySelectorAll('.trust-item');
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){items.forEach(function(it){it.classList.add('on');});obs.unobserve(e.target);}
    });
  },{threshold:.15});
  obs.observe(grid);
});

/* ─── REVEAL SAFETY NET ───────────────────────────────────────
   Every scroll-reveal above (and the pain-pill/pillar-card/testi-
   card/counter reveals in home.js) works by having an
   IntersectionObserver add an `.on` class the first time an element
   crosses into view. That's efficient, but it's a single point of
   failure: if an observer never fires for a given element (a
   ScrollTrigger-driven layout recalculation shifting things after
   the observer was set up, a browser extension throttling
   observers, or any other edge case we can't fully test for), that
   element just stays invisible forever with no way to recover.
   This sweep is the belt-and-suspenders backstop — on load, on
   scroll, and on resize it checks every known reveal target still
   missing `.on` against its actual on-screen position and reveals
   it directly if it's already visible. Idempotent and cheap, so it
   costs nothing when the observers are working normally. ───────── */
(function(){
  var SEL='.rv,.pain-pill,.pillar-card,.testi-card,.trust-item,.stats-band .why-counter';
  function sweep(){
    document.querySelectorAll(SEL).forEach(function(el){
      if(el.classList.contains('on'))return;
      var r=el.getBoundingClientRect();
      if(r.bottom<=0||r.top>=window.innerHeight)return;
      el.classList.add('on');
      if(el.classList.contains('why-counter')){
        el.querySelectorAll('.count-num').forEach(function(c){
          if(c.dataset.swept)return;
          c.dataset.swept='1';
          var target=parseFloat(c.dataset.target);
          if(!isNaN(target))c.textContent=(c.dataset.prefix||'')+target+(c.dataset.suffix||'');
        });
      }
    });
  }
  var pending=null;
  function schedule(){if(pending)return;pending=requestAnimationFrame(function(){pending=null;sweep();});}
  window.addEventListener('load',function(){setTimeout(sweep,350);});
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  setTimeout(sweep,1200);
  setTimeout(sweep,3000);
})();

/* ─── FAQ ACCORDION ──────────────────────────────────────────── */
document.querySelectorAll('.faq-item').forEach(function(item){
  var q=item.querySelector('.faq-q');
  var a=item.querySelector('.faq-a');
  if(!q||!a)return;
  q.addEventListener('click',function(){
    var isOpen=item.classList.contains('open');
    item.closest('.faq-list').querySelectorAll('.faq-item.open').forEach(function(other){
      if(other!==item){other.classList.remove('open');other.querySelector('.faq-a').style.maxHeight=null;}
    });
    if(isOpen){item.classList.remove('open');a.style.maxHeight=null;}
    else{item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
  });
});

/* ─── GEO REDIRECT — retired ──────────────────────────────────
   Previously bounced Midwest visitors off to a separate aggrepoxy.com
   Chicago site. Now that Chicago has its own page on this same site
   (chi.html), routing visitors away no longer makes sense — leaving
   this stub so the intent is documented if it ever needs revisiting. */

/* ─── SHARED MAILTO FORM HELPER ──────────────────────────────── */
window.AGX=window.AGX||{};
window.AGX.wireForm=function(opts){
  var form=document.getElementById(opts.formId);
  if(!form)return;
  var requiredEls=(opts.requiredIds||[]).map(function(id){return document.getElementById(id);}).filter(Boolean);
  var agree=opts.agreeId?document.getElementById(opts.agreeId):null;
  requiredEls.forEach(function(f){f.addEventListener('input',function(){f.style.boxShadow='';});});

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var ok=true,firstBad=null;
    requiredEls.forEach(function(f){
      if(!f.value||!f.value.trim()){f.style.boxShadow='0 0 0 2px #cc3344';if(!firstBad)firstBad=f;ok=false;}
      else f.style.boxShadow='';
    });
    if(agree&&!agree.checked){ok=false;if(!firstBad)firstBad=agree;}
    if(!ok){if(firstBad)firstBad.focus();return;}

    var lines=(opts.fields||[]).map(function(f){
      var el=document.getElementById(f.id);
      var val=el?(el.value||'').trim():'';
      return val?(f.label+': '+val):null;
    }).filter(Boolean);
    var subject=opts.subject||'New estimate request: Aggrepoxy';
    var to=opts.to||'floors@aggrepoxy.com';
    var mailto='mailto:'+to+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n'));

    var btn=form.querySelector(opts.submitSelector||'button[type="submit"]');
    if(btn){btn.textContent='Opening your email…';btn.disabled=true;}
    window.location.href=mailto;

    setTimeout(function(){
      var target=document.getElementById(opts.successContainerId||opts.formId);
      if(target){
        target.innerHTML='<div class="q-success">'+
          '<div class="q-success-icon">&#10003;</div>'+
          '<h3>Almost there</h3>'+
          '<p>Your email app should be open with your details filled in. Just hit send. If nothing opened, email us directly at <a href="mailto:'+to+'" style="color:var(--cyan)">'+to+'</a>.</p>'+
          '</div>';
      }
    },500);
  });
};

/* ─── SHARED BEFORE/AFTER SLIDER RENDERER ─────────────────────
   Used on the homepage and on service pages. Pass the id of an
   empty .ba-grid container and an array of {tag,loc,before,after}. */
window.AGX.renderBeforeAfter=function(containerId,data){
  var gridEl=document.getElementById(containerId);
  if(!gridEl)return;
  data.forEach(function(d,idx){
    var uid=containerId+'-'+idx;
    var item=document.createElement('div');item.className='ba-item';
    item.innerHTML=
      '<div class="ba-slider-wrap" id="bas-'+uid+'">'+
        '<div class="ba-before" style="background-image:url(\''+d.before+'\')"></div>'+
        '<div class="ba-after" id="baa-'+uid+'" style="background-image:url(\''+d.after+'\')"></div>'+
        '<div class="ba-handle" id="bah-'+uid+'">'+
          '<div class="ba-handle-arrows"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="display:block"><path d="M6 10H14M6 10L9 7M6 10L9 13M14 10L11 7M14 10L11 13" stroke="#0C0C0C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
        '</div>'+
        '<div class="ba-labels"><span class="ba-lbl">Before</span><span class="ba-lbl after">After</span></div>'+
      '</div>'+
      '<div class="ba-meta"><span class="ba-meta-tag">'+d.tag+'</span><span class="ba-meta-loc">'+d.loc+'</span></div>';
    gridEl.appendChild(item);
    var drag=false,pos=0.5;
    var wrap=item.querySelector('.ba-slider-wrap');
    var afterEl=document.getElementById('baa-'+uid);
    var handleEl=document.getElementById('bah-'+uid);
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
};

})();
