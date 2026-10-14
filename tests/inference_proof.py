"""Mock OpenAI transport; durable PostgreSQL reservations and source validation."""
import json,os,io,uuid,datetime
from unittest.mock import patch
from rmu_backend.db import transaction
from rmu_backend.inference import request_classifications,THEMES
from rmu_backend.pipeline import Conflict
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000002'
from rmu_backend import pipeline
from rmu_backend.app import collection_preview
from rmu_backend.synthesis import request_draft,PANELS
ident='model-qa-'+str(uuid.uuid4())
plan={'query':'Mock OpenAI integration proof','start':'2022-01-01','end':'2022-04-30','mode':'test','idempotency_key':ident,'campaign':{'name':'Synthetic model integration QA'},'evidence_lane':'cause','source_type':'synthetic'}
run=pipeline.create_run(plan,collection_preview({k:plan[k] for k in ['query','start','end','mode']}))
pipeline.import_fixture(str(run['id']),{'posts':[{'id':'fixture-'+ident,'author_id':'fixture-qa','text':'Synthetic verification only. No actual social claim. '+ident,'created_at':'2022-02-01T00:00:00Z','retrieved_at':'2022-03-01T00:00:00Z'}]})
pipeline.queue_measurement(str(run['id']));pipeline.process_one(str(run['id']))
with transaction() as c:
 row=c.execute('SELECT o.id,o.text_content,ro.run_id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id WHERE ro.run_id=%s',(run['id'],)).fetchone()
record={'record_id':str(row['id']),'text':row['text_content']}
result={'classifications':[{'record_id':record['record_id'],'theme':t,'relevance':'uncertain','stance':'no_clear_position','evidence_span':None,'reason':'Mock validation fixture'} for t in THEMES]}
response={'id':'mock-qa-'+str(uuid.uuid4()),'status':'completed','usage':{'input_tokens':0,'output_tokens':0},'output':[{'type':'message','content':[{'type':'output_text','text':json.dumps(result)}]}]}
settings={'OPENAI_API_KEY':'mock-not-a-real-key','RMU_MODEL_MAX_CALLS':'100','RMU_MODEL_PRICE_VERIFIED_ON':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'RMU_MODEL_INPUT_MICROUSD_PER_TOKEN':'1','RMU_MODEL_OUTPUT_MICROUSD_PER_TOKEN':'1','RMU_MODEL_BUDGET_MICROUSD':'1000000'}
with patch.dict(os.environ,settings),patch('rmu_backend.inference.urlopen',return_value=io.BytesIO(json.dumps(response).encode())) as send:
 stored=request_classifications([record],str(row['run_id']));assert stored['stored']==4 and send.call_count==1
 try:request_classifications([record],str(row['run_id']));raise AssertionError('Duplicate paid request permitted')
 except Conflict:pass
 assert send.call_count==1
print('PASS: source-bound mock inference, exact evidence validation, durable request receipt, stored pending labels and duplicate-call guard; no OpenAI call made')

with patch.dict(os.environ,settings):
 try:request_draft(str(row['run_id']));raise AssertionError('Unreviewed labels reached synthesis')
 except Conflict:pass
 with transaction() as c:c.execute("UPDATE rmu.classifications SET review_state='approved' WHERE observation_id=%s",(row['id'],))
 draft={p:dict(status='research_question',seeing='Synthetic QA has no real-world evidence.',supports=[],challenges=[],limitations=['Synthetic verification fixture.'],change='Collect reviewed evidence.',test='Run the planned research.') for p in PANELS}
 response['id']='mock-synthesis-'+str(uuid.uuid4());response['output'][0]['content'][0]['text']=json.dumps(draft)
 with patch('rmu_backend.inference.urlopen',return_value=io.BytesIO(json.dumps(response).encode())):
  assert request_draft(str(row['run_id']))['panels']==7
 assert len(pipeline.get_run(str(row['run_id']))['findings'])==7
print('PASS: researcher-validation gate and seven persisted draft lightbox panels; mock transport only')
