/* ================================================================
   AGGREPOXY — CORE.JS
   Shared on every page: Lenis smooth scroll, GSAP reveal system,
   nav scroll/mobile behavior, geo-redirect, mailto form helper.
================================================================ */

/* ─── LEAD HANDOFF: 2-STEP (email + DripJobs booking) ─────────
   Step 1: the short form on the site emails the lead to us instantly
           through Web3Forms (free, no Zapier). Even if the visitor
           stops here, we have their name, phone, email, and ZIP.
   Step 2: the thank-you screen opens the DripJobs booking form in a
           pop-up so they can pick an estimate time. Submitting that
           creates the lead in DripJobs and fires the drips.

   SETUP: get a free access key at web3forms.com (enter the inbox the
   leads should go to) and paste it below. It's a public key, safe to
   live in this file. Until it's pasted in, step 1 is skipped and the
   visitor goes straight to the booking form, so nothing is lost.

   A form can opt out of step 2 with {booking:false} (used on the
   Chicago page, which isn't on the SoCal DripJobs account) or send
   to a different inbox with {web3Key:'...'}.
================================================================ */
window.AGX_CONFIG=window.AGX_CONFIG||{};
window.AGX_CONFIG.web3formsKey='d7204806-7e49-4e3a-9557-da909674a3ca';
window.AGX_CONFIG.bookingUrl='https://aggrepoxy.dripjobs.com?f=agx';
window.AGX_CONFIG.cloudinary={cloudName:'g7z6n9ug',uploadPreset:'aggrepoxy_lead_form'};

/* ─── ANALYTICS HELPER ──────────────────────────────────────────
   One call sends a conversion event to Google Analytics (and to
   Microsoft Clarity once it is installed). Never sends form contents
   or personal info, only the event name and which form/page. */
window.agxTrack=function(name,params){
  try{
    if(typeof window.gtag==='function')window.gtag('event',name,params||{});
    if(typeof window.clarity==='function')window.clarity('event',name);
  }catch(e){}
};

