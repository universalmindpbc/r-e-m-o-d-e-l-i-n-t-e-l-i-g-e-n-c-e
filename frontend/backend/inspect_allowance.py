import json
from rmu_backend.db import transaction
with transaction() as c:
 print(json.dumps(dict(c.execute("SELECT count(*) requests,coalesce(sum(CASE WHEN (state='validated' OR resolution IS NOT NULL) AND usage ? '_rmu_cost_ceiling_microusd' THEN (usage->>'_rmu_cost_ceiling_microusd')::bigint ELSE reserved_microusd END),0) accounted_microusd FROM rmu.model_requests").fetchone()),default=str))
