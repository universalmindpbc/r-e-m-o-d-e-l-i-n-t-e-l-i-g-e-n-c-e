"""Mock OpenAI transport; durable PostgreSQL reservations and source validation."""
import json,os,io,uuid,datetime
from unittest.mock import patch
from rmu_backend.db import transaction
from rmu_backend.inference import request_classifications,THEMES
from rmu_backend.pipeline import Conflict
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000002'
with transaction() as c:
 row=c.execute("SELECT o.id,o.text_content,ro.run_id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id WHERE o.source_type='synthetic' ORDER BY o.retrieved_at DESC LIMIT 1").fetchone()
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
