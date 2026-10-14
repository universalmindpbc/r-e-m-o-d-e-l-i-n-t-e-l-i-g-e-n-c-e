"""Recover a fully captured provider response without another paid request."""
import json,pathlib,os,datetime
from psycopg.types.json import Jsonb
from rmu_backend.pipeline import digest,normalize,insert_observation
from rmu_backend.db import transaction
from rmu_backend.cohorts import classify_author
b=pathlib.Path(__file__).parent
for f in sorted((b/'private').glob('x-response-*.json'),key=lambda p:p.stat().st_mtime):
 saved=json.loads(f.read_text());p=saved['response'];params=saved['params']
 if p.get('errors') or not isinstance(p.get('data',[]),list):continue
 if saved['workspace_id']!=os.environ['RMU_WORKSPACE_ID']:continue
 with transaction() as c:
  page=c.execute("SELECT * FROM rmu.collection_pages WHERE request_key=%s AND state='uncertain' FOR UPDATE",(digest(params),)).fetchone()
  if not page:continue
  run=c.execute('SELECT * FROM rmu.runs WHERE id=%s FOR UPDATE',(page['run_id'],)).fetchone()
  retrieved=datetime.datetime.fromtimestamp(f.stat().st_mtime,datetime.timezone.utc).isoformat()
  profiles={u['id']:u for u in p.get('includes',{}).get('users',[])}
  raw=p.get('data',[])
  assert len(raw)<=params['max_results'] and len(profiles)<=params['max_results']
  ids=json.loads((b/'private/account-resolution.json').read_text())['identities']
  for item in raw:
   post=normalize({**{k:item[k] for k in ['id','author_id','created_at','text','lang','public_metrics','referenced_tweets'] if k in item},'retrieved_at':retrieved})
   insert_observation(c,run['workspace_id'],run,post,'X API developer agreement; 30-day operator demo retention')
   cohort=classify_author(profiles.get(post['author_id'],{'id':post['author_id']}),post['text'],ids)
   cohort['profile_retrieved_at']=retrieved
   c.execute("UPDATE rmu.observations SET cohort=%s,cohort_evidence=%s WHERE provider='x' AND source_type='observed' AND post_id=%s AND retrieved_at=%s",(cohort['label'],Jsonb(cohort),post['id'],post['retrieved_at']))
  cursor=p.get('meta',{}).get('next_token');assert cursor is None or isinstance(cursor,str)
  checkpoint={'next_token':cursor,'returned_posts':len(raw),'returned_profiles':len(profiles),'estimated_cost_microusd':len(raw)*5000+len(profiles)*10000,'retrieved_at':retrieved,'response_hash':digest(p),'recovered_from_private_response':True}
  c.execute("UPDATE rmu.collection_pages SET state='received',checkpoint=%s WHERE id=%s",(Jsonb(checkpoint),page['id']))
  c.execute("UPDATE rmu.runs SET status=%s WHERE id=%s",('running' if cursor else 'complete',run['id']))
  print('Recovered saved response without provider request:',str(run['id']),len(raw),'posts',flush=True)
print('Response recovery scan finished')