(function(){'use strict';

/* ─── LENIS ─────────────────────────────────────────────────── */
var lenis=null;
var AGX_REDUCED=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.AGX_REDUCED=AGX_REDUCED;
/* Smooth scroll is skipped for visitors who ask for reduced motion (WCAG 2.3.3) */
if(window.Lenis&&!AGX_REDUCED){
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
  function close(){mobile.classList.remove('open');document.body.style.overflow='';burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Open menu');}
  burger.addEventListener('click',function(){
    var open=mobile.classList.toggle('open');
    document.body.style.overflow=open?'hidden':'';
    burger.setAttribute('aria-expanded',open?'true':'false');
    burger.setAttribute('aria-label',open?'Close menu':'Open menu');
    if(open){var first=mobile.querySelector('a');if(first)first.focus();}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&mobile.classList.contains('open')){close();burger.focus();}});
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
   Every scroll-reveal above (and the pain-pill/testi-
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
  var SEL='.rv,.pain-pill,.testi-card,.trust-item,.pillar-card,.stats-band .why-counter';
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

/* ─── PHOTO UPLOAD → CLOUDINARY ────────────────────────────────
   Uploads a single File to Cloudinary's unsigned endpoint and
   resolves with its public secure_url, or null if anything goes
   wrong (bad network, preset not configured yet, etc). Never
   rejects, so a failed photo upload never blocks form submission —
   it just falls back to sending the filename, same as before. ─── */
function agxSlug(str){
  return (str||'').toString().toLowerCase()
    .replace(/\.[a-z0-9]+$/i,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,40)||'photo';
}
function agxUploadFile(file){
  try{
    var cfg=window.AGX_CONFIG&&window.AGX_CONFIG.cloudinary;
    if(!cfg||!cfg.cloudName||!cfg.uploadPreset)return Promise.resolve(null);
    var url='https://api.cloudinary.com/v1_1/'+cfg.cloudName+'/auto/upload';
    var fd=new FormData();
    fd.append('file',file);
    fd.append('upload_preset',cfg.uploadPreset);
    /* Give the upload a clean, readable name (e.g. ".../about-x7k2p.jpg")
       instead of Cloudinary's default random hash, so the link that
       lands in DripJobs is recognizable at a glance instead of
       gibberish. If the preset ever locks public_id down, Cloudinary
       just falls back to its own naming — harmless either way. */
    var shortId=Math.random().toString(36).slice(2,7);
    fd.append('public_id','aggrepoxy-leads/'+agxSlug(file.name)+'-'+shortId);
    return fetch(url,{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(data){return (data&&data.secure_url)?data.secure_url:null;})
      .catch(function(){return null;});
  }catch(err){
    return Promise.resolve(null);
  }
}

/* Shared "Got it, thanks!" success markup, so the three places that
   show it (normal send, unexpected-error fallback, and the quiet
   spam short-circuit below) can't drift out of sync with each other. */
function agxSuccessHtml(title,message){
  return '<div class="q-success">'+
    '<div class="q-success-icon">&#10003;</div>'+
    '<h3>'+title+'</h3>'+
    '<p>'+message+'</p>'+
    '</div>';
}
var AGX_SUCCESS_MSG='Your request is in. We\'ll reach out shortly. If it\'s urgent, call us directly at <a href="tel:2139715868" style="color:var(--cyan)">(213) 971-5868</a>.';

/* Step-2 screen shown in place of the form after a successful send */
function agxBookingHtml(){
  return '<div class="q-success">'+
    '<div class="q-success-icon">&#10003;</div>'+
    '<h3>Got it! One last step.</h3>'+
    '<p>Next, pick a day and time for your free 20-minute on-site estimate. Your scheduler will open in a pop-up.</p>'+
    '<button type="button" class="hc-submit agx-open-booking" style="margin-top:8px;">Pick My Estimate Time</button>'+
    '<p class="agx-countdown">Opening the scheduler in 3…</p>'+
    '<p class="q-success-alt">Prefer to talk? Call <a href="tel:2139715868" style="color:var(--cyan)">(213) 971-5868</a>.</p>'+
    '</div>';
}

/* DripJobs booking form in a pop-up (built once, reused) */
window.AGX=window.AGX||{};
window.AGX.openBooking=function(){
  var url=window.AGX_CONFIG&&window.AGX_CONFIG.bookingUrl;
  if(!url)return;
  var m=document.getElementById('agx-booking');
  if(!m){
    m=document.createElement('div');
    m.id='agx-booking';m.className='agx-modal';
    m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Schedule your free estimate');
    m.innerHTML='<div class="agx-modal-panel">'+
      '<div class="agx-modal-head"><span>Schedule Your Free Estimate</span>'+
      '<button type="button" class="agx-modal-close" aria-label="Close">&times;</button></div>'+
      '<iframe src="'+url+'" title="Schedule your free estimate" loading="eager"></iframe>'+
      '<a class="agx-modal-fallback" href="'+url+'" target="_blank" rel="noopener">Form not loading? Open it in a new tab</a>'+
      '</div>';
    document.body.appendChild(m);
    function close(){m.classList.remove('open');document.body.style.overflow='';if(window.AGX_LENIS)window.AGX_LENIS.start();if(m._returnFocus&&m._returnFocus.focus)m._returnFocus.focus();}
    m.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=m.querySelectorAll('button,a[href],iframe');var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}});
    m.addEventListener('click',function(e){if(e.target===m)close();});
    m.querySelector('.agx-modal-close').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('open'))close();});
  }
  window.agxTrack('booking_open',{page_path:window.location.pathname});
  m._returnFocus=document.activeElement;
  m.classList.add('open');document.body.style.overflow='hidden';
  setTimeout(function(){var cb=m.querySelector('.agx-modal-close');if(cb)cb.focus();},50);
  if(window.AGX_LENIS)window.AGX_LENIS.stop();
};
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('.agx-open-booking');
  if(t){e.preventDefault();window.AGX.openBooking();}
});

