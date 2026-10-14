"""Compute transparent coverage even when a provider run paused. Never infer stance."""
from uuid import uuid4
from psycopg.types.json import Jsonb
from rmu_backend.db import transaction
from rmu_backend.pipeline import measure,digest
with transaction() as c:
 for run in list(c.execute("SELECT * FROM rmu.runs WHERE source_type='observed'")):
  rows=list(c.execute('''SELECT DISTINCT ON(o.post_id) o.*,p.author_id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id WHERE ro.run_id=%s ORDER BY o.post_id,o.retrieved_at DESC''',(run['id'],)))
  if not rows:continue
  result=measure(rows,'observed');result['collection_status']=run['status'];result['query_coverage']=run['coverage']
  if run['status']!='complete':
   result['status']='partial_collection_coverage';result['limitations'].insert(0,'Collection paused or incomplete: counts describe retained records only.')
  h=digest(sorted(str(r['id'])+r['content_hash'] for r in rows))
  c.execute('INSERT INTO rmu.analyses(workspace_id,id,run_id,metric_version,input_hash,result) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING',(run['workspace_id'],uuid4(),run['id'],'evidence-coverage-v2',h,Jsonb(result)))
  print(run['evidence_lane'],run['status'],len(rows),'retained posts')
