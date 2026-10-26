"""Explicit acceleration of unclassified cause batches; identical ledger hashes prevent duplicate calls."""
import json
from concurrent.futures import ThreadPoolExecutor,as_completed
from analyse_retained import pending,RUNS
from rmu_backend.inference import request_classifications
from rmu_backend.pipeline import Conflict
run=RUNS[2]
# The existing operator owns the earliest in-flight batch. Remaining fixed 20-record
# boundaries match its request hashes, so overlap is rejected before provider access.
records=pending(run)[20:]
batches=[records[i:i+20] for i in range(0,len(records),20)]
def process(batch):
 try:return request_classifications(batch,run)
 except Conflict as e:
  if str(e)=='Model request already recorded; no retry':return {'state':'already_recorded'}
  raise
with ThreadPoolExecutor(max_workers=2) as pool:
 for f in as_completed([pool.submit(process,b) for b in batches]):
  try:print(json.dumps(f.result()),flush=True)
  except Exception as e:print(json.dumps({'state':'needs_review','error_type':type(e).__name__}),flush=True)
