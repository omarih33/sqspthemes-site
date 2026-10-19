const ALLOWED=["achromatic", "adri", "agaro", "alameda", "alignflow", "almar", "altaloma", "amal", "anise", "auburn", "atlantic", "bailard", "balboa", "barbosa", "beaumont", "belisa", "bergen", "bleecker", "bloom", "bogart", "brower", "byron", "cailles", "camdez", "cami", "carmine", "carroll", "cedar", "chotto", "cimen", "clarkson", "clove", "clune", "cole", "colima", "colton", "comet", "condesa", "corrigan", "crosby", "cruz", "dario", "devoe", "eldridge", "elliott", "emmeline", "essex", "euclid", "falodu", "fayette", "fillmore", "fletcher", "florence", "forma", "galena", "gates", "gilden", "aue-sobol", "granger", "grove", "hales", "harbor", "harman", "hart", "grant", "hemlock", "hester", "hidano", "hawley", "hoyd", "idrah", "iduma", "irving", "hill", "jenani", "jotterpress", "juniper", "kearny", "keo", "kester", "kitui", "klipsan", "kusa", "lakshi", "laurie", "lenoix", "lexington", "loam", "looped", "lusaka", "maca", "malcolm", "malone", "manor", "manual", "maqueda", "mariana", "maru", "mason", "matsuya", "jasonwild", "merida", "meriden", "minetta", "minoru", "montclaire", "morais", "morena", "mycelium", "myhra", "nevins", "nolan", "noll", "novo", "ocotillo", "oranssi", "ortiz", "otroquest", "otto", "palermo", "palmer", "palmera", "paloma", "passero", "pazari", "pine", "pulaski", "quincy", "quinn", "radian", "randi", "mccurry", "rey", "rivoli", "reseda", "rotate", "roseti", "sackett", "sawyer", "saltless", "seen", "sellwood", "sidney", "singularity", "selene", "skyloop", "soony", "soria", "spotted", "souto", "stanton", "suhama", "sundew", "suffolk", "talva", "tantillo", "toledo", "transmission", "tresoire", "tepito", "troutman", "utica", "vandam", "ventura", "vance", "waverly", "wesley", "vester", "zaatar", "wycoff", "zorayda", "zion"];
import puppeteer from '@cloudflare/puppeteer';
export default {
 async fetch(request,env){
  if(request.method!=='POST'||request.headers.get('Authorization')!=='Bearer '+env.CAPTURE_TOKEN)return new Response('Not found',{status:404});
  const {slugs}=await request.json();
  if(!Array.isArray(slugs)||slugs.length>12||slugs.some(s=>!ALLOWED.includes(s)))return new Response('Invalid batch',{status:400});
  let browser;
  try {
   browser=await puppeteer.launch(env.BROWSER);
   const results=[];
   for(let i=0;i<slugs.length;i+=3){
    const chunk=await Promise.all(slugs.slice(i,i+3).map(async slug=>{
     const page=await browser.newPage();
     try{
      const url='https://'+slug+'-fluid-demo.squarespace.com/';
      await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
      const response=await page.goto(url,{waitUntil:'networkidle2',timeout:45000});
      await page.evaluate(async()=>{await document.fonts.ready; await Promise.all(Array.from(document.images).filter(im=>{const r=im.getBoundingClientRect();return r.top<1000&&r.bottom>0;}).map(im=>im.decode().catch(()=>{})));});
      await new Promise(r=>setTimeout(r,3000));
      const title=await page.title();const final_url=page.url();
      const pageInfo=await page.evaluate(()=>({text:document.body.innerText.slice(0,1000),image_count:document.images.length,ready_state:document.readyState}));
      if(response.status()!==200||!new URL(final_url).hostname.endsWith('.squarespace.com')||/website expired|website is expired|this website is private|website not available|site not found/i.test(pageInfo.text))return {slug,status:'needs_review',http_status:response.status(),final_url,title,pageInfo};
      const bytes=await page.screenshot({type:'webp',quality:80});
      const key='native/'+slug+'/2026-10-18.webp';await env.SCREENSHOTS.put(key,bytes,{httpMetadata:{contentType:'image/webp'}});
      const result={slug,status:'stored_pending_visual_review',http_status:response.status(),final_url,title,pageInfo,bytes:bytes.byteLength,key,captured_at:new Date().toISOString()};
      await env.SCREENSHOTS.put('_verification/'+slug+'.json',JSON.stringify(result),{httpMetadata:{contentType:'application/json'}});
      return result;
     }catch(e){return {slug,status:'capture_failed',error:String(e)}}finally{await page.close();}
    }));results.push(...chunk);
   }
   return Response.json(results);
  }catch(e){return Response.json({error:String(e)},{status:500})}finally{if(browser)await browser.close();}
 }
};