/* ─── SHARED MAILTO FORM HELPER ──────────────────────────────── */
window.AGX=window.AGX||{};
window.AGX.wireForm=function(opts){
  var form=document.getElementById(opts.formId);
  if(!form)return;
  var requiredEls=(opts.requiredIds||[]).map(function(id){return document.getElementById(id);}).filter(Boolean);
  var agree=opts.agreeId?document.getElementById(opts.agreeId):null;
  requiredEls.forEach(function(f){f.addEventListener('input',function(){f.style.boxShadow='';f.removeAttribute('aria-invalid');});});
  /* Text error summary, announced to screen readers (WCAG 3.3.1, 1.4.1) */
  var errBox=document.createElement('p');
  errBox.className='agx-form-error';errBox.setAttribute('role','alert');errBox.id=opts.formId+'-error';
  var submitEl=form.querySelector(opts.submitSelector||'button[type="submit"]');
  if(submitEl&&submitEl.parentNode)submitEl.parentNode.insertBefore(errBox,submitEl);else form.appendChild(errBox);
  function fieldName(f){return (f.getAttribute('aria-label')||f.getAttribute('placeholder')||f.name||'This field').replace(/\s*\*$/,'');}

  /* ─── SPAM GUARD ────────────────────────────────────────────
     Two invisible checks, neither adds a click or a checkbox for a
     real visitor:
       1. Honeypot — a text field no human ever sees or fills, added
          to the DOM here (not in the HTML) so it's not even visible
          in view-source as an obvious decoy. Most form-spam bots
          blindly fill every input they find.
       2. Time trap — reject anything submitted less than ~1.5s after
          this form was wired up. No human can read three fields,
          type into them, and click submit that fast; bots that
          fire-and-forget usually do it near-instantly.
     Either signal quietly shows the normal success message without
     actually sending anything — the bot thinks it worked, so it has
     no reason to try harder, and we don't burn a Zapier task on it. */
  var formLoadedAt=Date.now();
  var honeypot=document.createElement('input');
  honeypot.type='text';
  honeypot.name='hp_website';
  honeypot.tabIndex=-1;
  honeypot.autocomplete='off';
  honeypot.setAttribute('aria-hidden','true');
  honeypot.style.cssText='position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none;';
  form.appendChild(honeypot);

  /* Optional photo/plan upload. fileAccum keeps the real running list
     per file input, keyed by its id — the submit handler below reads
     straight from it, never from the native input's own FileList. */
  var fileAccum={};
  form.querySelectorAll('input[type=file]').forEach(function(fileInput){
    var wrap=fileInput.closest('.hc-file');
    var thumbsEl=wrap?wrap.querySelector('.hc-file-thumbs'):null;
    /* The whole box is the drop target (not just the label row), so a
       file dropped anywhere inside the dashed border — including over
       existing thumbnails — is picked up correctly. */
    var dropZone=wrap;
    var acc=fileAccum[fileInput.id]=[];
    var objectUrls=[];

    function isPreviewable(file){
      var name=(file.name||'').toLowerCase();
      return /^image\//.test(file.type)&&file.type!=='image/heic'&&file.type!=='image/heif'&&!/\.(heic|heif)$/.test(name);
    }

    function render(){
      if(!thumbsEl)return;
      objectUrls.forEach(function(u){URL.revokeObjectURL(u);});
      objectUrls=[];
      thumbsEl.innerHTML='';
      acc.forEach(function(file,idx){
        var tile=document.createElement('div');
        tile.className='hc-thumb';
        if(isPreviewable(file)){
          var url=URL.createObjectURL(file);
          objectUrls.push(url);
          var img=document.createElement('img');
          img.src=url;
          img.alt=file.name;
          tile.appendChild(img);
        }else{
          var badge=document.createElement('div');
          badge.className='hc-thumb-file';
          badge.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><span></span>';
          badge.querySelector('span').textContent=file.name;
          tile.appendChild(badge);
        }
        var remove=document.createElement('button');
        remove.type='button';
        remove.className='hc-thumb-remove';
        remove.setAttribute('aria-label','Remove '+file.name);
        remove.innerHTML='&times;';
        remove.addEventListener('click',function(e){
          e.preventDefault();
          e.stopPropagation();
          acc.splice(idx,1);
          render();
        });
        tile.appendChild(remove);
        thumbsEl.appendChild(tile);
      });
    }

    function addFiles(fileList){
      Array.prototype.forEach.call(fileList,function(f){acc.push(f);});
      render();
    }

    fileInput.addEventListener('change',function(){
      /* A native <input type=file> REPLACES its FileList every time
         the picker is used — so choosing photos across more than one
         pass (add one, reopen the picker, add another) would silently
         drop everything picked earlier. We accumulate into acc instead
         (read by the submit handler below, never fileInput.files) and
         clear the input right after, so picking the same file again
         later — e.g. after removing its thumbnail — still fires a
         change event. */
      addFiles(fileInput.files);
      fileInput.value='';
    });

    if(dropZone){
      ['dragenter','dragover'].forEach(function(evt){
        dropZone.addEventListener(evt,function(e){e.preventDefault();e.stopPropagation();dropZone.classList.add('hc-file-drag');});
      });
      ['dragleave','drop'].forEach(function(evt){
        dropZone.addEventListener(evt,function(e){e.preventDefault();e.stopPropagation();dropZone.classList.remove('hc-file-drag');});
      });
      dropZone.addEventListener('drop',function(e){
        if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)addFiles(e.dataTransfer.files);
      });
      /* Clicking anywhere in the box reopens the picker — over the
         thumbnails, the empty padding, all of it — not just the
         icon/text row. The label already opens it natively there, so
         skip re-triggering to avoid a double dialog; a remove button
         click is its own action and shouldn't also open the picker. */
      wrap.addEventListener('click',function(e){
        if(e.target.closest('.hc-thumb-remove'))return;
        if(e.target.closest('.hc-file-label'))return;
        fileInput.click();
      });
    }
  });

  form.addEventListener('submit',function(e){
    e.preventDefault();

    if((honeypot.value&&honeypot.value.trim())||(Date.now()-formLoadedAt<1500)){
      var spamTarget=document.getElementById(opts.successContainerId||opts.formId);
      if(spamTarget)spamTarget.innerHTML=agxSuccessHtml('Got it, thanks!',AGX_SUCCESS_MSG);
      return;
    }

    var ok=true,firstBad=null,msgs=[];
    function markBad(f,why){f.style.boxShadow='0 0 0 2px #cc3344';f.setAttribute('aria-invalid','true');f.setAttribute('aria-describedby',errBox.id);msgs.push(fieldName(f)+' '+(why||'is required'));if(!firstBad)firstBad=f;ok=false;}
    requiredEls.forEach(function(f){
      var val=(f.value||'').trim();
      if(!val){markBad(f);return;}
      if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[a-z0-9-]+$/i.test(val)){markBad(f,'needs a valid email address');return;}
      if(f.type==='tel'){
        var digits=val.replace(/\D/g,'');
        if(digits.length<10||digits.length>11){markBad(f,'needs a 10-digit phone number');return;}
      }
      f.style.boxShadow='';f.removeAttribute('aria-invalid');
    });
    if(agree&&!agree.checked){ok=false;agree.setAttribute('aria-invalid','true');msgs.push('Please check the box to agree to the Privacy Policy and Terms');if(!firstBad)firstBad=agree;}else if(agree){agree.removeAttribute('aria-invalid');}
    errBox.textContent=ok?'':'Please fix: '+msgs.join('. ')+'.';
    if(!ok){if(firstBad)firstBad.focus();return;}

    var subject=opts.subject||'New estimate request: Aggrepoxy';
    var to=opts.to||'floors@aggrepoxy.com';
    var target=document.getElementById(opts.successContainerId||opts.formId);
    var btn=form.querySelector(opts.submitSelector||'button[type="submit"]');
    var w3Key=opts.web3Key||(window.AGX_CONFIG&&window.AGX_CONFIG.web3formsKey);
    var w3Configured=w3Key&&w3Key.indexOf('PASTE_')!==0;
    var useBooking=opts.booking!==false&&!!(window.AGX_CONFIG&&window.AGX_CONFIG.bookingUrl);

    /* Upload any selected photo(s) to Cloudinary first, so the CRM
       payload (and the mailto fallback) can carry a real clickable
       link instead of just a filename. A failed/unconfigured upload
       silently falls back to the filename — never blocks the form. */
    var fileFields=(opts.fields||[]).filter(function(f){
      var acc=fileAccum[f.id];
      return acc&&acc.length;
    });
    var hasFiles=fileFields.length>0;
    if(btn){btn.textContent=hasFiles?'Uploading photos…':'Sending…';btn.disabled=true;}

    var uploadWork=fileFields.map(function(f){
      var files=fileAccum[f.id].slice();
      return Promise.all(files.map(agxUploadFile)).then(function(urls){
        return {id:f.id,names:files.map(function(file){return file.name;}),urls:urls.filter(Boolean)};
      });
    });

    Promise.all(uploadWork).then(function(uploadResults){
      var uploadedById={};
      uploadResults.forEach(function(r){uploadedById[r.id]=r;});
      var anyPhotoUrls=uploadResults.some(function(r){return r.urls.length;});

      var crmPayload={page:window.location.pathname,form:opts.subject||opts.formId,submitted_at:new Date().toISOString()};
      var lines=(opts.fields||[]).map(function(f){
        var el=document.getElementById(f.id);
        if(!el)return null;
        var val;
        if(el.type==='file'){
          var uploaded=uploadedById[f.id];
          /* One link per line rather than comma-separated — easier to
             read and click through in DripJobs' notes, and gives any
             auto-linking there the clean, isolated URL it needs. */
          val=uploaded?(uploaded.urls.length?uploaded.urls.join('\n'):uploaded.names.join(', ')):'';
        }else{
          val=(el.value||'').trim();
        }
        var crmKey=f.id.replace(/^[a-z]+-/,'')||f.id;
        /* DripJobs' "Create Lead" action requires Lead Source on every
           call — if this optional dropdown is left blank we'd send an
           empty string, which makes Zapier reject the whole run and
           the lead never reaches DripJobs at all. Default it instead
           so a skipped question never silently kills the lead. */
        if(crmKey==='source'&&!val)val='Not specified';
        crmPayload[crmKey]=val;
        return (val&&val!=='Not specified')?(f.label+': '+val):null;
      }).filter(Boolean);
      /* DripJobs' "Create Lead" action wants First Name / Last Name
         separately, but our forms only capture one Name field, so
         split it here for a clean Zapier field mapping. */
      if(crmPayload.name){
        var nameParts=crmPayload.name.trim().split(/\s+/);
        crmPayload.first_name=nameParts[0]||'';
        crmPayload.last_name=nameParts.slice(1).join(' ')||nameParts[0]||'';
      }else{
        crmPayload.first_name='';
        crmPayload.last_name='';
      }

      /* Readable email payload for Web3Forms */
      /* Subject: "NEW ESTIMATE: Jane Smith" (Chicago: "NEW BID REQUEST: Name") */
      var who=(crmPayload.name||'').trim();
      var emailSubject=opts.booking===false?(subject.split(':')[0].toUpperCase()+(who?': '+who:'')):('NEW ESTIMATE'+(who?': '+who:''));
      var emailPayload={access_key:w3Key,subject:emailSubject,from_name:'Aggrepoxy Website',botcheck:''};
      (opts.fields||[]).forEach(function(f){
        var k=f.id.replace(/^[a-z]+-/,'');
        if(crmPayload[k]&&crmPayload[k]!=='Not specified')emailPayload[f.label]=crmPayload[k];
      });
      if(crmPayload.email)emailPayload.replyto=crmPayload.email;
      emailPayload['Page']=window.location.pathname;
      emailPayload['DripJobs']=useBooking?'Visitor was shown the booking form. This lead is NOT in DripJobs until they finish it. If no booking shows up, add them manually.':'Not sent to DripJobs. Follow up directly.';

      function showDone(){
        if(!target)return;
        if(useBooking){
          target.innerHTML=agxBookingHtml();
          /* Give them a few seconds to read what's next, with a visible countdown */
          var cd=target.querySelector('.agx-countdown'),n=3;
          var tick=setInterval(function(){
            n--;
            if(cd)cd.textContent=n>0?'Opening the scheduler in '+n+'…':'Opening the scheduler…';
            if(n<=0){clearInterval(tick);window.AGX.openBooking();}
          },1000);
          var openBtn=target.querySelector('.agx-open-booking');
          if(openBtn)openBtn.addEventListener('click',function(){clearInterval(tick);if(cd)cd.textContent='';});
        }else{
          target.innerHTML=agxSuccessHtml('Got it, thanks!',opts.successMsg||AGX_SUCCESS_MSG);
        }
      }

      window.agxTrack('generate_lead',{form_id:opts.formId,page_path:window.location.pathname,with_booking:useBooking?'yes':'no'});
      /* Instant Quo contact + text (functions/api/lead.js). SoCal forms
         only; Chicago forms use booking:false. Fire-and-forget: if it
         fails, the email + Pushover alert below still goes out. */
      if(useBooking){
        try{
          fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(crmPayload),keepalive:true}).catch(function(){});
        }catch(err){/* ignore */}
      }
      if(w3Configured){
        if(btn){btn.textContent='Sending…';}
        try{
          fetch('https://api.web3forms.com/submit',{
            method:'POST',
            headers:{'Content-Type':'application/json','Accept':'application/json'},
            body:JSON.stringify(emailPayload),
            keepalive:true
          }).catch(function(){/* best-effort, still continue to step 2 */});
        }catch(err){/* ignore */}
        setTimeout(showDone,400);
      }else if(useBooking){
        /* Email step not set up yet: go straight to booking so the
           lead still lands in DripJobs. */
        if(window.console)console.warn('AGX: Web3Forms key not set, skipping email step.');
        showDone();
      }else{
        /* No email key and no booking step: fall back to mailto. */
        if(hasFiles)lines.push(anyPhotoUrls?'(Photo link(s) included above — click to view.)':'(Please attach the file(s) named above to this email before sending, mailto links can\'t attach them automatically.)');
        var mailto='mailto:'+to+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n'));
        if(btn){btn.textContent='Opening your email…';}
        window.location.href=mailto;
        setTimeout(function(){
          if(target)target.innerHTML=agxSuccessHtml('Almost there','Your email app should be open with your details filled in. Just hit send. If nothing opened, email us directly at <a href="mailto:'+to+'" style="color:var(--cyan)">'+to+'</a>.');
        },500);
      }
    }).catch(function(){
      /* Should be unreachable (agxUploadFile never rejects), but if
         something truly unexpected happens, don't leave the visitor
         staring at a stuck "Uploading…" button. */
      if(btn){btn.textContent='Sending…';}
      if(target){
        target.innerHTML=agxSuccessHtml('Got it, thanks!',AGX_SUCCESS_MSG);
      }
    });
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
      '<div class="ba-slider-wrap" id="bas-'+uid+'" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% before, 50% after" aria-label="Before and after comparison'+(d.tag?': '+d.tag:'')+(d.loc?', '+d.loc:'')+'. Use left and right arrow keys to compare.">'+
        '<div class="ba-before" style="background-image:url(\''+d.before+'\')"></div>'+
        '<div class="ba-after" id="baa-'+uid+'" style="background-image:url(\''+d.after+'\')"></div>'+
        '<div class="ba-handle" id="bah-'+uid+'">'+
          '<div class="ba-handle-arrows"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="display:block"><path d="M9 6L4 12L9 18" stroke="#0C0C0C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6L20 12L15 18" stroke="#0C0C0C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
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
      afterEl.style.clipPath='inset(0 0 0 '+(pos*100).toFixed(1)+'%)';
      handleEl.style.left=(pos*100).toFixed(1)+'%';
      var pct=Math.round(pos*100);
      wrap.setAttribute('aria-valuenow',pct);wrap.setAttribute('aria-valuetext',pct+'% before, '+(100-pct)+'% after');
    }
    function gx(e){return e.touches?e.touches[0].clientX:e.clientX;}
    function mv(e){if(!drag)return;var r=wrap.getBoundingClientRect();setPos((gx(e)-r.left)/r.width);}
    wrap.addEventListener('keydown',function(e){
      var k=e.key,step=e.shiftKey?.2:.05;
      if(k==='ArrowLeft'||k==='ArrowDown'){setPos(pos-step);}
      else if(k==='ArrowRight'||k==='ArrowUp'){setPos(pos+step);}
      else if(k==='Home'){setPos(.02);}else if(k==='End'){setPos(.98);}
      else return;
      e.preventDefault();
    });
    wrap.addEventListener('mousedown',function(e){drag=true;mv(e);});
    wrap.addEventListener('touchstart',function(e){drag=true;mv(e);},{passive:true});
    window.addEventListener('mousemove',mv);
    window.addEventListener('touchmove',mv,{passive:true});
    window.addEventListener('mouseup',function(){drag=false;});
    window.addEventListener('touchend',function(){drag=false;});
    setPos(0.5);
  });
};

