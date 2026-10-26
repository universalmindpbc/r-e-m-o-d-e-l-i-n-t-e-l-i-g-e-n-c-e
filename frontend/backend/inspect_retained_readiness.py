import json
from rmu_backend.db import transaction
sources=['feabb527-f5f0-4dfc-ac5d-78220dfdd107','2d37cfb9-75ef-4463-8ee1-af934f1d2c82','babb5680-97a6-481a-b268-8751a2a41320']
with transaction() as c:
 rows=list(c.execute("WITH chosen AS (SELECT DISTINCT ON(o.post_id) o.id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id WHERE ro.run_id=ANY(%s::uuid[]) ORDER BY o.post_id,o.retrieved_at DESC) SELECT count(*) AS posts,count(*) FILTER(WHERE labels=4) AS fully_coded FROM (SELECT ch.id,count(DISTINCT cl.theme) labels FROM chosen ch LEFT JOIN rmu.classifications cl ON cl.observation_id=ch.id AND cl.codebook_version='clf-proposed-v1' GROUP BY ch.id) x",(sources,)))
 print(json.dumps(rows,default=str))
