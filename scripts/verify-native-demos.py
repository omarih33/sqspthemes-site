#!/usr/bin/env python3
"""Verify original native demo URLs without changing catalog or affiliate links."""
import concurrent.futures, datetime, html, json, pathlib, re, urllib.request, urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/template-screenshots-2026-10-18/demo-verification.json'
queue=json.loads((ROOT/'template-catalog-audit-2026-10-18.json').read_text())['native_screenshot_queue']
def check(row):
    result={'id':row['id'],'name':row['name'],'original_demo_url':row['demo_url'],'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    for attempt in range(2):
        try:
            req=urllib.request.Request(row['demo_url'],headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req,timeout=30) as r:
                text=r.read().decode('utf-8','replace')
                title=re.search(r'<title[^>]*>(.*?)</title>',text,re.S|re.I)
                result.update(http_status=r.status,final_url=r.url,title=html.unescape(title.group(1).strip()) if title else '',html_bytes=len(text.encode()),squarespace_context='Static.SQUARESPACE_CONTEXT' in text)
                errors=['website expired','website is expired','website not available','site not found','this website is private','this site is private']
                visible=re.sub('<[^>]+>',' ',text).lower()
                result['error_page_signals']=[s for s in errors if s in visible]
                result['demo_status']='working' if r.status==200 and result['squarespace_context'] and not result['error_page_signals'] else 'needs_review'
                return result
        except urllib.error.HTTPError as e:
            result.update(http_status=e.code,final_url=e.url,error=str(e),demo_status='unavailable' if e.code in (404,410) else 'needs_review')
        except Exception as e: result.update(error=str(e),demo_status='needs_review')
    return result
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for r in pool.map(check,queue):
        results.append(r); OUT.write_text(json.dumps(results,indent=2)+'\n');print(r['id'],r['demo_status'],r.get('http_status'),flush=True)
