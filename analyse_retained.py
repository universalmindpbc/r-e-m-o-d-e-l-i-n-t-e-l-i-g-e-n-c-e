"""Explicit operator analysis of completed observed runs; no automatic retries."""
import json,sys
from concurrent.futures import ThreadPoolExecutor
from rmu_backend.db import transaction
from rmu_backend.inference import request_classifications,CODEBOOK_VERSION,THEMES
RUNS=['feabb527-f5f0-4dfc-ac5d-78220dfdd107','2d37cfb9-75ef-4463-8ee1-af934f1d2c82','babb5680-97a6-481a-b268-8751a2a41320']
def pending(run_id):
 with transaction() as c:
  return [dict(record_id=str(r['id']),text=r['text_content']) for r in c.execute('''SELECT DISTINCT ON(o.post_id) o.id,o.text_content FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id JOIN rmu.runs r ON r.workspace_id=ro.workspace_id AND r.id=ro.run_id WHERE ro.run_id=%s AND r.status='complete' AND r.source_type='observed' AND o.text_content IS NOT NULL AND o.post_type!='repost' AND NOT EXISTS(SELECT 1 FROM rmu.classifications cl WHERE cl.workspace_id=o.workspace_id AND cl.observation_id=o.id AND cl.codebook_version=%s) ORDER BY o.post_id,o.retrieved_at DESC''',(run_id,CODEBOOK_VERSION))]
def process_run(run,pilot=False):
 records=pending(run)
 if pilot:records=records[:5]
 for i in range(0,len(records),20):
  batch=records[i:i+20]
  print(json.dumps({'run':run,'batch_posts':len(batch),'state':'requesting'}),flush=True)
  result=request_classifications(batch,run)
  print(json.dumps({'run':run,**result}),flush=True)
def main():
 if '--pilot' in sys.argv:process_run(RUNS[0],True)
 else:
  with ThreadPoolExecutor(max_workers=3) as pool:
   for result in pool.map(process_run,RUNS):pass
if __name__=='__main__':main()