/* ─── GEO PHONE NUMBER SWAP ─────────────────────────────────────
   Shows the LA number to West Coast visitors and the Chicago
   number to Midwest visitors. Uses the browser timezone for an
   instant, no-network guess, then refines with an IP lookup.
────────────────────────────────────────────────────────────── */
(function(){
  var NUMBERS={
    la:{display:'(213) 971-5868',href:'tel:2139715868'},
    chi:{display:'(630) 632-4701',href:'tel:6306324701'}
  };
  var MIDWEST_STATES=['IL','IN','WI','MI','OH','MN','IA','MO','KS','NE','SD','ND'];
  var MIDWEST_ZONES=['America/Chicago','America/Indiana/Indianapolis','America/Detroit','America/Menominee','America/North_Dakota/Center'];
  function applyRegion(region){
    var n=NUMBERS[region]||NUMBERS.la;
    document.querySelectorAll('[data-geo-phone]').forEach(function(el){
      if(el.tagName==='A')el.setAttribute('href',n.href);
      if(el.hasAttribute('data-geo-href-only'))return;
      var textEl=el.querySelector('[data-geo-phone-text]');
      if(textEl)textEl.textContent=n.display;else el.textContent=n.display;
    });
  }
  function timezoneGuess(){
    try{
      var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
      return MIDWEST_ZONES.indexOf(tz)>-1?'chi':'la';
    }catch(e){return 'la';}
  }
  applyRegion(timezoneGuess());
  if(window.fetch){
    fetch('https://ipwho.is/?fields=success,region_code',{cache:'no-store'})
      .then(function(r){return r.json();})
      .then(function(data){
        if(data&&data.success&&data.region_code){
          applyRegion(MIDWEST_STATES.indexOf(data.region_code)>-1?'chi':'la');
        }
      })
      .catch(function(){/* keep timezone-based guess */});
  }
})();

