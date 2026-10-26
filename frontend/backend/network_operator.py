"""Operator-only Network demo, US$25 shared cap, durable receipts, no retries."""
import json,os,sys,hashlib,fcntl
from pathlib import Path
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from urllib.parse import urlencode
BASE=Path(__file__).parent;FOLDER=BASE/'private/network-demo';CAP=25_000_000
def now():return datetime.now(timezone.utc).isoformat()
def save(path,data):
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2));os.chmod(tmp,0o600);tmp.replace(path)
def paid(label,url,body,reserve,token,cost):
 with (FOLDER/'ledger.lock').open('a') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX)
  file=FOLDER/'ledger.json';ledger=json.loads(file.read_text()) if file.exists() else {'cap_microusd':CAP,'requests':[]}
  ident=hashlib.sha256((url+json.dumps(body,sort_keys=True)).encode()).hexdigest()
  old=next((r for r in ledger['requests'] if r['id']==ident),None);receipt=FOLDER/(ident+'.json')
  if old:
   if old['state']=='received' and receipt.exists():return json.loads(receipt.read_text())
   raise RuntimeError('Uncertain previous request; reconcile before retry')
  if any(r['state']=='reserved' for r in ledger['requests']):raise RuntimeError('Reconcile pending request first')
  held=sum(r.get('estimate_microusd',r['reserve_microusd']) for r in ledger['requests'])
  if held+reserve>CAP:raise RuntimeError('Network US$25 cap would be exceeded')
  item={'id':ident,'label':label,'at':now(),'state':'reserved','reserve_microusd':reserve};ledger['requests'].append(item);save(file,ledger)
  req=Request(url,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
  with urlopen(req,timeout=240) as response:data=json.load(response)
  save(receipt,data);estimate=cost(data)
  if estimate>reserve:raise RuntimeError('Usage exceeded reservation')
  item.update(state='received',estimate_microusd=estimate);save(file,ledger)
  print(json.dumps({'step':label,'estimate_usd':estimate/1e6,'total_held_usd':(held+estimate)/1e6}),flush=True)
  return data
def profiles():
 audit=json.loads((FOLDER/'audit.json').read_text());ids=sorted(a['id'] for a in audit['authors']);token=None
 for l in (BASE.parent/'.env.local').read_text().splitlines():
  if l.startswith('X_API_BEARER_TOKEN='):token=l.split('=',1)[1].strip().strip(chr(34)+chr(39))
 if not token:raise RuntimeError('X credential unavailable')
 result=[]
 for start in range(0,len(ids),100):
  batch=ids[start:start+100];params={'ids':','.join(batch),'user.fields':'description,public_metrics,verified,protected,url'}
  data=paid('X profile enrichment','https://api.x.com/2/users?'+urlencode(params),None,len(batch)*10000,token,lambda d:len(d.get('data',[]))*10000)
  result.extend(data.get('data',[]))
 save(FOLDER/'profiles.json',{'retrieved_at':now(),'profiles':result})
 print(json.dumps({'requested':len(ids),'returned':len(result),'unavailable':len(ids)-len(result)}))
def screen():
 audit=json.loads((FOLDER/'audit.json').read_text());profiles={p['id']:p for p in json.loads((FOLDER/'profiles.json').read_text())['profiles']};authors=[]
 for a in audit['authors']:
  p=profiles.get(a['id'])
  if not p or p.get('protected') or p.get('username','').lower() in ['rihanna','claralionelfdn']:continue
  authors.append({'id':a['id'],'name':p['name'],'handle':p['username'],'bio':p.get('description',''),'followers':p.get('public_metrics',{}).get('followers_count'),'posts':[{'id':q['post_id'],'text':q['text_content']} for q in a['posts']]})
 props={k:{'type':'string'} for k in ['id','category','rationale','role','alignment','limitation','post_id']}
 props['category']={'type':'string','enum':['Culture','Community','Media','Creators']}
 schema={'type':'object','properties':{'candidates':{'type':'array','minItems':1,'maxItems':30,'items':{'type':'object','properties':props,'required':list(props),'additionalProperties':False}},'gaps':{'type':'string'}},'required':['candidates','gaps'],'additionalProperties':False}
 body={'model':'gpt-6-astra','reasoning':{'effort':'high'},'store':False,'max_output_tokens':9000,'instructions':(BASE/'network_prompt.md').read_text(),'input':json.dumps({'campaign':'Rihanna / CLF climate justice Jan-Apr 2022; current metrics permitted','candidates':authors}),'text':{'format':{'type':'json_schema','name':'network_screen','strict':True,'schema':schema}}}
 reserve=int((len(json.dumps(body).encode())+2048)*12.5+9000*50)
 data=paid('Network candidate screening','https://api.openai.com/v1/responses',body,reserve,os.environ['OPENAI_API_KEY'],lambda d:int(d['usage']['input_tokens']*12.5+d['usage']['output_tokens']*50))
 if data.get('status')!='completed':raise RuntimeError('Incomplete model result retained')
 result=json.loads(''.join(c['text'] for o in data['output'] if o['type']=='message' for c in o['content'] if c['type']=='output_text'))
 lookup={a['id']:a for a in authors};seen=set()
 for c in result['candidates']:
  assert c['id'] in lookup and c['id'] not in seen;seen.add(c['id'])
  assert c['post_id'] in [p['id'] for p in lookup[c['id']]['posts']]
 save(FOLDER/'screen.json',result)
 print(json.dumps([{'handle':lookup[c['id']]['handle'],'followers':lookup[c['id']]['followers'],**c} for c in result['candidates']],ensure_ascii=False,indent=2))
if __name__=='__main__':{'profiles':profiles,'screen':screen}[sys.argv[1]]()
