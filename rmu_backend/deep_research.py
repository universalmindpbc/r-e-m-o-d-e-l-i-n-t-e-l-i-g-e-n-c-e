"""Campaign-independent, source-grounded qualitative research stored with the run."""
import json,re,html
from collections import Counter
from pathlib import Path
from uuid import UUID,uuid4
from psycopg.types.json import Jsonb
from .db import transaction
from .inference import object_schema,STR
from . import pipeline
VERSION='research-brief-v1'
VIEWS=['Talent','Audience','Society','Shared Values']
def array(item,minimum=1,maximum=8):return {'type':'array','items':item,'minItems':minimum,'maxItems':maximum}
EVIDENCE=object_schema({'source':STR,'quote':STR,'role':{'type':'string','enum':['supports','challenges','context']},'reading':STR})
FINDING=object_schema({**{k:STR for k in ['title','observation','interpretation','value_tension','alternative','implication','message_a','message_b','test','limitation']},'views':array({'type':'string','enum':VIEWS},1,4),'evidence':array(EVIDENCE,1,6)})
SCHEMA=object_schema({'headline':STR,'summary':STR,'findings':array(FINDING,1,6)})
def collection_stats(rows):
 groups={}
 for row in rows:
  text=html.unescape(row['text']).casefold()
  text=re.sub(r'https?://\S+','',text)
  text=re.sub(r'\s+',' ',text).strip()
  if text:groups.setdefault(text,[]).append(row['record_id'])
 repeated=sorted([{'text':k,'ids':v,'count':len(v)} for k,v in groups.items() if len(v)>1],key=lambda x:-x['count'])
 return {'total':len(rows),'cohorts':dict(Counter(r['cohort'] for r in rows)), 'repeated_posts':sum(x['count'] for x in repeated),'repeat_excess':sum(x['count']-1 for x in repeated),'repeated_groups':len(repeated),'largest_groups':repeated[:5]}
def validate(out,rows):
 if not isinstance(out,dict) or not out.get('headline','').strip() or not out.get('summary','').strip():raise ValueError('Missing research synthesis')
 findings=out.get('findings',[])
 if not 1<=len(findings)<=6:raise ValueError('One to six supported findings required')
 lookup={str(i):r for i,r in enumerate(rows)}
 for f in findings:
  if not f.get('views') or not set(f['views'])<=set(VIEWS):raise ValueError('Unknown perspective')
  for k in ['title','observation','interpretation','value_tension','alternative','implication','message_a','message_b','test','limitation']:
   if not isinstance(f.get(k),str) or not f[k].strip() or len(f[k])>1600:raise ValueError('Incomplete research argument')
  if not 1<=len(f.get('evidence',[]))<=6:raise ValueError('Evidence required')
  seen=set()
  for e in f['evidence']:
   row=lookup.get(e.get('source'))
   if not row or not e.get('quote') or e['quote'] not in row['text']:raise ValueError('Research quotation not source matched')
   if e['source'] in seen:raise ValueError('Duplicate evidence within finding')
   seen.add(e['source'])
   if e.get('role') not in ['supports','challenges','context'] or not e.get('reading','').strip():raise ValueError('Evidence reading required')
  if not any(e['role']=='supports' for e in f['evidence']):raise ValueError('Finding lacks supporting evidence')
 return out

def populate(run_id,heartbeat=None):
 from .workflows import call,records
 with transaction() as c:
  existing=c.execute('SELECT result FROM rmu.analyses WHERE run_id=%s AND metric_version=%s',(UUID(run_id),VERSION)).fetchone()
  if existing:return existing['result']
  run=c.execute('SELECT * FROM rmu.runs WHERE id=%s',(UUID(run_id),)).fetchone()
  rows=records(c,UUID(run_id))
 if not rows:return None
 stats=collection_stats(rows)
 instructions=(Path(__file__).parent/'research_prompt.md').read_text()
 # Short references reduce transport cost, then resolve to immutable observation IDs.
 inputs=[{'source':str(i),'cohort':r['cohort'],'text':r['text']} for i,r in enumerate(rows)]
 if heartbeat:heartbeat()
 out,rid,meta,res=call({'max_output_tokens':16000,'instructions':instructions,'input':json.dumps({'campaign':run['campaign'],'collection':{k:v for k,v in stats.items() if k!='largest_groups'},'records':inputs},ensure_ascii=False),'text':{'format':{'type':'json_schema','name':'deep_research','strict':True,'schema':SCHEMA}}},rows,str(run_id),full_collection=True)
 validate(out,rows)
 for f in out['findings']:
  for e in f['evidence']:e['record_id']=rows[int(e.pop('source'))]['record_id']
 result={**out,'version':VERSION,'run_id':str(run_id),'collection':stats,'provenance':{**meta,'model':'gpt-6-astra','response_id':res['id'],'review':'source-checked; interpretation pending researcher review'}}
 with transaction() as c:
  c.execute('INSERT INTO rmu.analyses(workspace_id,id,run_id,metric_version,input_hash,result) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT (workspace_id,run_id,metric_version,input_hash) DO UPDATE SET result=excluded.result',(run['workspace_id'],uuid4(),UUID(run_id),VERSION,pipeline.digest({'run':str(run_id),'version':VERSION}),Jsonb(result)))
  c.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(rid,))
  c.execute('UPDATE rmu.workflows SET updated_at=now() WHERE run_id=%s',(UUID(run_id),))
 return result
