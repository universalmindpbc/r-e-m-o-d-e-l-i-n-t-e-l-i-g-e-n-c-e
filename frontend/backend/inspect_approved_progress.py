import json
from rmu_backend.db import transaction
with transaction() as c:
 print(json.dumps({'coding':list(c.execute("SELECT codebook_version,count(*) FROM rmu.classifications cl JOIN rmu.run_observations ro ON ro.observation_id=cl.observation_id WHERE ro.run_id=%s GROUP BY codebook_version",('0b6e7d76-fd59-49ff-bf5e-d824381c04b4',))),'requests':list(c.execute("SELECT state,created_at,usage->>'output_tokens' AS output_tokens FROM rmu.model_requests WHERE created_at>now()-interval '20 minutes' ORDER BY created_at"))},default=str))
