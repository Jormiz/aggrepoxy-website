/* ================================================================
   AGGREPOXY — INNER.JS
   Gallery masonry + lightbox, and the 2-step Contact quote form.
   Requires core.js to run first. Every block guards on element
   existence so this file is safe to include on every inner page.
================================================================ */
(function(){'use strict';

/* ─── GALLERY LIGHTBOX ───────────────────────────────────────── */
(function(){
  var items=Array.prototype.slice.call(document.querySelectorAll('.masonry-item'));
  if(!items.length)return;
  var lb=document.getElementById('lightbox');
  if(!lb)return;
  var img=lb.querySelector('img');
  var idx=0;

  function open(i){
    idx=(i+items.length)%items.length;
    var full=items[idx].getAttribute('data-full')||items[idx].querySelector('img').src;
    img.src=full;
    img.alt=items[idx].querySelector('img').alt||'';
    lb.classList.add('open');
    document.body.style.overflow='hidden';
  }
  function close(){lb.classList.remove('open');document.body.style.overflow='';}

  items.forEach(function(el,i){
    el.addEventListener('click',function(e){e.preventDefault();open(i);});
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){e.preventDefault();open(i);}
    });
  });
  var closeBtn=lb.querySelector('.lightbox-close');
  if(closeBtn)closeBtn.addEventListener('click',close);
  var prevBtn=lb.querySelector('.lightbox-nav.prev');
  var nextBtn=lb.querySelector('.lightbox-nav.next');
  if(prevBtn)prevBtn.addEventListener('click',function(){open(idx-1);});
  if(nextBtn)nextBtn.addEventListener('click',function(){open(idx+1);});
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close();
    if(e.key==='ArrowLeft')open(idx-1);
    if(e.key==='ArrowRight')open(idx+1);
  });
})();

/* ─── SERVICE PAGE SLIDESHOW ─────────────────────────────────── */
document.querySelectorAll('.svc-slideshow').forEach(function(sh){
  var slides=Array.prototype.slice.call(sh.querySelectorAll('.svc-slide'));
  var dotsWrap=sh.querySelector('.svc-slideshow-dots');
  if(!slides.length||!dotsWrap)return;
  var idx=0,timer=null;
  var dots=slides.map(function(_,i){
    var d=document.createElement('button');
    d.type='button';d.className='svc-slideshow-dot'+(i===0?' on':'');
    d.setAttribute('aria-label','Go to slide '+(i+1));
    d.addEventListener('click',function(){show(i);reset();});
    dotsWrap.appendChild(d);
    return d;
  });
  function show(i){
    idx=(i+slides.length)%slides.length;
    slides.forEach(function(s,si){s.classList.toggle('on',si===idx);});
    dots.forEach(function(d,di){d.classList.toggle('on',di===idx);});
  }
  function reset(){if(timer)clearInterval(timer);timer=setInterval(function(){show(idx+1);},4800);}
  var prevBtn=sh.querySelector('.svc-slideshow-btn.prev');
  var nextBtn=sh.querySelector('.svc-slideshow-btn.next');
  if(prevBtn)prevBtn.addEventListener('click',function(){show(idx-1);reset();});
  if(nextBtn)nextBtn.addEventListener('click',function(){show(idx+1);reset();});
  show(0);
  reset();
});

/* ─── CONTACT 2-STEP QUOTER ──────────────────────────────────── */
(function(){
  var wrap=document.getElementById('quoter-form');
  if(!wrap)return;

  var state={space:'',sqft:'',timeline:''};
  var step1=document.getElementById('q-step-1');
  var step2=document.getElementById('q-step-2');
  var stepWrap=document.getElementById('q-step-wrap');
  var dots=document.querySelectorAll('.q-dot');
  var nextBtn=document.getElementById('q-next');

  function resizeWrap(){
    var active=step2.classList.contains('in')?step2:step1;
    if(stepWrap)stepWrap.style.height=active.offsetHeight+'px';
  }

  function selectPill(group,btns,key){
    btns.forEach(function(b){
      b.addEventListener('click',function(){
        btns.forEach(function(x){x.classList.remove('sel');});
        b.classList.add('sel');
        state[key]=b.dataset.val;
        checkNext();
      });
    });
  }
  selectPill('space',document.querySelectorAll('#q-space-pills .q-pill-btn'),'space');
  selectPill('sqft',document.querySelectorAll('#q-sqft-range .q-range-btn'),'sqft');
  selectPill('timeline',document.querySelectorAll('#q-timeline .q-timeline-btn'),'timeline');

  function checkNext(){
    if(nextBtn)nextBtn.disabled=!(state.space&&state.sqft&&state.timeline);
  }
  checkNext();

  if(nextBtn){
    nextBtn.addEventListener('click',function(){
      if(nextBtn.disabled)return;
      step1.classList.add('out');step1.classList.remove('in');
      step2.classList.remove('out');step2.classList.add('in');
      dots.forEach(function(d,i){d.classList.toggle('on',i===1);});
      setTimeout(resizeWrap,10);
    });
  }
  var backBtn=document.getElementById('q-back');
  if(backBtn){
    backBtn.addEventListener('click',function(){
      step2.classList.add('out');step2.classList.remove('in');
      step1.classList.remove('out');step1.classList.add('in');
      dots.forEach(function(d,i){d.classList.toggle('on',i===0);});
      setTimeout(resizeWrap,10);
    });
  }
  window.addEventListener('load',resizeWrap);
  setTimeout(resizeWrap,50);

  var form=document.getElementById('quote-form');
  if(form){
    var requiredEls=['qf-name','qf-phone','qf-email'].map(function(id){return document.getElementById(id);});
    var agree=document.getElementById('qf-agree');
    requiredEls.forEach(function(f){if(f)f.addEventListener('input',function(){f.style.borderColor='';});});

    form.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=true,firstBad=null;
      requiredEls.forEach(function(f){
        if(!f.value.trim()){f.style.borderColor='#cc3344';if(!firstBad)firstBad=f;ok=false;}
        else f.style.borderColor='';
      });
      if(agree&&!agree.checked){ok=false;if(!firstBad)firstBad=agree;}
      if(!ok){if(firstBad)firstBad.focus();return;}

      var lines=[
        'Space type: '+(state.space||'N/A'),
        'Approx. square footage: '+(state.sqft||'N/A'),
        'Timeline: '+(state.timeline||'N/A'),
        'Name: '+document.getElementById('qf-name').value.trim(),
        'Phone: '+document.getElementById('qf-phone').value.trim(),
        'Email: '+document.getElementById('qf-email').value.trim(),
        'Address: '+(document.getElementById('qf-address').value||'').trim(),
        'Project details: '+(document.getElementById('qf-details').value||'').trim()
      ];
      var to='floors@aggrepoxy.com';
      var mailto='mailto:'+to+'?subject='+encodeURIComponent('New estimate request: Aggrepoxy')+'&body='+encodeURIComponent(lines.join('\n'));
      var btn=form.querySelector('.q-submit');
      if(btn){btn.textContent='Opening your email…';btn.disabled=true;}
      window.location.href=mailto;
      setTimeout(function(){
        wrap.innerHTML='<div class="q-success">'+
          '<div class="q-success-icon">&#10003;</div>'+
          '<h3>Almost there</h3>'+
          '<p>Your email app should be open with your details filled in, just hit send. If nothing opened, email us directly at <a href="mailto:'+to+'" style="color:var(--cyan)">'+to+'</a>.</p>'+
          '</div>';
      },500);
    });
  }
})();

})();
