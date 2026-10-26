from rmu_backend.db import transaction
import json
with transaction() as c:
 print(json.dumps(list(c.execute("SELECT r.id,r.campaign,r.status,r.created_at,w.state,w.error FROM rmu.runs r LEFT JOIN rmu.workflows w ON w.run_id=r.id WHERE r.created_at>now()-interval '20 minutes' ORDER BY r.created_at DESC")),default=str))
