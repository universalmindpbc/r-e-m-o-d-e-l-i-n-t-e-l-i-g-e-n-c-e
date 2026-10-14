import os,json,datetime,pathlib
from rmu_backend.app import collection_preview
from rmu_backend import pipeline
from rmu_backend.db import transaction
from rmu_backend.x_collection import collect_one
base=pathlib.Path(__file__).parent
for line in (base.parent/'.env.local').read_text().splitlines():
 if line.startswith('X_API_BEARER_TOKEN='):os.environ['X_API_BEARER_TOKEN']=line.split('=',1)[1].strip().strip('\"\'')
manifest=json.loads((base/'private/campaign-2022-runs.json').read_text())
# Reallocate $1 of the original cause allowance for diagnostics; total cap stays $50.
cause=manifest['runs'][0]
with transaction() as c:c.execute('UPDATE rmu.runs SET budget_cents=2397 WHERE id=%s',(cause['run_id'],))
cause['cap_cents']=2397
p={'query':'(rihanna OR ClaraLionelFdn) ("climate justice" OR sustainability) lang:en -is:retweet','start':'2022-01-01','end':'2022-04-30','mode':'test','idempotency_key':'clf-2022-oct14-partial-diagnostic','campaign':{'name':'Clara Lionel Foundation (CLF)'},'evidence_lane':'cause','source_type':'observed'}
r=pipeline.create_run(p,collection_preview({k:p[k] for k in ['query','start','end','mode']}));rid=str(r['id'])
with transaction() as c:c.execute('UPDATE rmu.runs SET budget_cents=100 WHERE id=%s',(rid,))
if not any(x['run_id']==rid for x in manifest['runs']):manifest['runs'].append({'lane':'diagnostic','run_id':rid,'cap_cents':100})
(base/'private/campaign-2022-runs.json').write_text(json.dumps(manifest,indent=2))
assert sum(x['cap_cents'] for x in manifest['runs'])+3==5000
os.environ.update(RMU_X_COLLECTION_ENABLED='true',RMU_X_PRICE_VERIFIED_ON=datetime.datetime.now(datetime.timezone.utc).date().isoformat(),RMU_X_POST_PRICE_MICROUSD='5000',RMU_X_USER_PRICE_MICROUSD='10000',RMU_X_PAGE_SIZE='10',RMU_X_IDENTITIES=json.dumps(json.loads((base/'private/account-resolution.json').read_text())['identities']))
try:print(collect_one(rid))
except pipeline.Conflict as e:print(str(e))
for file in sorted((base/'private').glob('x-response-*.json')):
 d=json.loads(file.read_text())['response'];print(json.dumps({'post_count':len(d.get('data',[])),'profile_count':len(d.get('includes',{}).get('users',[])),'errors':d.get('errors'),'meta':d.get('meta')}))
