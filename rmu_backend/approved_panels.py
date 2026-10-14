"""Populate the signed-off field contract; never generate layout or field names."""
import json,os
from uuid import UUID,uuid4
from psycopg.types.json import Jsonb
from .db import transaction
from . import pipeline
from .inference import object_schema,STR,validate_classifications
from .workflows import call,prompt
VERSION='approved-panels-v2'
CODEBOOK='approved-overview-v1'
THEMES={'Frontline communities':'Explicit reference to communities on the frontlines of climate burdens, including unequal exposure and community-led responses. General climate concern alone is insufficient.','Climate resilience':'Explicit preparedness, adaptation, recovery or resilience to climate impacts. Generic sustainability alone is insufficient.','Equitable funding':'Explicit allocation or access to climate funding/resources with fairness, underserved groups or grassroots recipients. Generic charity alone is insufficient.'}
STANCES=['support','opposition','mixed','no_clear_position']

def aggregate(rows,codes):
 talent=[r for r in rows if r['cohort']=='talent'];fans=[r for r in rows if r['cohort'] not in ('talent','organisation')];authors=sorted({r['author_id'] for r in fans});lookup={(str(c['observation_id']),c['theme']):c for c in codes}
 themes=[]
 for name in THEMES:
  n=sum(lookup[(r['record_id'],name)]['provenance']['relevance']=='relevant' for r in talent)
  counts=[0]*4
  for author in authors:
   stance={lookup[(r['record_id'],name)]['stance'] for r in fans if r['author_id']==author};clear=stance-{'no_clear_position'}
   value='mixed' if 'mixed' in clear or {'support','opposition'}<=clear else next(iter(clear)) if clear else 'no_clear_position'
   counts[STANCES.index(value)]+=1
  evidence=[{'record_id':r['record_id'],'cohort':r['cohort'],'quote':lookup[(r['record_id'],name)]['evidence_span'],'stance':lookup[(r['record_id'],name)]['stance'],'reason':lookup[(r['record_id'],name)]['provenance']['reason']} for r in rows if lookup[(r['record_id'],name)]['evidence_span']]
  themes.append({'name':name,'posts':n,'stance':counts,'interpretation':'Candidate shared priority to test' if n and counts[0] else 'Insufficient shared evidence; investigate the gap','evidence':evidence})
 return {'audienceScope':'public_conversation','organisationPosts':sum(r['cohort']=='organisation' for r in rows),'inferredFanAccounts':len({r['author_id'] for r in fans if r['cohort']=='inferred_fan'}),'talentPosts':len(talent),'fanPosts':len(fans),'fanAccounts':len(authors),'themes':themes,'priorities':sum(t['posts']>0 and t['stance'][0]>0 for t in themes),'reviewedLabels':sum(c['review_state']=='approved' for c in codes)}

