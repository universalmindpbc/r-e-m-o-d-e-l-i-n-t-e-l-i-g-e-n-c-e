"""Operator-run CLF pilot. Durable caps include profiles; no automatic retry."""
import os,json,sys,datetime,pathlib,urllib.request,urllib.parse,urllib.error
from rmu_backend import pipeline
from rmu_backend.app import collection_preview
from rmu_backend.db import transaction
from rmu_backend.x_collection import collect_one
from rmu_backend.operations import export_snapshot
BASE=pathlib.Path(__file__).parent
for line in (BASE.parent/'.env.local').read_text().splitlines():
 if line.startswith('X_API_BEARER_TOKEN='):os.environ['X_API_BEARER_TOKEN']=line.split('=',1)[1].strip().strip('\"\'')
os.environ.update(RMU_X_COLLECTION_ENABLED='true',RMU_X_PRICE_VERIFIED_ON=datetime.datetime.now(datetime.timezone.utc).date().isoformat(),RMU_X_POST_PRICE_MICROUSD='5000',RMU_X_USER_PRICE_MICROUSD='10000')
identfile=BASE/'private/account-resolution.json'
if not identfile.exists():
 identfile.write_text(json.dumps({'state':'reserved','reserved_cents':2}));identfile.chmod(0o600)
 req=urllib.request.Request('https://api.x.com/2/users/by?usernames=rihanna,ClaraLionelFdn',headers={'Authorization':'Bearer '+os.environ['X_API_BEARER_TOKEN']})
 try:
  with urllib.request.urlopen(req,timeout=25) as response:data=json.load(response)
 except Exception:
  print('Account lookup uncertain; no retry');raise SystemExit(1)
 if data.get('errors') or len(data.get('data',[]))!=2:print('Identity lookup incomplete; stopped');raise SystemExit(1)
 ids={('talent' if u['username'].lower()=='rihanna' else 'organisation'):u['id'] for u in data['data']}
 identfile.write_text(json.dumps({'state':'received','reserved_cents':2,'identities':ids,'source':'X users/by'}))
ident=json.loads(identfile.read_text())
if ident['state']!='received':raise SystemExit('Resolve account lookup before retrying')
os.environ['RMU_X_IDENTITIES']=json.dumps(ident['identities'])
# Sum of allocations plus 1c counts + 2c identity lookup never exceeds $50.
plans=[('cause', '(@rihanna OR @ClaraLionelFdn OR "Clara Lionel Foundation" OR Rihanna) ("climate justice" OR sustainability OR "climate resilience") lang:en -is:retweet',2497),('talent','from:'+ident['identities']['talent']+' -is:retweet',1000),('organisation','from:'+ident['identities']['organisation']+' -is:retweet',1500)]
manifest=BASE/'private/campaign-2022-runs.json'
if not manifest.exists():
 runs=[]
 for lane,query,cap in plans:
  p=dict(query=query,start='2022-01-01',end='2022-04-30',mode='initial',idempotency_key='clf-2022-oct14-'+lane,campaign={'name':'Clara Lionel Foundation (CLF)','talent':'Rihanna','agency':'WME','topics':['@rihanna','@ClaraLionelFdn','climate justice','sustainability'],'settings_version':2},evidence_lane=lane,source_type='observed')
  r=pipeline.create_run(p,collection_preview({k:p[k] for k in ['query','start','end','mode']}));rid=str(r['id'])
  with transaction() as conn:conn.execute('UPDATE rmu.runs SET budget_cents=%s WHERE id=%s AND reserved_cents=0 AND charged_cents=0',(cap,rid))
  runs.append({'lane':lane,'run_id':rid,'cap_cents':cap})
 manifest.write_text(json.dumps({'total_cap_cents':5000,'access_reserved_cents':3,'runs':runs},indent=2));manifest.chmod(0o600)
records=json.loads(manifest.read_text())
assert sum(x['cap_cents'] for x in records['runs'])+records['access_reserved_cents']<=5000
mode=sys.argv[1] if len(sys.argv)>1 else 'pilot'
for entry in records['runs']:
 if mode=='pilot' and entry['lane']!='cause':continue
 rid=entry['run_id'];run=pipeline.get_run(rid)
 if run['status']=='needs_reconciliation':raise SystemExit('A provider outcome needs reconciliation; stopped')
 if run['status']=='complete':print(entry['lane'],'already complete');continue
 if mode=='pilot' and run['reserved_cents']>0:raise SystemExit('Pilot already sent; inspect it before continuation')
 while True:
  result=collect_one(rid);print(json.dumps({'lane':entry['lane'],**result}),flush=True)
  export_snapshot(BASE/'private'/('snapshot-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')+'.json'))
  if result['run_complete'] or mode=='pilot':break
 if result['run_complete'] and pipeline.get_run(rid)['evidence_count']:
  pipeline.queue_measurement(rid);pipeline.process_one(rid)
print('Collection invocation finished. Provider reservations remain held until billing reconciliation.')
