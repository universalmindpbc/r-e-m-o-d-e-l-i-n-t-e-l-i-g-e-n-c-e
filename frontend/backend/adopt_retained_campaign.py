"""One-time migration of the approved retained CLF evidence into the new dashboard workflow. No new X reads."""
import json,os
from psycopg.types.json import Jsonb
from rmu_backend import pipeline
from rmu_backend.db import transaction
from rmu_backend.app import collection_preview
sources=['feabb527-f5f0-4dfc-ac5d-78220dfdd107','2d37cfb9-75ef-4463-8ee1-af934f1d2c82','babb5680-97a6-481a-b268-8751a2a41320']
with transaction() as c:base=c.execute('SELECT * FROM rmu.runs WHERE id=%s',(sources[0],)).fetchone()
payload={'idempotency_key':'retained-clf-workflow-v1','campaign':base['campaign'],'query':'Retained CLF campaign evidence: talent, organisation and cause collections','start':str(base['starts_on']),'end':str(base['ends_on']),'mode':'test','source_type':'observed','evidence_lane':'cause'}
preview=collection_preview({k:payload[k] for k in ['query','start','end','mode']});run=pipeline.create_run(payload,preview)
with transaction() as c:
 if not c.execute('SELECT 1 FROM rmu.workflows WHERE run_id=%s',(run['id'],)).fetchone():
  c.execute('INSERT INTO rmu.run_observations(workspace_id,run_id,observation_id) SELECT %s,%s,chosen.id FROM (SELECT DISTINCT ON(o.post_id) o.id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id WHERE ro.run_id=ANY(%s::uuid[]) ORDER BY o.post_id,o.retrieved_at DESC) chosen ON CONFLICT DO NOTHING',(os.environ['RMU_WORKSPACE_ID'],run['id'],sources))
  c.execute("UPDATE rmu.runs SET status='complete',budget_cents=0,coverage=%s WHERE id=%s",(Jsonb({'retained_source_runs':sources,'sample_only':True,'new_x_reads':False}),run['id']))
  c.execute("INSERT INTO rmu.workflows(workspace_id,run_id,state,codebook_version) VALUES(%s,%s,'queued','clf-proposed-v1')",(os.environ['RMU_WORKSPACE_ID'],run['id']))
print(json.dumps({'run_id':str(run['id']),'source_runs':len(sources),'new_x_calls':0}))
