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

/* ─── GEO REDIRECT — Midwest visitors to aggrepoxy.com ──────────
   Fails open on any error / API block. Bypass with ?local=1.
   Decision cached in sessionStorage so it only checks once per visit. */
(function(){
  try{
    var params=new URLSearchParams(location.search);
    if(params.has('local')||params.has('stay')){sessionStorage.setItem('agx_geo','stay');return;}
    if(/^(localhost|127\.0\.0\.1|.*\.local)$/.test(location.hostname))return;

    var cached=sessionStorage.getItem('agx_geo');
    if(cached==='redirect'){redirect();return;}
    if(cached==='stay')return;

    var MIDWEST=['IL','IN','IA','KS','MI','MN','MO','NE','ND','OH','SD','WI'];
    fetch('https://ipwho.is/',{mode:'cors'})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d&&d.success!==false&&d.country_code==='US'&&MIDWEST.indexOf(d.region_code)>-1){
          sessionStorage.setItem('agx_geo','redirect');
          redirect();
        }else{
          sessionStorage.setItem('agx_geo','stay');
        }
      })
      .catch(function(){/* fail open */});

    function redirect(){
      var veil=document.createElement('div');
      veil.className='geo-veil';
      veil.innerHTML='<div class="geo-veil-inner"><div class="geo-spin"></div><p>Taking you to our Chicago shop&hellip;</p></div>';
      document.body.appendChild(veil);
      requestAnimationFrame(function(){veil.classList.add('show');});
      setTimeout(function(){window.location.href='https://aggrepoxy.com/';},850);
    }
  }catch(e){/* fail open */}
})();

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
    var subject=opts.subject||'New estimate request — Aggrepoxy';
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
          '<p>Your email app should be open with your details filled in — just hit send. If nothing opened, email us directly at <a href="mailto:'+to+'" style="color:var(--cyan)">'+to+'</a>.</p>'+
          '</div>';
      }
    },500);
  });
};

})();
