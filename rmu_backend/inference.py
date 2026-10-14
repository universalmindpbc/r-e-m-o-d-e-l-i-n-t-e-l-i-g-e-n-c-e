"""Bounded Astra classification adapter. No public execution route or automatic retries."""
import json,os,hashlib
from datetime import datetime,timezone
from decimal import Decimal,ROUND_CEILING
from pathlib import Path
from urllib.request import Request,urlopen
from uuid import uuid4
from psycopg.types.json import Jsonb
from .pipeline import digest,Conflict
from .db import transaction

MODEL='gpt-6-astra'
THEMES={'climate_justice':'Equity, frontline communities and structural climate burdens','sustainability':'Environmental sustainability and sustainable practices','community_resilience':'Preparedness, recovery and community resilience','accountability':'Evidence of delivery, transparency and substantiation'}
CODEBOOK_VERSION='clf-proposed-v1'
BASE=Path(__file__).parents[1]


def object_schema(properties):
    return {'type':'object','properties':properties,'required':list(properties),'additionalProperties':False}
STR={'type':'string'}
classification=object_schema({'record_id':STR,'theme':{'type':'string','enum':list(THEMES)},'relevance':{'type':'string','enum':['relevant','not_relevant','uncertain']},'stance':{'type':'string','enum':['support','opposition','mixed','no_clear_position']},'evidence_span':{'type':['string','null']},'reason':STR})
SCHEMA=object_schema({'classifications':{'type':'array','items':classification}})


def validate_classifications(result,records):
    if not isinstance(result,dict) or set(result)!={'classifications'} or not isinstance(result['classifications'],list):raise ValueError('Invalid classification response')
    texts={r['record_id']:r['text'] for r in records};seen=set()
    for item in result['classifications']:
        if not isinstance(item,dict) or set(item)!=set(classification['properties']):raise ValueError('Invalid classification fields')
        ident,theme=item['record_id'],item['theme']
        if ident not in texts or theme not in THEMES or (ident,theme) in seen:raise ValueError('Unknown or duplicate evidence/theme')
        seen.add((ident,theme))
        if item['relevance'] not in ('relevant','not_relevant','uncertain') or item['stance'] not in ('support','opposition','mixed','no_clear_position'):raise ValueError('Invalid label')
        span=item['evidence_span']
        if span is not None and (not isinstance(span,str) or not span.strip() or span not in texts[ident]):raise ValueError('Evidence span not in source')
        if item['stance']!='no_clear_position' and (not span or item['relevance']!='relevant'):raise ValueError('Stance requires relevant source span')
        if not isinstance(item['reason'],str) or not item['reason'].strip():raise ValueError('Reason required')
    if seen!={(r['record_id'],t) for r in records for t in THEMES}:raise ValueError('Incomplete classification coverage')
    return result


def request_classifications(records,run_id):
    key=os.environ.get('OPENAI_API_KEY')
    if not key:raise Conflict('OpenAI API key not available; no model request sent')
    if not 1<=len(records)<=20:raise ValueError('Use 1–20 records per batch')
    prompt=(BASE/'rmu_backend/approved_prompt.md').read_text()
    prompt=prompt.split('## Exact draft prompt: Overview intelligence')[0]
    instructions=prompt+'\nTASK: classification only. Return every record/theme combination. All labels remain unreviewed. Use the supplied codebook, not new themes.'
    body={'model':MODEL,'reasoning':{'effort':'high'},'store':False,'max_output_tokens':12000,
          'instructions':instructions,'input':json.dumps({'codebook_version':CODEBOOK_VERSION,'codebook':THEMES,'records':records}),
          'text':{'format':{'type':'json_schema','name':'rmu_classification','strict':True,'schema':SCHEMA}}}
    output,request_id,metadata,payload=request_model(body,records,run_id)
    result=validate_classifications(output,records)
    with transaction() as conn:
        ws=os.environ['RMU_WORKSPACE_ID']
        for item in result['classifications']:
            conn.execute('''INSERT INTO rmu.classifications(workspace_id,id,observation_id,codebook_version,theme,stance,evidence_span,provenance) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)''',(ws,uuid4(),item['record_id'],CODEBOOK_VERSION,item['theme'],item['stance'],item['evidence_span'],Jsonb({'model':MODEL,'reasoning':'high','prompt_hash':metadata['prompt_hash'],'request_hash':metadata['request_hash'],'response_id':payload.get('id'),'relevance':item['relevance'],'reason':item['reason'],'review_required':True})))
        conn.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(request_id,))
    return {'stored':len(result['classifications']),'review_status':'pending','usage':payload.get('usage')}