/* ─── CONTACT PAGE REGION SWITCH ────────────────────────────────
   Toggles the LA/OC vs Chicago Metro contact-info blocks when a
   .region-btn is clicked.
────────────────────────────────────────────────────────────── */
document.querySelectorAll('.region-switch').forEach(function(sw){
  var btns = sw.querySelectorAll('.region-btn');
  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      btns.forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var region = btn.getAttribute('data-region');
      document.querySelectorAll('[data-region-content]').forEach(function(el){
        el.classList.toggle('active', el.getAttribute('data-region-content')===region);
      });
    });
  });
});

})();


/* ─── ACCESSIBILITY: pause control for autoplaying video (WCAG 2.2.2) ── */
(function(){
  var PAUSE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  var PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
  document.querySelectorAll('video[autoplay],video[loop]').forEach(function(v){
    if(v.controls)return;
    var host=v.parentElement;if(!host)return;
    if(getComputedStyle(host).position==='static')host.style.position='relative';
    var b=document.createElement('button');b.type='button';b.className='agx-media-toggle';
    function sync(){var p=v.paused;b.innerHTML=p?PLAY:PAUSE;b.setAttribute('aria-label',p?'Play video':'Pause video');}
    b.addEventListener('click',function(){if(v.paused)v.play();else v.pause();sync();});
    v.addEventListener('play',sync);v.addEventListener('pause',sync);
    host.appendChild(b);sync();
  });
})();

