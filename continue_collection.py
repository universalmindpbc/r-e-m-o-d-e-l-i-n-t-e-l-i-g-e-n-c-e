import os,json,datetime,pathlib,time
from rmu_backend import pipeline
from rmu_backend.db import transaction
from rmu_backend.x_collection import collect_one
from rmu_backend.operations import export_snapshot
b=pathlib.Path(__file__).parent;mfile=b/'private/campaign-2022-runs.json';m=json.loads(mfile.read_text())
for l in (b.parent/'.env.local').read_text().splitlines():
 if l.startswith('X_API_BEARER_TOKEN='):os.environ['X_API_BEARER_TOKEN']=l.split('=',1)[1].strip().strip('\"\'')
# Keep the failed broad query's reservation held. Move only its unused allowance.
for r in m['runs']:
 if r['lane']=='cause':r['cap_cents']=1497
 if r['lane']=='diagnostic':r['cap_cents']=1000
with transaction() as c:
 for r in m['runs']:c.execute('UPDATE rmu.runs SET budget_cents=%s WHERE id=%s',(r['cap_cents'],r['run_id']))
assert sum(r['cap_cents'] for r in m['runs'])+3==5000
mfile.write_text(json.dumps(m,indent=2))
os.environ.update(RMU_X_COLLECTION_ENABLED='true',RMU_X_PRICE_VERIFIED_ON=datetime.datetime.now(datetime.timezone.utc).date().isoformat(),RMU_X_POST_PRICE_MICROUSD='5000',RMU_X_USER_PRICE_MICROUSD='10000',RMU_X_PAGE_SIZE='10',RMU_X_IDENTITIES=json.dumps(json.loads((b/'private/account-resolution.json').read_text())['identities']))
for r in m['runs']:
 if r['lane']=='cause':continue
 run=pipeline.get_run(r['run_id'])
 if run['status']=='complete':continue
 if run['status']=='needs_reconciliation':print(r['lane'],'paused');continue
 for i in range(100):
  try:result=collect_one(r['run_id'])
  except pipeline.Conflict as e:print(r['lane'],str(e),flush=True);break
  print(json.dumps({'lane':r['lane'],**result}),flush=True)
  if result['run_complete']:
   if pipeline.get_run(r['run_id'])['evidence_count']:
    pipeline.queue_measurement(r['run_id']);pipeline.process_one(r['run_id'])
   break
export_snapshot(b/'private'/('snapshot-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S')+'.json'))
print('Finished bounded collections; unreconciled reservations still held.')
