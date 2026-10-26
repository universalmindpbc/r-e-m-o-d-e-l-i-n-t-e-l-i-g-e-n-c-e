import json
from rmu_backend.db import transaction
with transaction() as c:
 print(json.dumps(list(c.execute("SELECT o.cohort,count(*),count(distinct p.author_id) authors FROM rmu.observations o JOIN rmu.run_observations ro ON ro.observation_id=o.id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.post_id=o.post_id AND p.provider=o.provider AND p.source_type=o.source_type WHERE ro.run_id=%s GROUP BY o.cohort",('0b6e7d76-fd59-49ff-bf5e-d824381c04b4',))),default=str))
