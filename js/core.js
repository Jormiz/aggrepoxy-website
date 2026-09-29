/* ================================================================
   AGGREPOXY — CORE.JS
   Shared on every page: Lenis smooth scroll, GSAP reveal system,
   nav scroll/mobile behavior, geo-redirect, mailto form helper.
================================================================ */

/* ─── CRM HANDOFF (DripJobs via Zapier) ────────────────────────
   Every quote form on the site fires a lead into DripJobs through
   a Zapier "Catch Hook" webhook, in addition to its existing mailto
   fallback. To turn this on:
     1. In Zapier, create a Zap: Trigger = Webhooks by Zapier →
        Catch Hook. Copy the custom webhook URL it gives you.
     2. Add a second step: Action = DripJobs → Create Lead. Connect
        your DripJobs account there using the API key from DripJobs
        under Company Settings → Integrations (that key belongs in
        Zapier's own connection screen, never in this file).
     3. Map the incoming fields (name, phone, address, email,
        details, source, photos, page, form) to DripJobs' lead
        fields, then publish the Zap.
     4. Paste the webhook URL below in place of the placeholder.
   Until a real URL is pasted in, this is a no-op — no requests are
   sent and nothing else on the site is affected.

   PHOTOS: DripJobs' Zapier "Create Lead" action has no attachment
   field, and Zapier's own webhook catcher doesn't reliably carry raw
   file bytes anyway. So instead of sending the file itself, any
   photo picked in a quote form is first uploaded straight from the
   visitor's browser to Cloudinary's free "unsigned upload" endpoint
   (cloudName/uploadPreset below — both are public identifiers, not
   secrets, same idea as a Stripe publishable key) and the resulting
   photo URL is sent in the `photos` field instead of just the
   filename, so DripJobs gets a real clickable link to the image.
================================================================ */
window.AGX_CONFIG=window.AGX_CONFIG||{};
window.AGX_CONFIG.dripjobsWebhookUrl='https://hooks.zapier.com/hooks/catch/28958469/4mbgr6b/';
window.AGX_CONFIG.cloudinary={cloudName:'g7z6n9ug',uploadPreset:'aggrepoxy_lead_form'};

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

/* ─── SHARED MAILTO FORM HELPER ──────────────────────────────── */
window.AGX=window.AGX||{};
window.AGX.wireForm=function(opts){
  var form=document.getElementById(opts.formId);
  if(!form)return;
  var requiredEls=(opts.requiredIds||[]).map(function(id){return document.getElementById(id);}).filter(Boolean);
  var agree=opts.agreeId?document.getElementById(opts.agreeId):null;
  requiredEls.forEach(function(f){f.addEventListener('input',function(){f.style.boxShadow='';});});

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

    var ok=true,firstBad=null;
    function markBad(f){f.style.boxShadow='0 0 0 2px #cc3344';if(!firstBad)firstBad=f;ok=false;}
    requiredEls.forEach(function(f){
      var val=(f.value||'').trim();
      if(!val){markBad(f);return;}
      if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[a-z0-9-]+$/i.test(val)){markBad(f);return;}
      if(f.type==='tel'){
        var digits=val.replace(/\D/g,'');
        if(digits.length<10||digits.length>11){markBad(f);return;}
      }
      f.style.boxShadow='';
    });
    if(agree&&!agree.checked){ok=false;if(!firstBad)firstBad=agree;}
    if(!ok){if(firstBad)firstBad.focus();return;}

    var subject=opts.subject||'New estimate request: Aggrepoxy';
    var to=opts.to||'floors@aggrepoxy.com';
    var target=document.getElementById(opts.successContainerId||opts.formId);
    var btn=form.querySelector(opts.submitSelector||'button[type="submit"]');
    var webhookUrl=window.AGX_CONFIG&&window.AGX_CONFIG.dripjobsWebhookUrl;
    var webhookConfigured=webhookUrl&&webhookUrl.indexOf('PASTE_')!==0;

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

      if(webhookConfigured){
        /* Lead goes straight into DripJobs via the Zapier webhook.
           Submission is silent for the visitor, no email client, no
           extra step on their end, just a clean confirmation. */
        if(btn){btn.textContent='Sending…';}
        try{
          fetch(webhookUrl,{
            method:'POST',
            mode:'no-cors',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(crmPayload),
            keepalive:true
          }).catch(function(){/* best-effort, still show confirmation below */});
        }catch(err){/* fetch unsupported or blocked, ignore */}

        setTimeout(function(){
          if(target)target.innerHTML=agxSuccessHtml('Got it, thanks!',AGX_SUCCESS_MSG);
        },400);
      }else{
        /* Fallback while the CRM webhook isn't set up yet: hand the
           details off via a mailto link so the form still does
           something useful. */
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
      '<div class="ba-slider-wrap" id="bas-'+uid+'">'+
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
