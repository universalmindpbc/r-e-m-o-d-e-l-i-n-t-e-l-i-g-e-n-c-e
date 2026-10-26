"""Read-only audit of the retained CLF sample; private output only."""
import json
from pathlib import Path
from rmu_backend.db import transaction
RUN='0b6e7d76-fd59-49ff-bf5e-d824381c04b4'
def main():
 with transaction() as c:
  rows=list(c.execute('''SELECT DISTINCT ON(o.post_id) o.post_id,o.text_content,o.source_url,o.metrics,p.author_id,p.created_at FROM rmu.run_observations ro JOIN rmu.observations o ON o.workspace_id=ro.workspace_id AND o.id=ro.observation_id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id WHERE ro.run_id=%s ORDER BY o.post_id,o.retrieved_at DESC''',(RUN,)))
 profiles={}
 for path in Path('private').glob('x-response-*.json'):
  payload=json.loads(path.read_text()).get('response',{})
  for p in payload.get('includes',{}).get('users',[]):profiles[p['id']]=p
 authors={}
 for r in rows:
  aid=r['author_id'];a=authors.setdefault(aid,{'id':aid,'profile':profiles.get(aid,{}),'posts':[]})
  a['posts'].append(r)
 out={'run_id':RUN,'posts':len(rows),'authors':list(authors.values())}
 Path('private/network-demo/audit.json').write_text(json.dumps(out,default=str))
 print(json.dumps({'posts':len(rows),'authors':len(authors),'retained_profiles':sum(bool(a['profile']) for a in authors.values()),'most_active':[{'id':a['id'],'handle':a['profile'].get('username'),'posts':len(a['posts'])} for a in sorted(authors.values(),key=lambda a:-len(a['posts']))[:15]]}))
if __name__=='__main__':main()
