"""Durable one-shot classification jobs; interrupted paid work never auto-retries."""
import os,threading
from uuid import UUID,uuid4
from .db import transaction
from .pipeline import Conflict
from .inference import request_classifications,CODEBOOK_VERSION

def pending_records(conn,run_id):
 return [dict(record_id=str(r['id']),text=r['text_content']) for r in conn.execute('''SELECT DISTINCT ON(o.post_id) o.id,o.text_content FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id WHERE ro.run_id=%s AND o.text_content IS NOT NULL AND o.post_type!='repost' AND NOT EXISTS(SELECT 1 FROM rmu.classifications cl WHERE cl.workspace_id=o.workspace_id AND cl.observation_id=o.id AND cl.codebook_version=%s) ORDER BY o.post_id,o.retrieved_at DESC''',(run_id,CODEBOOK_VERSION))]

def queue(run_id,payload):
 if payload!={'confirm_paid_analysis':True}:raise ValueError('Explicit paid analysis confirmation required')
 if os.environ.get('RMU_MODEL_ENABLED')!='true' or not os.environ.get('OPENAI_API_KEY'):raise Conflict('Model integration is not enabled')
 run_id=UUID(run_id)
 with transaction() as c:
  ws=os.environ['RMU_WORKSPACE_ID'];c.execute('SELECT id FROM rmu.workspaces WHERE id=%s FOR UPDATE',(ws,))
  run=c.execute('SELECT status FROM rmu.runs WHERE id=%s',(run_id,)).fetchone()
  if not run or run['status']!='complete':raise Conflict('Complete collection and measurement before analysis')
  job=c.execute("SELECT id,state FROM rmu.jobs WHERE run_id=%s AND kind='classify'",(run_id,)).fetchone()
  if job:return {**job,'started':False}
  if c.execute("SELECT 1 FROM rmu.model_requests WHERE run_id=%s AND state!='validated'",(run_id,)).fetchone():raise Conflict('Resolve earlier model requests before starting another job')
  if not pending_records(c,run_id):return {'state':'complete','started':False}
  job_id=uuid4();c.execute("INSERT INTO rmu.jobs(workspace_id,id,run_id,kind) VALUES(%s,%s,%s,'classify')",(ws,job_id,run_id))
 threading.Thread(target=work,args=(str(job_id),str(run_id)),daemon=True).start()
 return {'id':job_id,'state':'queued','started':True}

def work(job_id,run_id):
 try:
  with transaction() as c:
   claimed=c.execute("UPDATE rmu.jobs SET state='running',attempts=attempts+1,lease_until=now()+interval '20 minutes',updated_at=now() WHERE id=%s AND state='queued' RETURNING id",(job_id,)).fetchone()
   if not claimed:return
   records=pending_records(c,run_id)
  for start in range(0,len(records),20):
   with transaction() as c:c.execute("UPDATE rmu.jobs SET lease_until=now()+interval '20 minutes',updated_at=now() WHERE id=%s",(job_id,))
   request_classifications(records[start:start+20],run_id)
  with transaction() as c:c.execute("UPDATE rmu.jobs SET state='complete',lease_until=NULL,updated_at=now() WHERE id=%s",(job_id,))
 except Exception as error:
  # Only the exception type is recorded. Never persist a provider error/key to logs.
  with transaction() as c:c.execute("UPDATE rmu.jobs SET state='needs_reconciliation',error_code=%s,updated_at=now() WHERE id=%s",(type(error).__name__,job_id))
