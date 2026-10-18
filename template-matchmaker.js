/* SQSPThemes Template Matchmaker v2
   Standalone, zero-vector-db catalog matcher.
   Usage: <div id="sqt-template-matchmaker" data-catalog-url="https://YOUR-HOST/templates.json"></div>
          <script defer src="https://cdn.jsdelivr.net/gh/omarih33/sqspthemes-site@main/template-matchmaker.js"></script>
   JSON: array OR {templates:[{id,title,designer,description,industry,style,features,
     tags,price,image_url,demo_url,product_url,url,status}]}.
   Optional intelligent re-rank: set data-match-api to your own Cloudflare Worker endpoint.
   The browser never contains any private API credentials. */
(function () {
  'use strict';
  const mount = document.querySelector('#sqt-template-matchmaker');
  if (!mount || mount.dataset.initialized === 'true') return;
  mount.dataset.initialized = 'true';
  const ownScript = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  const assetBase = ownScript ? ownScript.replace(/[^/?]+(?:\?.*)?$/, '') : 'https://sqspthemes-assets.pages.dev/';
  const catalogUrl = mount.dataset.catalogUrl || (assetBase + 'template-catalog.json');
  const matchApi = mount.dataset.matchApi || '';
  const MAX_RESULTS = 6;
  let sourceFilter='all';
  let catalog = [];
  let lastResults = [];
  let lastPrompt = '';
  let aiReasons = {};
  const stop = new Set('a an and are as at be by for from have i in is it like me my of on or our that the their this to want website with would you your something looking need site built design'.split(' '));
  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const tokens = s => [...new Set(String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(x=>x.length>2&&!stop.has(x)))];
  const array = x => Array.isArray(x) ? x : x == null ? [] : String(x).split(/[,;|]/).map(s=>s.trim()).filter(Boolean);
  const absoluteUrl = x => { try { const u = new URL(String(x || ''), location.href); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch (_) { return ''; } };
  const get = (t,...keys) => keys.map(k=>t[k]).find(v=>v!==undefined&&v!==null&&v!=='') || '';
  function normalize(t,i) {
    return {
      id:String(get(t,'id','slug','item_id') || i),
      name:String(get(t,'name','title','template_name','Template_Name') || 'Untitled template'),
      designer:String(get(t,'designer','Designer','maker') || ''),
      description:String(get(t,'description','summary','AI_Generated_Description') || ''),
      industry:array(get(t,'industry','industries','target_audience','Target_Audience','category','categories')),
      style:array(get(t,'style','styles','layout','Layout')),
      features:array(get(t,'features','feature_tags','Sections','sections')),
      tags:array(get(t,'tags','keywords','Keywords','Template_Type')),
      price:Number(String(get(t,'price','Price')||'').replace(/[^\d.]/g,'')) || null,
      image:(String(get(t,'source_type')||'')==='native' && /imghippo\.com/i.test(String(get(t,'image_url','Image_url','image','thumbnail')))) ? '' : absoluteUrl(get(t,'image_url','Image_url','image','thumbnail')),
      demo:absoluteUrl(get(t,'demo_url','Demo URL','demo')),
      product:absoluteUrl(get(t,'product_url','purchase_url','affiliate_url','Link')),
      detail:absoluteUrl(get(t,'url','detail_url','Template Link')),
      sourceType:String(get(t,'source_type') || 'third_party'),
      pricingLabel:String(get(t,'pricing_label') || ''),
      verificationStatus:String(get(t,'verification_status') || ''),
      status:String(get(t,'status','Status') || 'active').toLowerCase()
    };
  }
  function score(t,query) {
    const words=tokens(query);
    if (!words.length) return 0;
    const fields=[
      [t.name,5],[t.designer,3],[t.industry.join(' '),5],
      [t.style.join(' '),4],[t.features.join(' '),4],
      [t.tags.join(' '),4],[t.description.slice(0,1200),1]
    ];
    let total=0,matched=0;
    for (const word of words) {
      let best=0;
      for (const [value,weight] of fields) {
        const text=String(value).toLowerCase();
        const boundary=new RegExp('(^|[^a-z0-9])'+word+'([^a-z0-9]|$)');
        if(boundary.test(text)) best=Math.max(best,weight);
        else if (word.length>4 && text.includes(word)) best=Math.max(best,weight*0.5);
      }
      if(best) matched++;
      total+=best;
    }
    const ceiling=(query.match(/(?:under|below|less than|up to|max|budget of)\s*\$?\s*(\d+)/i)||[])[1];
    if(ceiling && t.price!=null && t.price>Number(ceiling)) return -Infinity;
    const moneyMatch=query.match(/\$\s*(\d+)/);
    if(!ceiling&&moneyMatch&&t.price!=null&&t.price>Number(moneyMatch[1])) return -Infinity;
    return matched ? total + (matched/words.length)*8 : 0;
  }
  function reason(t,q) {
    const terms=tokens(q);
    const hits=[...t.industry,...t.style,...t.features,...t.tags].filter(x=>terms.some(w=>String(x).toLowerCase().includes(w))).slice(0,3);
    return hits.length ? 'Matched: '+hits.join(' · ') : 'A possible fit based on the template description.';
  }
  mount.innerHTML="<section class=\"sqt-tm sqt-page-shell\" aria-label=\"Squarespace template finder\">\n  <header class=\"sqt-tm-head sqt-page-intro\">\n    <h1 class=\"sqt-page-title\">Find your next Squarespace template.</h1>\n    <p class=\"sqt-tm-dek sqt-page-dek\">Tell us what you're looking for. We'll find the best matches.</p>\n  </header>\n  <section class=\"sqt-tm-search-panel sqt-panel\">\n    <div class=\"sqt-panel__head\">Find a Template</div>\n    <div class=\"sqt-panel__body\">\n      <form class=\"sqt-tm-form\">\n        <label for=\"sqt-tm-query\">What are you looking for?</label>\n        <textarea id=\"sqt-tm-query\" rows=\"3\" maxlength=\"900\" placeholder=\"A minimal, editorial website for a wedding photographer under $200…\"></textarea>\n        <div class=\"sqt-tm-form-footer\">\n          <fieldset class=\"sqt-tm-filters\">\n            <legend class=\"sqt-tm-visually-hidden\">Template type</legend>\n            <label><input type=\"radio\" name=\"sqt-tm-source\" value=\"all\" checked><span>All templates</span></label>\n            <label><input type=\"radio\" name=\"sqt-tm-source\" value=\"native\"><span>Squarespace included</span></label>\n            <label><input type=\"radio\" name=\"sqt-tm-source\" value=\"third_party\"><span>Premium</span></label>\n          </fieldset>\n          <div class=\"sqt-tm-actions\"><button class=\"sqt-tm-submit\" type=\"submit\"><span>Find templates</span> <span aria-hidden=\"true\">→</span></button></div>\n        </div>\n        <span class=\"sqt-tm-status\" role=\"status\" aria-live=\"polite\">Loading templates…</span>\n        <div class=\"sqt-tm-progress\" aria-hidden=\"true\"><span></span></div>\n      </form>\n    </div>\n  </section>\n  <div class=\"sqt-tm-loading sqt-panel\" hidden role=\"status\" aria-live=\"polite\">\n    <span class=\"sqt-tm-spinner\" aria-hidden=\"true\"></span>\n    <div><strong>Finding your best matches…</strong><p>Comparing templates with your request.</p></div>\n    <div class=\"sqt-tm-loading-meter\" aria-hidden=\"true\"><span></span></div>\n  </div>\n  <div class=\"sqt-tm-results\" aria-live=\"polite\"></div>\n</section>";
  const form=mount.querySelector('form'), input=mount.querySelector('textarea');
  mount.querySelectorAll('input[name="sqt-tm-source"]').forEach(r=>r.addEventListener('change',e=>{sourceFilter=e.target.value;if(lastPrompt)form.requestSubmit();}));
  const status=mount.querySelector('.sqt-tm-status'), results=mount.querySelector('.sqt-tm-results');
  const loading=mount.querySelector('.sqt-tm-loading'), submitButton=mount.querySelector('.sqt-tm-submit');
  let requestId=0;
  function setBusy(busy){loading.hidden=!busy;loading.classList.toggle('is-loading',busy);status.classList.toggle('is-busy',busy);form.setAttribute('aria-busy',String(busy));submitButton.disabled=busy;submitButton.classList.toggle('is-busy',busy);submitButton.querySelector('span').textContent=busy?'Finding matches…':'Find templates';}
  function render(items,q) {
    lastResults=items;
    if(!items.length){results.innerHTML='<p>No strong matches found. Try broadening the description or removing a price limit.</p>';return;}
    results.innerHTML='<section class="sqt-tm-results-panel sqt-panel"><div class="sqt-panel__head">Your Shortlist</div><div class="sqt-panel__body"><div class="sqt-tm-results-head"><div><h2>Our recommendations</h2></div><p>Matched to your project, style and priorities.</p></div><div class="sqt-tm-grid">'+items.map((t,i)=>'<article class="sqt-tm-card">'+(t.image?'<img loading="lazy" alt="" src="'+safe(t.image)+'">':'<div class="sqt-tm-placeholder">Preview unavailable</div>')+'<div class="sqt-tm-meta"><span>0'+(i+1)+'</span>'+(t.sourceType==='native'?'<span>Included with Squarespace</span>':t.price!=null?'<span>
    results.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{const p=document.createElement('div');p.className='sqt-tm-placeholder';p.textContent='Preview being updated';img.replaceWith(p)},{once:true}));
  }
  async function matching(q) {
    let ranked=catalog.filter(t=>sourceFilter==='all'||t.sourceType===sourceFilter).map(t=>({t,score:score(t,q)})).filter(v=>v.score>0).sort((a,b)=>b.score-a.score).slice(0,MAX_RESULTS).map(v=>v.t);
    aiReasons = {};
    if (matchApi) {
      try {
        const res=await fetch(matchApi,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,candidates:catalog.filter(t=>sourceFilter==='all'||t.sourceType===sourceFilter).map(t=>({id:t.id,name:t.name,designer:t.designer,description:t.description.slice(0,350),industry:t.industry,style:t.style,features:t.features,tags:t.tags,price:t.price,image_url:t.image,source_type:t.sourceType})).sort((a,b)=>score(b,q)-score(a,q)).slice(0,18)})});
        if(res.ok) {const data=await res.json(); if(Array.isArray(data.matches)){for(const m of data.matches){if(m&&m.id&&m.reason)aiReasons[String(m.id)]=String(m.reason);}} if(Array.isArray(data.ids)){const byId=new Map(catalog.map(t=>[t.id,t]));const selected=data.ids.map(id=>byId.get(String(id))).filter(Boolean); if(selected.length) ranked=selected.slice(0,MAX_RESULTS);}}
      } catch(e) { /* fall back to local matching */ }
    }
    return ranked;
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();const q=input.value.trim();if(!catalog.length)return;
    if(q.length<4){input.focus();status.textContent='Tell us a little about the site you want.';return;}
    const current=++requestId;lastPrompt=q;setBusy(true);results.innerHTML='';status.textContent='Analyzing your brief…';
    try{const items=await matching(q);if(current!==requestId)return;setBusy(false);render(items,q);status.textContent=items.length+' recommendations';}
    catch(error){if(current!==requestId)return;setBusy(false);status.textContent='Could not finish matching. Please try again.';console.error('Template matching failed',error);}
  });
  if(!catalogUrl){status.textContent='Catalog URL not configured.';return;}
  fetch(catalogUrl,{credentials:'omit'}).then(async r=>{if(!r.ok)throw new Error('Catalog '+r.status);return r.json();}).then(data=>{
    const list=Array.isArray(data)?data:data.templates;
    if(!Array.isArray(list))throw new Error('Invalid catalog');
    catalog=list.map(normalize).filter(t=>t.status==='active'&&t.name!=='Untitled template');
    status.textContent=catalog.length+' templates available';
  }).catch(()=>{status.textContent='Template catalog unavailable. Please try again later.';});
})()+t.price+'</span>':'<span>Price on seller site</span>')+'</div><h4>'+safe(t.name)+'</h4><p class="sqt-tm-designer">'+safe(t.designer)+'</p><p>'+safe(aiReasons[t.id] || reason(t,q))+'</p><div class="sqt-tm-links">'+(t.detail?'<a href="'+safe(t.detail)+'">Details ↗</a>':'')+(t.demo?'<a href="'+safe(t.demo)+'" target="_blank" rel="noopener noreferrer">Live demo ↗</a>':'')+(t.product?'<a href="'+safe(t.product)+'" target="_blank" rel="sponsored noopener noreferrer">Get template ↗</a>':'')+'</div></article>').join('')+'</div></div></section>';
    results.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{const p=document.createElement('div');p.className='sqt-tm-placeholder';p.textContent='Preview being updated';img.replaceWith(p)},{once:true}));
  }
  async function matching(q) {
    let ranked=catalog.filter(t=>sourceFilter==='all'||t.sourceType===sourceFilter).map(t=>({t,score:score(t,q)})).filter(v=>v.score>0).sort((a,b)=>b.score-a.score).slice(0,MAX_RESULTS).map(v=>v.t);
    aiReasons = {};
    if (matchApi) {
      try {
        const res=await fetch(matchApi,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,candidates:catalog.filter(t=>sourceFilter==='all'||t.sourceType===sourceFilter).map(t=>({id:t.id,name:t.name,designer:t.designer,description:t.description.slice(0,350),industry:t.industry,style:t.style,features:t.features,tags:t.tags,price:t.price,image_url:t.image,source_type:t.sourceType})).sort((a,b)=>score(b,q)-score(a,q)).slice(0,18)})});
        if(res.ok) {const data=await res.json(); if(Array.isArray(data.matches)){for(const m of data.matches){if(m&&m.id&&m.reason)aiReasons[String(m.id)]=String(m.reason);}} if(Array.isArray(data.ids)){const byId=new Map(catalog.map(t=>[t.id,t]));const selected=data.ids.map(id=>byId.get(String(id))).filter(Boolean); if(selected.length) ranked=selected.slice(0,MAX_RESULTS);}}
      } catch(e) { /* fall back to local matching */ }
    }
    return ranked;
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();const q=input.value.trim();if(!catalog.length)return;
    if(q.length<4){input.focus();status.textContent='Tell us a little about the site you want.';return;}
    const current=++requestId;lastPrompt=q;setBusy(true);results.innerHTML='';status.textContent='Analyzing your brief…';
    try{const items=await matching(q);if(current!==requestId)return;setBusy(false);render(items,q);status.textContent=items.length+' recommendations';}
    catch(error){if(current!==requestId)return;setBusy(false);status.textContent='Could not finish matching. Please try again.';console.error('Template matching failed',error);}
  });
  if(!catalogUrl){status.textContent='Catalog URL not configured.';return;}
  fetch(catalogUrl,{credentials:'omit'}).then(async r=>{if(!r.ok)throw new Error('Catalog '+r.status);return r.json();}).then(data=>{
    const list=Array.isArray(data)?data:data.templates;
    if(!Array.isArray(list))throw new Error('Invalid catalog');
    catalog=list.map(normalize).filter(t=>t.status==='active'&&t.name!=='Untitled template');
    status.textContent=catalog.length+' templates available';
  }).catch(()=>{status.textContent='Template catalog unavailable. Please try again later.';});
})()