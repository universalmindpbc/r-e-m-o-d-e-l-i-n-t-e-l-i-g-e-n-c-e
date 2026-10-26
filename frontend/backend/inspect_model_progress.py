import json
from rmu_backend.db import transaction
with transaction() as c:
 print(json.dumps(list(c.execute("SELECT state,created_at,response_id IS NOT NULL AS response_received,usage FROM rmu.model_requests WHERE run_id=%s ORDER BY created_at",('31161563-75cc-4f89-ad86-d3ff8b09bc0a',))),default=str))
