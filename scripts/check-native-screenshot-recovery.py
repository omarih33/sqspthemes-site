#!/usr/bin/env python3
"""Check recovery completeness and prevent changes to third-party or affiliate data."""
import argparse, hashlib, json, pathlib, subprocess
p=argparse.ArgumentParser();p.add_argument('--base-ref',default='HEAD');args=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];report=root/'reports/template-screenshots-2026-10-18'
base=json.loads(subprocess.check_output(['git','show',args.base_ref+':template-catalog.json'],cwd=root))
current=json.loads((root/'template-catalog.json').read_text())
old={t['id']:t for t in base['templates']};new={t['id']:t for t in current['templates']}
assert list(old)==list(new),'Catalog identity/order changed'
assert len(new)==576 and current['source_counts']==base['source_counts']
assert [t for t in base['templates'] if t['source_type']=='third_party']==[t for t in current['templates'] if t['source_type']=='third_party'],'Third-party entries changed'
demos={t['id']:t for t in json.loads((report/'demo-verification.json').read_text())}
delivery={t['slug']:t for t in json.loads((report/'delivery-verification.json').read_text())}
visual=json.loads((report/'visual-review.json').read_text())
assert not visual['needs_recapture'],'Visual review incomplete'
checks=[]
for id,t in new.items():
 if t['source_type']!='native':continue
 slug=id[7:];prior=old[id]
 assert {k:v for k,v in t.items() if k not in ('image_url','screenshot_verification')}=={k:v for k,v in prior.items() if k not in ('image_url','screenshot_verification')},id+' non-image fields changed'
 assert demos[id]['demo_status']=='working' and demos[id]['http_status']==200,id+' demo not verified'
 assert delivery[slug]['delivery_verified'] and slug in visual['passed'],id+' image not reviewed'
 assert t['image_url']==delivery[slug]['url'] and t['screenshot_verification']['sha256']==delivery[slug]['sha256']
 assert t['screenshot_verification']['status']=='verified'
 checks.append(delivery[slug]['sha256'])
assert len(checks)==172 and len(set(checks))==172,'Missing or duplicate captures'
print('PASS: 172 native screenshots verified; 404 third-party entries identical; all existing links, order, and non-image fields preserved.')
