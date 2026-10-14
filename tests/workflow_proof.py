"""Isolated DB proof, synthetic records and mocked model only."""
import os,uuid,json
from unittest.mock import patch
from psycopg.types.json import Jsonb
from rmu_backend import pipeline,workflows
from rmu_backend.app import collection_preview
from rmu_backend.db import transaction
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000002'
payload={'idempotency_key':str(uuid.uuid4()),'campaign':{'name':'Workflow fixture','talent':'Michael Jackson','topics':['pink bananas']},'start':'2022-01-01','end':'2022-01-02'}
data,preview=workflows.plan(payload);data['source_type']='synthetic'
run=pipeline.create_run(data,preview);rid=str(run['id'])
pipeline.import_fixture(rid,{'posts':[{'id':'fixture-'+str(uuid.uuid4()),'author_id':'fixture-a','text':'Pink bananas are a fictional fixture.','created_at':'2022-01-01T00:00:00Z','retrieved_at':'2022-01-02T00:00:00Z'}]})
with transaction() as c:
 c.execute("UPDATE rmu.runs SET status='complete' WHERE id=%s",(rid,));c.execute("INSERT INTO rmu.workflows(workspace_id,run_id,state) VALUES(%s,%s,'queued')",(os.environ['RMU_WORKSPACE_ID'],rid))
def call(body,items,run_id):
 if body['text']['format']['name']=='campaign_coding':
  out={'classifications':[dict(record_id=r['record_id'],theme=t,relevance='uncertain',stance='no_clear_position',evidence_span=None,reason='Synthetic fixture only') for r in items for t in workflows.THEMES]}
 else:
  out={p:dict(status='research_question',seeing='Synthetic fixture: investigate the new topic.',supports=[],challenges=[],limitations=['Synthetic QA, not research evidence.'],change='Validate the brief.',test='Collect real source evidence.') for p in workflows.PANELS}
 return out,uuid.uuid4(),{'prompt_hash':'fixture','request_hash':'fixture'},{'id':'fixture-response'}
with patch.object(workflows,'call',call):workflows.work(rid)
result=workflows.get(rid);assert result['workflow']['state']=='ready',result['workflow'];assert len(result['findings'])==7;assert result['classification_count']==3
with patch.object(workflows,'call',side_effect=AssertionError('Duplicate model call')):workflows.work(rid)
from rmu_backend.exports import export_run
assert export_run(rid)['rows']==1
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000001';assert workflows.get(rid) is None
print(json.dumps({'workflow':'ready','panels':7,'labels':3,'duplicate_execution':'blocked','cross_tenant':'hidden','paid_calls':0}))