/* ─── ACCESSIBILITY: skip link moves focus into main content ── */
(function(){
  var s=document.querySelector('.skip-link'),m=document.getElementById('main');
  if(!s||!m)return;
  s.addEventListener('click',function(e){e.preventDefault();m.focus();m.scrollIntoView();});
})();


/* ─── ANALYTICS: phone taps and email clicks (any page) ── */
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href^="tel:"],a[href^="mailto:"]');
  if(!a)return;
  var tel=a.getAttribute('href').indexOf('tel:')===0;
  window.agxTrack(tel?'phone_click':'email_click',{
    link_text:tel?a.getAttribute('href').replace('tel:',''):'email',
    page_path:window.location.pathname
  });
});


/* ─── AGX section background: lock the image size at load so opening
   the accordion reveals more of the section instead of re-zooming
   the photo (background-size:cover rescales as the section grows). ── */
(function(){
  var secs=document.querySelectorAll('.why-section');
  if(!secs.length)return;
  function lock(sec,ratio){
    sec.style.backgroundSize='';sec.style.backgroundPosition='';
    /* size for the section plus room to grow, so opening a dropdown
       uncovers more photo instead of a blank strip */
    var w=sec.offsetWidth,h=sec.offsetHeight+200,W,H;
    if(w/h>ratio){W=w;H=w/ratio;}else{H=h;W=h*ratio;}
    sec.style.backgroundSize=Math.ceil(W)+'px '+Math.ceil(H)+'px';
    sec.style.backgroundPosition='center 0px';
  }
  secs.forEach(function(sec){
    var m=(getComputedStyle(sec).backgroundImage||'').match(/url\(["']?(.*?)["']?\)/);
    if(!m)return;
    var img=new Image();
    img.onload=function(){
      var ratio=img.naturalWidth/img.naturalHeight,lastW=window.innerWidth;
      lock(sec,ratio);
      window.addEventListener('resize',function(){
        if(window.innerWidth===lastW)return; /* ignore mobile address-bar resizes */
        lastW=window.innerWidth;lock(sec,ratio);
      });
    };
    img.src=m[1];
  });
})();


/* ─── STICKY CALL / ESTIMATE BAR (phones, every page) ─────────────
   Uses the page's own phone number (LA, Chicago or geo-swapped) and
   hides itself while an estimate form is on screen. */
(function(){
  if(document.getElementById('agx-sticky')||/thank-you/.test(location.pathname))return;
  var navPhone=document.querySelector('.nav-phone[href^="tel:"]');
  var tel=navPhone?navPhone.getAttribute('href'):'tel:2139715868';
  var geo=navPhone&&navPhone.hasAttribute('data-geo-phone');
  var form=document.getElementById('cta-quote-panel')||document.getElementById('svc-form')||document.getElementById('h-form');
  var cta=document.querySelector('.nav-cta');
  var href=form?'#contact':(cta?cta.getAttribute('href'):'contact.html');
  if(href==='#contact'&&!form)href='contact.html';
  var bar=document.createElement('div');
  bar.className='agx-sticky';bar.id='agx-sticky';bar.setAttribute('role','region');bar.setAttribute('aria-label','Quick contact');
  bar.innerHTML='<a href="'+tel+'" class="agx-sticky-call"'+(geo?' data-geo-phone data-geo-href-only':'')+'><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Call Now</span></a>'+
    '<a href="'+href+'" class="agx-sticky-cta">Free Estimate</a>';
  document.body.appendChild(bar);document.body.classList.add('has-sticky');
  if(!window.IntersectionObserver)return;
  var vis=new Set();
  var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)vis.add(e.target);else vis.delete(e.target);});bar.classList.toggle('hide',vis.size>0);},{threshold:.15});
  ['svc-form','cta-quote-panel','h-form'].forEach(function(id){var el=document.getElementById(id);if(el)o.observe(el);});
})();

