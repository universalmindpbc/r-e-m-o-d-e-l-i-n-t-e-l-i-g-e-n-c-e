"""Bounded activity check for the selected Network research pool."""
import json
from urllib.parse import urlencode
from network_operator import FOLDER,BASE,paid,save,now
selected=json.loads((FOLDER/'screen.json').read_text())['candidates']
ids=[c['id'] for c in selected if c['id'] not in ['1125756196907044864','1397533443790184450']]+['250295256','1280672663611023360']
profiles={p['id']:p for p in json.loads((FOLDER/'profiles.json').read_text())['profiles']}
for l in (BASE.parent/'.env.local').read_text().splitlines():
 if l.startswith('X_API_BEARER_TOKEN='):token=l.split('=',1)[1].strip().strip(chr(34)+chr(39))
results={}
for ident in ids:
 params={'max_results':10,'tweet.fields':'created_at,public_metrics','exclude':'retweets,replies'}
 data=paid('X recent activity '+profiles[ident]['username'],'https://api.x.com/2/users/'+ident+'/tweets?'+urlencode(params),None,50000,token,lambda d:len(d.get('data',[]))*5000)
 posts=data.get('data',[]);results[ident]={'checked_at':now(),'posts':posts,'errors':data.get('errors',[])}
 print(json.dumps({'handle':profiles[ident]['username'],'returned':len(posts),'latest':posts[0].get('created_at') if posts else None}),flush=True)
save(FOLDER/'recent.json',results)
