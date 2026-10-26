import json,sys,csv,io
from rmu_backend.workflows import get
from rmu_backend.exports import export_run
rid=sys.argv[1] if len(sys.argv)>1 else '31161563-75cc-4f89-ad86-d3ff8b09bc0a'
r=get(rid);e=export_run(rid);rows=list(csv.DictReader(io.StringIO(e['content'].decode('utf-8-sig'))))
print(json.dumps({'run_id':rid,'workflow':r['workflow']['state'],'posts':r['evidence_count'],'labels':r['classification_count'],'panels':[f['panel'] for f in r['findings']],'csv_rows':len(rows),'csv_columns':len(rows[0]) if rows else 0,'requests':[{'state':q['state'],'model':q['model']} for q in r['model_requests']]},default=str))
