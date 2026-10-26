import csv,io,json
from pathlib import Path
from rmu_backend.exports import export_run
from rmu_backend.db import transaction
from rmu_backend.inference import validate_classifications
with transaction() as c:
 rows=list(c.execute("SELECT id,run_id,state,request_hash,prompt_hash FROM rmu.model_requests ORDER BY created_at"))
 print('requests', {s:sum(r['state']==s for r in rows) for s in set(r['state'] for r in rows)})
 print('coverage',list(c.execute("SELECT r.evidence_lane,count(DISTINCT ro.observation_id) posts,count(DISTINCT cl.id) labels FROM rmu.runs r JOIN rmu.run_observations ro ON ro.run_id=r.id LEFT JOIN rmu.classifications cl ON cl.observation_id=ro.observation_id WHERE r.source_type='observed' GROUP BY r.evidence_lane")))
 for r in rows:
  if r['state']!='received':continue
  p=Path('private')/('model-response-'+str(r['id'])+'.json')
  if not p.exists():continue
  response=json.loads(p.read_text())['response']; out=json.loads(''.join(x['text'] for o in response.get('output',[]) if o.get('type')=='message' for x in o.get('content',[]) if x.get('type')=='output_text'))
  ids=list({x['record_id'] for x in out['classifications']})
  records=[{'record_id':str(x['id']),'text':x['text_content']} for x in c.execute('SELECT id,text_content FROM rmu.observations WHERE id=ANY(%s::uuid[])',(ids,))]
  try:validate_classifications(out,records);error='none'
  except ValueError as e:error=str(e)
  print('unvalidated',str(r['id']),len(records),error)
for rid in ['feabb527-f5f0-4dfc-ac5d-78220dfdd107','babb5680-97a6-481a-b268-8751a2a41320']:
 e=export_run(rid);rows=list(csv.DictReader(io.StringIO(e['content'].decode('utf-8-sig'))));assert len(rows)==e['rows'];assert all(row['post_id'].isdigit() for row in rows)
 print('export',e['rows'],len(rows[0]),sum(x['classification_status']=='requires_review' for x in rows))
