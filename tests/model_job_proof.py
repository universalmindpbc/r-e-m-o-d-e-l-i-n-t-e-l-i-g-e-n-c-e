"""Database proof: authenticated job dispatch is idempotent and bounded."""
import os,uuid
from unittest.mock import patch
from rmu_backend import pipeline,model_jobs
from rmu_backend.app import collection_preview
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000002'
key='job-qa-'+str(uuid.uuid4());plan=dict(query='Model job verification',start='2022-01-01',end='2022-04-30',mode='test',idempotency_key=key,campaign={'name':'Synthetic job QA'},evidence_lane='cause',source_type='synthetic')
run=pipeline.create_run(plan,collection_preview({k:plan[k] for k in ['query','start','end','mode']}));ident=str(run['id'])
pipeline.import_fixture(ident,{'posts':[dict(id='fixture-'+key,author_id='fixture-author',text='Synthetic job verification. No actual social claim.',created_at='2022-02-01T00:00:00Z',retrieved_at='2022-03-01T00:00:00Z')]})
pipeline.queue_measurement(ident);pipeline.process_one(ident)
with patch.dict(os.environ,{'RMU_MODEL_ENABLED':'true','OPENAI_API_KEY':'mock-not-real'}),patch('rmu_backend.model_jobs.threading.Thread') as thread:
 try:model_jobs.queue(ident,{});raise AssertionError('Unconfirmed paid job accepted')
 except ValueError:pass
 job=model_jobs.queue(ident,{'confirm_paid_analysis':True});assert job['started']
 assert not model_jobs.queue(ident,{'confirm_paid_analysis':True})['started']
 assert thread.call_count==1
with patch('rmu_backend.model_jobs.request_classifications',return_value={'stored':4}) as send:
 model_jobs.work(str(job['id']),ident);model_jobs.work(str(job['id']),ident)
 assert send.call_count==1
assert any(j['kind']=='classify' and j['state']=='complete' for j in pipeline.get_run(ident)['jobs'])
print('PASS: paid confirmation, duplicate queue and double worker claim guards; mocked provider only')
