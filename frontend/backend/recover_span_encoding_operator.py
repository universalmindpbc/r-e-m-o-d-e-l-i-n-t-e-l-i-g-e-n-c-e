"""Recover archived responses with one exact, audited NBSP encoding repair; no provider calls."""
import json,os
from pathlib import Path
from uuid import uuid4
from psycopg.types.json import Jsonb
from rmu_backend.db import transaction
from rmu_backend.inference import validate_classifications,CODEBOOK_VERSION
ids=['203f6c5b-78e7-4217-aa3f-2c64a1f9e490','d0b94395-84d9-4303-8f71-08cf3357d4c7']
for request_id in ids:
 with transaction() as c:
  req=c.execute('SELECT * FROM rmu.model_requests WHERE id=%s FOR UPDATE',(request_id,)).fetchone()
  if req['state']!='received':print('already handled');continue
  archive=json.loads((Path('private')/('model-response-'+request_id+'.json')).read_text());res=archive['response']
  assert archive['request_hash']==req['request_hash'] and res['status']=='completed'
  out=json.loads(''.join(x['text'] for o in res['output'] if o.get('type')=='message' for x in o.get('content',[]) if x.get('type')=='output_text'))
  records=[{'record_id':str(x['id']),'text':x['text_content']} for x in c.execute('SELECT o.id,o.text_content FROM rmu.observations o JOIN rmu.run_observations ro ON ro.observation_id=o.id AND ro.workspace_id=o.workspace_id WHERE ro.run_id=%s',(req['run_id'],))]
  texts={r['record_id']:r['text'] for r in records};subset={x['record_id'] for x in out['classifications']};records=[r for r in records if r['record_id'] in subset];repairs={}
  for x in out['classifications']:
   span=x['evidence_span']
   if span is not None and span not in texts[x['record_id']]:
    assert '\x00a0' in span
    repaired=span.replace('\x00a0','\u00a0');assert repaired in texts[x['record_id']]
    repairs[(x['record_id'],x['theme'])]={'kind':'exact_nbsp_encoding_repair','original_span_json':json.dumps(span),'source_exact_match':True}
    x['evidence_span']=repaired
  validate_classifications(out,records)
  for x in out['classifications']:
   assert not c.execute('SELECT 1 FROM rmu.classifications WHERE observation_id=%s AND codebook_version=%s AND theme=%s',(x['record_id'],CODEBOOK_VERSION,x['theme'])).fetchone()
   provenance={'model':req['model'],'reasoning':'high','prompt_hash':req['prompt_hash'],'request_hash':req['request_hash'],'response_id':res['id'],'relevance':x['relevance'],'reason':x['reason'],'review_required':True,'recovered_from_saved_response':True}
   if (x['record_id'],x['theme']) in repairs:provenance['evidence_span_repair']=repairs[(x['record_id'],x['theme'])]
   c.execute('INSERT INTO rmu.classifications(workspace_id,id,observation_id,codebook_version,theme,stance,evidence_span,provenance) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)',(os.environ['RMU_WORKSPACE_ID'],uuid4(),x['record_id'],CODEBOOK_VERSION,x['theme'],x['stance'],x['evidence_span'],Jsonb(provenance)))
  c.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(request_id,))
  print(json.dumps({'recovered_labels':len(out['classifications']),'audited_nbsp_repairs':len(repairs),'review_status':'pending','new_api_calls':0}))
