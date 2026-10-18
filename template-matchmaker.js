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
  const catalogUrl = mount.dataset.catalogUrl;
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
      image:absoluteUrl(get(t,'image_url','Image_url','image','thumbnail')),
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
  mount.innerHTML='<section class="sqt-tm"><div class="sqt-tm-head"><span>TEMPLATE MATCHMAKER / 02</span><h2>Describe your ideal website.</h2><p>Tell us what you are building, your preferred style, and what matters most.</p></div><form class="sqt-tm-form"><label for="sqt-tm-query">What kind of template do you need?</label><textarea id="sqt-tm-query" rows="3" placeholder="A minimalist website for a therapist with online booking, warm colors, and a budget under $200"></textarea><div class="sqt-tm-filters" role="group" aria-label="Template source"><label><input type="radio" name="sqt-tm-source" value="all" checked> All templates</label><label><input type="radio" name="sqt-tm-source" value="native"> Squarespace included</label><label><input type="radio" name="sqt-tm-source" value="third_party"> Premium</label></div><div class="sqt-tm-actions"><button type="submit">Find my templates →</button><span class="sqt-tm-status" role="status" aria-live="polite">Loading catalog…</span></div></form><div class="sqt-tm-results" aria-live="polite"></div></section>';
  const form=mount.querySelector('form'), input=mount.querySelector('textarea');
  mount.querySelectorAll('input[name="sqt-tm-source"]').forEach(r=>r.addEventListener('change',e=>{sourceFilter=e.target.value;if(lastPrompt)form.requestSubmit();}));
  const status=mount.querySelector('.sqt-tm-status'), results=mount.querySelector('.sqt-tm-results');
  function render(items,q) {
    lastResults=items;
    if(!items.length){results.innerHTML='<p>No strong matches found. Try broadening the description or removing a price limit.</p>';return;}
    results.innerHTML='<h3>Recommended templates</h3><div class="sqt-tm-grid">'+items.map((t,i)=>'<article class="sqt-tm-card">'+(t.image?'<img loading="lazy" alt="" src="'+safe(t.image)+'">':'<div class="sqt-tm-placeholder">Preview unavailable</div>')+'<div class="sqt-tm-meta"><span>0'+(i+1)+'</span>'+(t.sourceType==='native'?'<span>Included with Squarespace</span>':t.price!=null?'<span>+'</div><h4>'+safe(t.name)+'</h4><p class="sqt-tm-designer">'+safe(t.designer)+'</p><p>'+safe(aiReasons[t.id] || reason(t,q))+'</p><div class="sqt-tm-links">'+(t.detail?'<a href="'+safe(t.detail)+'">Details ↗</a>':'')+(t.demo?'<a href="'+safe(t.demo)+'" target="_blank" rel="noopener noreferrer">Live demo ↗</a>':'')+(t.product?'<a href="'+safe(t.product)+'" target="_blank" rel="sponsored noopener noreferrer">Get template ↗</a>':'')+'</div></article>').join('')+'</div>';
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
    e.preventDefault();const q=input.value.trim();if(!q||!catalog.length)return;
    lastPrompt=q;status.textContent='Finding matches…';
    const items=await matching(q);if(q!==lastPrompt)return;
    render(items,q);status.textContent=items.length+' matches';
  });
  if(!catalogUrl){status.textContent='Catalog URL not configured.';return;}
  fetch(catalogUrl,{credentials:'omit'}).then(async r=>{if(!r.ok)throw new Error('Catalog '+r.status);return r.json();}).then(data=>{
    const list=Array.isArray(data)?data:data.templates;
    if(!Array.isArray(list))throw new Error('Invalid catalog');
    catalog=list.map(normalize).filter(t=>t.status==='active'&&t.name!=='Untitled template');
    status.textContent=catalog.length+' templates ready (native and premium)';
  }).catch(()=>{status.textContent='Template catalog unavailable. Please try again later.';});
})();+t.price+'</span>':'<span>Price on seller site</span>')+'</div><h4>'+safe(t.name)+'</h4><p class="sqt-tm-designer">'+safe(t.designer)+'</p><p>'+safe(reason(t,q))+'</p><div class="sqt-tm-links">'+(t.detail?'<a href="'+safe(t.detail)+'">Details ↗</a>':'')+(t.demo?'<a href="'+safe(t.demo)+'" target="_blank" rel="noopener noreferrer">Live demo ↗</a>':'')+(t.product?'<a href="'+safe(t.product)+'" target="_blank" rel="sponsored noopener noreferrer">Get template ↗</a>':'')+'</div></article>').join('')+'</div>';
  }
  async function matching(q) {
    let ranked=catalog.map(t=>({t,score:score(t,q)})).filter(v=>v.score>0).sort((a,b)=>b.score-a.score).slice(0,MAX_RESULTS).map(v=>v.t);
    if (matchApi) {
      try {
        const res=await fetch(matchApi,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,candidates:catalog.map(t=>({id:t.id,name:t.name,designer:t.designer,description:t.description.slice(0,550),industry:t.industry,style:t.style,features:t.features,tags:t.tags,price:t.price})).filter(t=>score(t,q)>0).slice(0,35)})});
        if(res.ok) {const data=await res.json(); if(Array.isArray(data.ids)){const byId=new Map(catalog.map(t=>[t.id,t]));const selected=data.ids.map(id=>byId.get(String(id))).filter(Boolean); if(selected.length) ranked=selected.slice(0,MAX_RESULTS);}}
      } catch(e) { /* fall back to local matching */ }
    }
    return ranked;
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();const q=input.value.trim();if(!q||!catalog.length)return;
    lastPrompt=q;status.textContent='Finding matches…';
    const items=await matching(q);if(q!==lastPrompt)return;
    render(items,q);status.textContent=items.length+' matches';
  });
  if(!catalogUrl){status.textContent='Catalog URL not configured.';return;}
  fetch(catalogUrl,{credentials:'omit'}).then(async r=>{if(!r.ok)throw new Error('Catalog '+r.status);return r.json();}).then(data=>{
    const list=Array.isArray(data)?data:data.templates;
    if(!Array.isArray(list))throw new Error('Invalid catalog');
    catalog=list.map(normalize).filter(t=>t.status==='active'&&t.name!=='Untitled template');
    status.textContent=catalog.length+' templates ready';
  }).catch(()=>{status.textContent='Template catalog unavailable. Please try again later.';});
})();