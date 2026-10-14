"""Bounded Astra classification adapter. No public execution route or automatic retries."""
import json,os,hashlib
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
    identity=digest(body);folder=BASE/'private/model-requests';folder.mkdir(parents=True,exist_ok=True,mode=0o700)
    receipt=folder/(identity+'.json')
    if receipt.exists():raise Conflict('Request already recorded; inspect receipt instead of retrying')
    # An operator must set a finite call limit and input budget; high effort can be costly.
    cap=int(os.environ.get('RMU_MODEL_MAX_CALLS','0'))
    if not 1<=cap<=100 or len(list(folder.glob('*.json')))>=cap:raise Conflict('Model call allowance exhausted or unset')
    if len(body['input'].encode())>40000:raise ValueError('Batch exceeds input size bound')
    input_rate=int(os.environ.get('RMU_MODEL_INPUT_MICROUSD_PER_TOKEN','0'))
    output_rate=int(os.environ.get('RMU_MODEL_OUTPUT_MICROUSD_PER_TOKEN','0'))
    budget=int(os.environ.get('RMU_MODEL_BUDGET_MICROUSD','0'))
    reserve=(len(json.dumps(body).encode())+2048)*input_rate+body['max_output_tokens']*output_rate
    held=sum(json.loads(p.read_text()).get('reserved_microusd',0) for p in folder.glob('*.json'))
    if input_rate<=0 or output_rate<=0 or budget<=0 or held+reserve>budget:
        raise Conflict('Verified model pricing and sufficient separate budget required')
    with receipt.open('x') as f:
        os.chmod(receipt,0o600);json.dump({'state':'reserved','reserved_microusd':reserve,'run_id':run_id,'request_hash':identity,'model':MODEL,'prompt_hash':hashlib.sha256(instructions.encode()).hexdigest()},f)
    req=Request('https://api.openai.com/v1/responses',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
    # Failure retains reservation. No automatic retry, including incomplete/refused output.
    with urlopen(req,timeout=180) as response:payload=json.load(response)
    metadata=json.loads(receipt.read_text());metadata.update(state='received',provider_response_id=payload.get('id'),usage=payload.get('usage'))
    receipt.write_text(json.dumps(metadata));
    if payload.get('status')!='completed':raise Conflict('Model output incomplete; inspect request receipt')
    parts=[c['text'] for o in payload.get('output',[]) if o.get('type')=='message' for c in o.get('content',[]) if c.get('type')=='output_text']
    result=validate_classifications(json.loads(''.join(parts)),records)
    with transaction() as conn:
        ws=os.environ['RMU_WORKSPACE_ID']
        for item in result['classifications']:
            conn.execute('''INSERT INTO rmu.classifications(workspace_id,id,observation_id,codebook_version,theme,stance,evidence_span,provenance) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)''',(ws,uuid4(),item['record_id'],CODEBOOK_VERSION,item['theme'],item['stance'],item['evidence_span'],Jsonb({'model':MODEL,'reasoning':'high','prompt_hash':metadata['prompt_hash'],'request_hash':identity,'response_id':payload.get('id'),'relevance':item['relevance'],'reason':item['reason'],'review_required':True})))
    metadata['state']='validated_and_stored';receipt.write_text(json.dumps(metadata))
    return {'stored':len(result['classifications']),'review_status':'pending','usage':payload.get('usage')}
