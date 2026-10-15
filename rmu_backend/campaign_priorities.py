"""Substantive client priorities and public responses; independent of celebrity/topic."""
import json
from pathlib import Path
from uuid import UUID,uuid4
from psycopg.types.json import Jsonb
from .db import transaction
from .inference import object_schema,STR
from . import pipeline
VERSION='campaign-priorities-v1'
LIST={'type':'array','items':STR}
FIELDS=['client','support','challenge','mixed','discussion']
TOPIC=object_schema({**{k:STR for k in ['name','definition','insight']},**{k:LIST for k in FIELDS}})
SCHEMA=object_schema({'summary':STR,'topics':{'type':'array','items':TOPIC,'maxItems':8},'outside':LIST})
def validate(out,rows):
 lookup={str(i):r for i,r in enumerate(rows)};covered=set();names=set()
 for t in out['topics']:
  if not t['name'].strip() or t['name'] in names or not t['client']:raise ValueError('Every priority needs a unique name and client evidence')
  names.add(t['name']);seen=set()
  for field in FIELDS:
   for ref in t[field]:
    if ref not in lookup or ref in seen:raise ValueError('Unknown or repeated topic source')
    seen.add(ref);covered.add(ref)
    client=lookup[ref]['cohort'] in ['talent','organisation']
    if client!=(field=='client'):raise ValueError('Client/public attribution mismatch')
 outside=set(out['outside'])
 if len(outside)!=len(out['outside']) or outside&covered or covered|outside!=set(lookup):raise ValueError('Every post must be accounted for; outside cannot overlap topics')
 return out

def populate(run_id,heartbeat=None):
 from .workflows import records,call
 with transaction() as c:
  prior=c.execute('SELECT result FROM rmu.analyses WHERE run_id=%s AND metric_version=%s',(UUID(run_id),VERSION)).fetchone()
  if prior:return prior['result']
  run=c.execute('SELECT * FROM rmu.runs WHERE id=%s',(UUID(run_id),)).fetchone();rows=records(c,UUID(run_id))
 if not rows:return None
 prompt=(Path(__file__).parent/'priorities_prompt.md').read_text()
 if heartbeat:heartbeat()
 out,rid,meta,res=call({'max_output_tokens':14000,'instructions':prompt,'input':json.dumps({'campaign':run['campaign'],'posts':[{'id':str(i),'lane':r['cohort'],'text':r['text']} for i,r in enumerate(rows)]},ensure_ascii=False,separators=(',',':')),'text':{'format':{'type':'json_schema','name':'campaign_priorities','strict':True,'schema':SCHEMA}}},rows,str(run_id),full_collection=True)
 validate(out,rows)
 for t in out['topics']:
  for field in FIELDS:t[field]=[rows[int(i)]['record_id'] for i in t[field]]
 out['outside']=[rows[int(i)]['record_id'] for i in out['outside']]
 result={**out,'version':VERSION,'provenance':{**meta,'response_id':res['id'],'model':'gpt-6-astra','review':'AI topic assignments; source IDs checked; analyst review pending'}}
 with transaction() as c:
  c.execute('INSERT INTO rmu.analyses(workspace_id,id,run_id,metric_version,input_hash,result) VALUES(%s,%s,%s,%s,%s,%s)',(run['workspace_id'],uuid4(),UUID(run_id),VERSION,pipeline.digest({'run':run_id,'version':VERSION}),Jsonb(result)))
  c.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(rid,))
  c.execute('UPDATE rmu.workflows SET updated_at=now() WHERE run_id=%s',(UUID(run_id),))
 return result