def populate(run_id,heartbeat=None):
 with transaction() as c:
  existing=c.execute('SELECT result FROM rmu.analyses WHERE run_id=%s AND metric_version=%s',(UUID(run_id),VERSION)).fetchone()
  if existing and all(existing['result']['messaging']['shared'].values()) and all(existing['result']['messaging']['actions'].values()):return existing['result']
  run=c.execute('SELECT * FROM rmu.runs WHERE id=%s',(UUID(run_id),)).fetchone()
  # This fixed approved codebook concerns the signed-off climate campaign, not arbitrary subjects.
  if not any('climate' in t.lower() or 'sustainab' in t.lower() for t in run['campaign'].get('topics',[])):return None
  rows=[{**dict(r),'record_id':str(r['id']),'text':r['text_content']} for r in c.execute("SELECT o.id,o.text_content,o.cohort,p.author_id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id WHERE ro.run_id=%s AND o.post_type!='repost' ORDER BY o.post_id",(UUID(run_id),))]
  codes=list(c.execute('SELECT cl.* FROM rmu.classifications cl JOIN rmu.run_observations ro ON ro.observation_id=cl.observation_id AND ro.workspace_id=cl.workspace_id WHERE ro.run_id=%s AND cl.codebook_version=%s',(UUID(run_id),CODEBOOK)))
 relevant=rows # Every retained original post is coded; identity remains a separate attribute.
 coded={str(c['observation_id']) for c in codes};pending=[r for r in relevant if r['record_id'] not in coded]
 for offset in range(0,len(pending),20):
  if heartbeat:heartbeat()
  items=[{k:r[k] for k in ['record_id','text','cohort']} for r in pending[offset:offset+20]]
  schema=object_schema({'classifications':{'type':'array','items':object_schema({'record_id':STR,'theme':{'type':'string','enum':list(THEMES)},'relevance':{'type':'string','enum':['relevant','not_relevant','uncertain']},'stance':{'type':'string','enum':STANCES},'evidence_span':{'type':['string','null']},'reason':STR})}})
  out,rid,meta,res=call({'instructions':prompt()+'\nPopulate the exact approved three-theme chart. Return every record/theme pair exactly once. Quotes must be exact substrings; use null when unsupported. Reasons <=100 characters; evidence spans <=160 characters and exactly source-matched. No inferred position from celebrity enthusiasm.','input':json.dumps({'campaign':run['campaign'],'codebook':THEMES,'records':items}), 'text':{'format':{'type':'json_schema','name':'approved_chart_coding','strict':True,'schema':schema}}},items,str(run_id))
  validate_classifications(out,items,themes=THEMES)
  with transaction() as c:
   for x in out['classifications']:
    prov={**meta,'model':'gpt-6-astra','reasoning':'high','relevance':x['relevance'],'reason':x['reason'],'run_id':str(run_id),'response_id':res['id'],'review_required':True}
    row=c.execute('INSERT INTO rmu.classifications(workspace_id,id,observation_id,codebook_version,theme,stance,evidence_span,provenance) VALUES(%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *',(run['workspace_id'],uuid4(),UUID(x['record_id']),CODEBOOK,x['theme'],x['stance'],x['evidence_span'],Jsonb(prov))).fetchone();codes.append(row)
   c.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(rid,))
 metrics=aggregate(relevant,codes)
 contract=json.loads((__import__('pathlib').Path(__file__).parent/'approved_field_contract.json').read_text())
 items=[{k:r[k] for k in ['record_id','text','cohort']} for r in rows]
 field=object_schema({**{k:STR for k in ['meaning','change','test','evidence']},'sources':{'type':'array','items':STR}})
 props={key:field for key in contract}
 props['shared']=object_schema({k:STR for k in ['message','need','proof','action','guardrail','test']})
 props['actions']=object_schema({k:STR for k in ['Rihanna','Fans','Alignment']})
 if heartbeat:heartbeat()
 out,rid,meta,res=call({'instructions':prompt()+'\nPopulate values ONLY for the supplied signed-off fields. The static titles, questions and UI are locked. Respect each question, including when its answer is unknown. Every meaning/change/test/evidence value <=300 characters, shared values <=350. Describe provisional evidence and practical next action. Explicitly state missing team/partner/survey evidence. Do not claim community validation, verified fans or causal impact. Do not invent quotations or numbers. sources contains only supplied record_ids. Output no UUIDs in prose. Analyse ALL supplied posts. Audience includes all public participants, both inferred fans and uncertain membership; talent and organisation are separate. Do not describe this sample as verified fans. Use the full conversation for audience barriers, trust, objections and practical messaging. Organisation statements can support commitment evidence, not audience response or verified delivery. Do not cite internal field IDs in prose. Shared message <=160 characters and framed as a proposed message to test. Fill shared and actions as well as all nine research rows; no empty strings. Use plain human language, never machine status tokens or repeated draft/Observation/Proposed prefixes because the interface already labels status. meaning must explain why the issue matters to a decision, not repeat the question. Keep missing evidence explicit in evidence. Shared fields are a safe proposed hypothesis, not a verified campaign claim.','input':json.dumps({'campaign':run['campaign'],'fields':contract,'shared_fields':{'message':'Concrete proposed message to test','need':'Human need hypothesis','proof':'Available evidence and missing proof to attach','action':'Proposed audience action','guardrail':'Claim boundaries','test':'Feasible message test'},'action_fields':{'Rihanna':'Next action on talent evidence','Fans':'Next action on audience response','Alignment':'Next action on shared priorities and gaps'},'metrics':{**{k:v for k,v in metrics.items() if k!='themes'},'themes':[{k:v for k,v in t.items() if k!='evidence'} for t in metrics['themes']]},'records':items},default=str),'text':{'format':{'type':'json_schema','name':'approved_reporting_fields','strict':True,'schema':object_schema(props)}}},items,str(run_id),full_collection=True)
 if any(not v.strip() for group in ['shared','actions'] for v in out[group].values()):raise ValueError('Empty approved reporting field')
 known={r['record_id'] for r in items}
 for key in contract:
  if not set(out[key]['sources'])<=known:raise ValueError('Unknown supporting source')
  if any(not out[key][v].strip() or len(out[key][v])>500 for v in ['meaning','change','test','evidence']):raise ValueError('Reporting field is empty or exceeds approved space')
 result={'version':VERSION,'run_id':str(run_id),'overview':metrics,'messaging':out,'provenance':{**meta,'model':'gpt-6-astra','review':'pending','source_selection':'All retained non-repost records supplied to messaging analysis. Audience charts include all public participants; talent and organisation remain separate. Fan membership is unverified; not representative.','total_posts':len(rows)}}
 with transaction() as c:
  c.execute('INSERT INTO rmu.analyses(workspace_id,id,run_id,metric_version,input_hash,result) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT (workspace_id,run_id,metric_version,input_hash) DO UPDATE SET result=excluded.result',(run['workspace_id'],uuid4(),UUID(run_id),VERSION,pipeline.digest({'run':str(run_id),'version':VERSION}),Jsonb(result)))
  c.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(rid,))
 return result
