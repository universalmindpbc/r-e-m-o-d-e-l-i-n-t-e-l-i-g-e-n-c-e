import json,difflib
from pathlib import Path
from rmu_backend.db import transaction
with transaction() as c:
 for r in c.execute("SELECT id FROM rmu.model_requests WHERE state='received'"):
  p=Path('private')/('model-response-'+str(r['id'])+'.json')
  if not p.exists():continue
  res=json.loads(p.read_text())['response'];out=json.loads(''.join(x['text'] for o in res['output'] if o.get('type')=='message' for x in o.get('content',[]) if x.get('type')=='output_text'))
  for x in out['classifications']:
   span=x['evidence_span']
   if span is None:continue
   text=c.execute('SELECT text_content FROM rmu.observations WHERE id=%s',(x['record_id'],)).fetchone()['text_content']
   if span not in text:
    print(json.dumps({'request':str(r['id']),'record':x['record_id'],'theme':x['theme'],'span':span,'source':text},ensure_ascii=False))