def request_model(body,records,run_id):
    key=os.environ.get('OPENAI_API_KEY')
    if not key:raise Conflict('OpenAI API key not available; no model request sent')
    if not 1<=len(records)<=20 or len({r['record_id'] for r in records})!=len(records):raise ValueError('Use 1–20 distinct records')
    instructions=body['instructions']
    identity=digest(body)
    cap=int(os.environ.get('RMU_MODEL_MAX_CALLS','0'))
    if not 1<=cap<=100:raise Conflict('Model call allowance exhausted or unset')
    if len(body['input'].encode())>40000:raise ValueError('Batch exceeds input size bound')
    if os.environ.get('RMU_MODEL_PRICE_VERIFIED_ON')!=datetime.now(timezone.utc).date().isoformat():
        raise Conflict('Verify model pricing for today')
    input_rate=Decimal(os.environ.get('RMU_MODEL_INPUT_MICROUSD_PER_TOKEN','0'))
    output_rate=Decimal(os.environ.get('RMU_MODEL_OUTPUT_MICROUSD_PER_TOKEN','0'))
    budget=int(os.environ.get('RMU_MODEL_BUDGET_MICROUSD','0'))
    if not input_rate.is_finite() or not output_rate.is_finite() or input_rate<=0 or output_rate<=0 or budget<=0:
        raise Conflict('Verified model pricing and a separate monetary allowance required')
    reserve=int(((len(json.dumps(body).encode())+2048)*input_rate+body['max_output_tokens']*output_rate).to_integral_value(rounding=ROUND_CEILING))
    request_id=uuid4();metadata={'prompt_hash':hashlib.sha256(instructions.encode()).hexdigest(),'request_hash':identity}
    with transaction() as conn:
        ws=os.environ['RMU_WORKSPACE_ID']
        conn.execute('SELECT id FROM rmu.workspaces WHERE id=%s FOR UPDATE',(ws,))
        previous=conn.execute('SELECT coalesce(sum(reserved_microusd),0) AS held,count(*) AS n FROM rmu.model_requests').fetchone()
        if previous['held']+reserve>budget or previous['n']>=cap:raise Conflict('Model allowance exhausted')
        if conn.execute('SELECT 1 FROM rmu.model_requests WHERE request_hash=%s',(identity,)).fetchone():raise Conflict('Model request already recorded; no retry')
        # Bind all provided evidence IDs and exact text to this run before sending it.
        known={str(r['id']):r['text_content'] for r in conn.execute('SELECT o.id,o.text_content FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id WHERE ro.run_id=%s',(run_id,))}
        if any(known.get(r['record_id'])!=r['text'] for r in records):raise ValueError('Input does not match stored run evidence')
        conn.execute("INSERT INTO rmu.model_requests(workspace_id,id,run_id,request_hash,prompt_hash,model,state,reserved_microusd) VALUES(%s,%s,%s,%s,%s,%s,'reserved',%s)",(ws,request_id,run_id,identity,metadata['prompt_hash'],MODEL,reserve))
    req=Request('https://api.openai.com/v1/responses',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
    # Failure retains reservation. No automatic retry, including incomplete/refused output.
    with urlopen(req,timeout=180) as response:payload=json.load(response)
    with transaction() as conn:
        conn.execute("UPDATE rmu.model_requests SET state='received',response_id=%s,usage=%s WHERE id=%s",(payload.get('id'),Jsonb(payload.get('usage')),request_id))
    if payload.get('status')!='completed':raise Conflict('Model output incomplete; inspect request receipt')
    parts=[c['text'] for o in payload.get('output',[]) if o.get('type')=='message' for c in o.get('content',[]) if c.get('type')=='output_text']
    return json.loads(''.join(parts)),request_id,metadata,payload
