#!/usr/bin/env python3
"""Apply only screenshots that passed demo, delivery, and visual verification."""
import argparse,datetime,json,pathlib
parser=argparse.ArgumentParser();parser.add_argument('--require-complete',action='store_true');args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];reports=root/'reports/template-screenshots-2026-10-18'
read=lambda p:json.loads(p.read_text())
catalog=read(root/'template-catalog.json');audit=read(root/'template-catalog-audit-2026-10-18.json')
demos={r['id']:r for r in read(reports/'demo-verification.json')};delivery={r['slug']:r for r in read(reports/'delivery-verification.json')};visual=read(reports/'visual-review.json')
passed=set(visual['passed'])-set(visual['needs_recapture']);verified={}
for row in catalog['templates']:
 if row['source_type']!='native':continue
 slug=row['id'][7:];d=demos[row['id']];image=delivery.get(slug,{})
 if d['demo_status']!='working' or not image.get('delivery_verified') or slug not in passed:continue
 row['image_url']=image['url'];row['screenshot_verification']={'status':'verified','captured_on':'2026-10-18','source_url':d['original_demo_url'],'final_demo_url':d['final_url'],'demo_http_status':d['http_status'],'width':image['width'],'height':image['height'],'format':'webp','bytes':image['bytes'],'sha256':image['sha256'],'visual_review':'passed'};verified[row['id']]=row
if args.require_complete:assert len(verified)==172,f'Only {len(verified)}/172 are fully verified'
for row in audit['native_screenshot_queue']:
 if row['id'] in verified:
  t=verified[row['id']];row.update(screenshot_status='verified',verified_image_url=t['image_url'],screenshot_sha256=t['screenshot_verification']['sha256'],demo_http_status=200,checked_on='2026-10-18')
unresolved=[r['id'] for r in audit['native_screenshot_queue'] if r['id'] not in verified]
summary={'verified_on':'2026-10-18','scope':172,'verified_screenshots':len(verified),'unresolved_ids':unresolved,'pilot_ids':[r['id'] for r in audit['native_screenshot_queue'][:10]],'pilot_status':'passed','r2_bucket':'sqspthemes-template-screenshots','permanent_image_host':'https://sqspthemes-template-images.omari-6b8.workers.dev','total_bytes':sum(t['screenshot_verification']['bytes'] for t in verified.values()),'report_directory':'reports/template-screenshots-2026-10-18','affiliate_attribution':'unchanged; not verified by screenshot recovery'}
audit['screenshot_recovery']=summary
audit['summary']['native_screenshots']=f"{len(verified)}/172 real demo captures verified, visually reviewed, and stored in R2; {len(unresolved)} unresolved."
catalog['version']='2026-10-18-native-screenshot-recovery';catalog['warning']=f"Native demo URLs verified on 2026-10-18; {len(verified)}/172 native screenshots recovered and verified. Historical affiliate attribution remains unverified."
(root/'template-catalog.json').write_text(json.dumps(catalog,separators=(',',':'),ensure_ascii=False)+'\n')
(root/'template-catalog-audit-2026-10-18.json').write_text(json.dumps(audit,indent=2,ensure_ascii=False)+'\n')
(reports/'recovery-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(reports/'discontinued-templates.json').write_text(json.dumps({'checked_on':'2026-10-18','confirmed_discontinued':[],'unavailable_original_demos':[r for r in demos.values() if r['demo_status']=='unavailable'],'needs_review':[r for r in demos.values() if r['demo_status']=='needs_review'],'note':'All original demo URLs were checked. A working demo does not independently verify inclusion in the current Squarespace template gallery. No template was classified as discontinued merely because a screenshot attempt failed.'},indent=2)+'\n')
print(f'Applied {len(verified)}/172 verified screenshots; {len(unresolved)} unresolved.')
