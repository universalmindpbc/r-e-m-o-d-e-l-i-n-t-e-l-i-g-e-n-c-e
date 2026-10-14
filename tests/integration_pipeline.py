"""Explicit opt-in Neon integration QA. Fixtures live in a separate verification workspace."""
import os
import uuid
import psycopg
from rmu_backend import pipeline,db,budget
from rmu_backend.app import collection_preview

WS='de000000-0000-4000-8000-000000000002'
with psycopg.connect(os.environ['DATABASE_URL_UNPOOLED']) as conn:
    conn.execute('INSERT INTO rmu.workspaces(id,name) VALUES(%s,%s) ON CONFLICT DO NOTHING',(WS,'Pipeline verification fixtures'))
os.environ['RMU_WORKSPACE_ID']=WS
assert db.status()['database_verified']
key='qa-'+str(uuid.uuid4())
plan=dict(query='synthetic storage verification',start='2022-01-01',end='2022-04-30',mode='test',idempotency_key=key,campaign={'name':'Synthetic pipeline QA'},evidence_lane='cause',source_type='synthetic')
preview=collection_preview({k:plan[k] for k in ['query','start','end','mode']})
run=pipeline.create_run(plan,preview)
assert pipeline.create_run(plan,preview)['id']==run['id']
try:
    pipeline.create_run({**plan,'campaign':{'name':'different'}},preview)
    raise AssertionError('Idempotency mismatch accepted')
except pipeline.Conflict: pass
run_id=str(run['id'])
post=dict(id='fixture-'+key,author_id='fixture-author',text='Synthetic evidence; no real social claim.',created_at='2022-02-01T00:00:00Z',retrieved_at='2022-03-01T00:00:00Z',public_metrics={'like_count':0})
pipeline.import_fixture(run_id,{'posts':[post,post]})
assert pipeline.get_run(run_id)['evidence_count']==1
pipeline.import_fixture(run_id,{'posts':[post]})
assert pipeline.get_run(run_id)['evidence_count']==1
job=pipeline.queue_measurement(run_id)
assert pipeline.queue_measurement(run_id)['id']==job['id']
try:
    pipeline.import_fixture(run_id,{'posts':[post]})
    raise AssertionError('Sealed run accepted import')
except pipeline.Conflict: pass
assert pipeline.process_one()['processed']
result=pipeline.get_run(run_id)
assert result['status']=='complete' and result['analyses'][0]['result']['sample_posts']==1
assert result['analyses'][0]['result']['alignment'] is None
# Server-bound tenant policy hides the same run, including child rows.
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000001'
assert pipeline.get_run(run_id) is None
with db.transaction() as conn:
    assert conn.execute('SELECT count(*) AS n FROM rmu.observations WHERE post_id=%s',(post['id'],)).fetchone()['n']==0
    try:
        with conn.transaction():
            conn.execute('INSERT INTO rmu.posts VALUES(%s,%s,%s,%s,%s,now())',(WS,'fixture','synthetic','fixture-cross-tenant','author'))
        raise AssertionError('Tenant write accepted')
    except psycopg.errors.InsufficientPrivilege: pass
    try:
        with conn.transaction(): conn.execute('CREATE TABLE rmu.should_not_exist(id int)')
        raise AssertionError('DDL accepted')
    except psycopg.errors.InsufficientPrivilege: pass
# A reservation never makes a provider request. Ambiguous pages cannot be retried.
os.environ['RMU_WORKSPACE_ID']=WS
paid=pipeline.create_run({**plan,'idempotency_key':key+'-budget','source_type':'observed'},preview)
page=budget.reserve(str(paid['id']),'page-1',200)
try:
    budget.reserve(str(paid['id']),'page-2',100)
    raise AssertionError('Budget exceeded')
except pipeline.Conflict: pass
budget.uncertain(page)
try:
    budget.reserve(str(paid['id']),'page-1',1)
    raise AssertionError('Uncertain request retried')
except pipeline.Conflict: pass
print('PASS: Neon storage, idempotency, deduplication, sealing, jobs, metrics, tenant reads/writes, restricted DDL, spend cap and uncertain-request guard')
