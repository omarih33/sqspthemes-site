/* SQSPThemes — Third-party Squarespace template browser
   Self-contained; uses the published GitHub catalog and never mutates Squarespace collections. */
(function(){
"use strict";
const root=document.getElementById("sqt-template-browser");
if(!root || root.dataset.init==="1")return;
root.dataset.init="1";
const source=root.dataset.catalogUrl;
const groups=[
 ["All templates",[]],
 ["Business & services",["service","business","entrepreneur","startup"]],
 ["Coaches & consultants",["coach","consultant","speaker"]],
 ["Photography & video",["photograph","videograph","visual creator","boutique video"]],
 ["Shops & ecommerce",["ecommerce","online store","shop","fashion","jewlery"]],
 ["Portfolios & creatives",["portfolio","creative","artist","designer","branding"]],
 ["Agencies & marketing",["agency","marketing","web design"]],
 ["Wellness & fitness",["wellness","fitness","therapist","nutrition","yoga","health"]],
 ["Blogs & publishing",["blogger","author","content creation","podcast"]],
 ["Food & hospitality",["restuarant","restaurant","food and drink","travel"]]
];
const legacy={"service business":"Business & services","coaches":"Coaches & consultants","photographers":"Photography & video","ecommerce":"Shops & ecommerce","portfolio":"Portfolios & creatives","restaurants":"Food & hospitality","blog":"Blogs & publishing","one page":"All templates"};
const safe=x=>String(x==null?"":x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const link=x=>{try{let u=new URL(x,location.origin);return ["https:","http:"].includes(u.protocol)?u.href:""}catch{return ""}};
const norm=x=>String(x||"").toLowerCase().trim().replace(/[-–—]+/g," ").replace(/\s+/g," ");
const matchesGroup=(t,group)=>!group || group==="All templates" || (groups.find(g=>g[0]===group)?.[1]||[]).some(k=>(t.categories||[]).some(c=>norm(c).includes(k)));
const priceOf=t=>Number.isFinite(Number(t.price))&&t.price!==null&&t.price!==""?Number(t.price):null;
let list=[],visible=[],page=1;
const params=new URLSearchParams(location.search);
const legacyCategory=params.get("choose-a-category");
let state={q:params.get("q")||"",category:params.get("category")||(legacyCategory?(legacy[norm(legacyCategory)]||"All templates"):"All templates"),sort:params.get("sort")||"az",price:params.get("price")||"any"};
if(!groups.some(x=>x[0]===state.category))state.category="All templates";
const html='<nav class="sqt-template-switch" aria-label="Template navigation"><a href="/templates" aria-current="page">Browse Templates</a><a href="/find-templates">Find Templates</a></nav>'
+'<div class="sqt-dir-top"><div><h2>Browse Squarespace templates.</h2><p>Explore independent designers, compare prices, and find a design that fits your project.</p></div></div>'
+'<div class="sqt-dir-sticky-sentinel" aria-hidden="true"></div><div class="sqt-dir-controls"><label class="sqt-dir-search-label" for="sqt-dir-q">Search templates<input type="search" id="sqt-dir-q" placeholder="Search names, designers, styles…" autocomplete="off"></label>'
+'<label>Category<select id="sqt-dir-cat"></select></label><label>Price<select id="sqt-dir-price"><option value="any">Any price</option><option value="under100">Under $100</option><option value="100to249">$100–$249</option><option value="250plus">$250+</option></select></label>'
+'<label>Sort by<select id="sqt-dir-sort"><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label><button type="button" class="sqt-dir-filter-toggle" aria-expanded="false" aria-label="Show category, price, and sort filters">Filters ▾</button></div>'
+'<div class="sqt-dir-tools"><span class="sqt-dir-count" role="status" aria-live="polite">Loading templates…</span><button type="button" class="sqt-dir-clear">Clear filters</button></div>'
+'<div class="sqt-dir-grid"></div><div class="sqt-dir-bottom"><button type="button" class="sqt-dir-more" hidden>Show more templates ↓</button></div>';
root.innerHTML=html;
const $=sel=>root.querySelector(sel),query=$("#sqt-dir-q"),cat=$("#sqt-dir-cat"),price=$("#sqt-dir-price"),sort=$("#sqt-dir-sort"),grid=$(".sqt-dir-grid"),count=$(".sqt-dir-count"),more=$(".sqt-dir-more");
cat.innerHTML=groups.map(([name])=>'<option value="'+safe(name)+'">'+safe(name)+'</option>').join("");
query.value=state.q;cat.value=state.category;price.value=state.price;sort.value=state.sort;

/* Sticky directory controls: compact on small screens once scrolled. */
const controls=$(".sqt-dir-controls"), sentinel=$(".sqt-dir-sticky-sentinel"), filterToggle=$(".sqt-dir-filter-toggle");
function setFiltersOpen(open){
  controls.classList.toggle("filters-open",open);
  filterToggle.setAttribute("aria-expanded",String(open));
  filterToggle.textContent=open?"Close filters ↑":"Filters ▾";
  filterToggle.setAttribute("aria-label",open?"Hide category, price, and sort filters":"Show category, price, and sort filters");
}
filterToggle.addEventListener("click",()=>setFiltersOpen(!controls.classList.contains("filters-open")));
function stickyTop(){
  const header=document.querySelector("#sqt-header") || document.querySelector("#header");
  if(!header)return 0;
  const position=getComputedStyle(header).position;
  if(position!=="sticky" && position!=="fixed")return 0;
  const box=header.getBoundingClientRect();
  return box.bottom>0 ? Math.max(0,Math.min(160,Math.ceil(box.height))) : 0;
}
let stickyPending=false;
function syncSticky(){
  stickyPending=false;
  const top=stickyTop();
  root.style.setProperty("--sqt-dir-sticky-top",top+"px");
  const stuck=sentinel.getBoundingClientRect().bottom <= top+1;
  const wasStuck=controls.classList.contains("is-stuck");
  controls.classList.toggle("is-stuck",stuck);
  if(wasStuck && !stuck)setFiltersOpen(false);
}
function scheduleSticky(){
  if(stickyPending)return;
  stickyPending=true;
  requestAnimationFrame(syncSticky);
}
window.addEventListener("scroll",scheduleSticky,{passive:true});
window.addEventListener("resize",scheduleSticky,{passive:true});
scheduleSticky();

function updateUrl(){const p=new URLSearchParams();if(state.q)p.set("q",state.q);if(state.category!=="All templates")p.set("category",state.category);if(state.price!=="any")p.set("price",state.price);if(state.sort!=="az")p.set("sort",state.sort);history.replaceState(null,"",location.pathname+(p.toString()?"?"+p:"")+location.hash)}
function card(t){const details=link(t.detail_url),image=link(t.image_url),shop=link(t.product_url),price=priceOf(t);
return '<article class="sqt-dir-card">'+(details?'<a class="sqt-dir-image" href="'+safe(details)+'" aria-label="View '+safe(t.name)+' details">':'<div class="sqt-dir-image">')
+(image?'<img loading="lazy" src="'+safe(image)+'" alt="Preview of '+safe(t.name)+' Squarespace template">':'<span>Preview unavailable</span>')
+(details?'</a>':'</div>')+'<div class="sqt-dir-meta"><span>'+safe(t.designer||"Independent designer")+'</span><span>'+ (price!==null?"$"+price.toLocaleString("en-US"):"Price on request") +'</span></div>'
+'<h3>'+(details?'<a href="'+safe(details)+'">'+safe(t.name)+'</a>':safe(t.name))+'</h3><div class="sqt-dir-links">'+(details?'<a href="'+safe(details)+'">View details →</a>':'')+(shop?'<a href="'+safe(shop)+'" rel="noopener sponsored" target="_blank">Visit shop ↗</a>':'')+'</div></article>'}
function refine(){const words=norm(state.q).split(/\s+/).filter(Boolean);visible=list.filter(t=>{const p=priceOf(t);if(!matchesGroup(t,state.category))return false;if(state.price==="under100"&&(p===null||p>=100))return false;if(state.price==="100to249"&&(p===null||p<100||p>=250))return false;if(state.price==="250plus"&&(p===null||p<250))return false;const text=norm([t.name,t.title,t.designer,...(t.categories||[]),...(t.tags||[]),t.description].join(" "));return words.every(w=>text.includes(w))});
visible.sort((a,b)=>{const pa=priceOf(a),pb=priceOf(b);if(state.sort==="low")return(pa??Infinity)-(pb??Infinity)||a.name.localeCompare(b.name);if(state.sort==="high")return(pb??-1)-(pa??-1)||a.name.localeCompare(b.name);return state.sort==="za"?b.name.localeCompare(a.name):a.name.localeCompare(b.name)});
page=1;draw();updateUrl()}
function draw(){const n=Math.min(visible.length,page*24);grid.innerHTML=visible.slice(0,n).map(card).join("")||'<p class="sqt-dir-empty">No templates match these filters. Try another category or search.</p>';grid.querySelectorAll("img").forEach(img=>img.addEventListener("error",()=>{img.style.display="none";img.parentElement.classList.add("sqt-dir-broken")},{once:true}));count.textContent=visible.length+' templates found';more.hidden=n>=visible.length;more.textContent='Show more templates ('+(visible.length-n)+' remaining) ↓'}
query.addEventListener("input",()=>{state.q=query.value.trim();refine()});
cat.addEventListener("change",()=>{state.category=cat.value;refine()});
price.addEventListener("change",()=>{state.price=price.value;refine()});
sort.addEventListener("change",()=>{state.sort=sort.value;refine()});
$(".sqt-dir-clear").addEventListener("click",()=>{state={q:"",category:"All templates",sort:"az",price:"any"};query.value="";cat.value=state.category;price.value=state.price;sort.value=state.sort;refine()});
more.addEventListener("click",()=>{page++;draw()});
document.addEventListener("click",event=>{const a=event.target.closest(".sqsp-template-card a[href*='choose-a-category']");if(!a||!list.length)return;try{const u=new URL(a.href,location.href),v=u.searchParams.get("choose-a-category");if(!v)return;event.preventDefault();state.category=legacy[norm(v)]||"All templates";cat.value=state.category;refine();root.scrollIntoView({behavior:"smooth",block:"start"})}catch{}});
if(!source){count.textContent="Catalog is not configured.";return}
fetch(source,{credentials:"omit"}).then(r=>{if(!r.ok)throw Error("Catalog HTTP "+r.status);return r.json()}).then(data=>{list=(Array.isArray(data)?data:data.templates||[]).filter(t=>t.source_type==="third_party"&&t.status==="active");refine();root.dataset.ready="true"}).catch(error=>{console.error("SQSPThemes directory load failed",error);count.textContent="Templates couldn't load. Please refresh this page."});
})();