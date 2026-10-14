"""Live database proof through the authenticated WSGI API; no network provider calls."""
import io,json,os,uuid
from unittest.mock import patch
from rmu_backend.app import application
from rmu_backend import pipeline,x_collection
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000002'

def request(path,method='GET',data=None,authorized=True):
    raw=json.dumps(data).encode() if data is not None else b''
    env={'PATH_INFO':path,'REQUEST_METHOD':method,'HTTP_AUTHORIZATION':'Bearer '+(os.environ['RMU_SERVICE_TOKEN'] if authorized else 'invalid'),'CONTENT_TYPE':'application/json','CONTENT_LENGTH':str(len(raw)),'wsgi.input':io.BytesIO(raw)}
    output=[]
    body=b''.join(application(env,lambda s,h:output.append(s)))
    return output[0],json.loads(body)
assert request('/v1/status',authorized=False)[0]=='401 Unauthorized'
assert request('/v1/status')[1]['database_verified']
plan={'query':'NO_NETWORK_QA','start':'2022-01-01','end':'2022-04-30','mode':'test','idempotency_key':'api-qa-'+str(uuid.uuid4()),'campaign':{'name':'Synthetic API verification'},'evidence_lane':'cause','source_type':'synthetic'}
s,r=request('/v1/runs','POST',plan);assert s=='201 Created',(s,r)
run_id=r['id']
assert request('/v1/runs','POST',plan)[1]['id']==run_id
post={'id':'fixture-'+run_id,'author_id':'fixture-author','created_at':'2022-02-01T00:00:00Z','retrieved_at':'2022-03-01T00:00:00Z','text':'API fixture, not real evidence.','public_metrics':{'like_count':5}}
assert request('/v1/runs/'+run_id+'/fixtures','POST',{'posts':[post,post]})[0]=='200 OK'
assert request('/v1/runs/'+run_id+'/measure','POST',{})[0]=='202 Accepted'
assert request('/v1/jobs/process-one','POST',{'run_id':run_id})[1]['processed']
result=request('/v1/runs/'+run_id)[1]
assert result['analyses'][0]['result']['metric_coverage']['like_count']['sum']==5
assert result['evidence_count']==1
assert request('/v1/jobs/process-one','POST',{'run_id':run_id})[1]['processed'] is False
# Stub X transport only. No actual token is used and no provider network function is called.
from datetime import datetime,timezone
config={'RMU_X_COLLECTION_ENABLED':'true','RMU_X_PRICE_VERIFIED_ON':datetime.now(timezone.utc).date().isoformat(),'RMU_X_POST_PRICE_MICROUSD':'5000','X_API_BEARER_TOKEN':'test-only-not-a-real-token'}
observed={**plan,'source_type':'observed','idempotency_key':plan['idempotency_key']+'-mock-x','campaign':{'name':'MOCK TRANSPORT QA; not observed evidence'}}
xrun=request('/v1/runs','POST',observed)[1]
with patch.dict(os.environ,config):
    result=x_collection.collect_one(xrun['id'],fetch=lambda p,t:{'data':[{'id':str(uuid.uuid4().int)[:18],'author_id':'12345','created_at':'2022-02-01T00:00:00Z','text':'MOCK API TRANSPORT FIXTURE'}],'meta':{}})
assert result['stored_posts']==1 and result['run_complete']
saved=pipeline.get_run(xrun['id']);assert saved['reserved_cents']==50 and saved['charged_cents']==0
assert saved['evidence_count']==1
failed=request('/v1/runs','POST',{**observed,'idempotency_key':observed['idempotency_key']+'-timeout'})[1]
def timeout(p,t): raise TimeoutError('simulated lost response')
with patch.dict(os.environ,config):
    try: x_collection.collect_one(failed['id'],fetch=timeout);raise AssertionError('Timeout swallowed')
    except pipeline.Conflict: pass
assert pipeline.get_run(failed['id'])['status']=='needs_reconciliation'
print('PASS: authenticated API -> Neon -> deduplicated evidence -> durable job -> stored metrics; mock X checkpoint and uncertain outcome; zero external provider requests')