/* ─── "FREE ESTIMATE" LINKS LAND ON THE FORM ITSELF ────────────────
   #contact points at the section; on phones the form sits several
   scrolls below the section's heading, so jump straight to the form. */
(function(){
  function target(){
    return document.getElementById('cta-quote-panel')||document.getElementById('svc-form')||document.getElementById('h-form')||document.getElementById('contact');
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href="#contact"]');
    if(!a)return;
    var t=target();if(!t)return;
    e.preventDefault();
    var mob=document.getElementById('nav-mobile');
    if(mob&&mob.classList.contains('open')){var b=document.getElementById('nav-burger');if(b)b.click();}
    var nav=document.getElementById('nav');
    var reduce=window.AGX_REDUCED;
    function go(smooth){
      var off=(nav?nav.offsetHeight:0)+12;
      var y=t.getBoundingClientRect().top+window.pageYOffset-off;
      if(window.AGX_LENIS&&!reduce)window.AGX_LENIS.scrollTo(y,{duration:smooth?1:.35});
      else window.scrollTo({top:y,behavior:(smooth&&!reduce)?'smooth':'auto'});
    }
    go(true);
    /* photos above the form can finish loading mid-scroll and push it
       down; re-aim a couple of times until it settles */
    [1100,1700,2400].forEach(function(ms){
      setTimeout(function(){
        var off=(nav?nav.offsetHeight:0)+12;
        if(Math.abs(t.getBoundingClientRect().top-off)>8)go(false);
      },ms);
    });
  });
})();

/* Mobile hero: size the photo band to end where the hero form begins */
(function(){
  var hero=document.querySelector('.svc-hero');if(!hero)return;
  var card=hero.querySelector('.hero-card');if(!card)return;
  var lastW=0;
  function fit(){
    var w=window.innerWidth;if(w===lastW)return;lastW=w;
    if(w>900){hero.style.removeProperty('--mh-bg');return;}
    var top=card.getBoundingClientRect().top-hero.getBoundingClientRect().top;
    hero.style.setProperty('--mh-bg',Math.round(top+90)+'px');
  }
  fit();window.addEventListener('resize',fit);window.addEventListener('load',function(){lastW=0;fit();});
})();
