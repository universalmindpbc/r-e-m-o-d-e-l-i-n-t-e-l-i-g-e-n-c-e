import json,pathlib
from rmu_backend.db import transaction
b=pathlib.Path(__file__).parent
with transaction() as c:
 runs=list(c.execute("SELECT id,evidence_lane,status,budget_cents,reserved_cents,charged_cents,coverage FROM rmu.runs WHERE source_type='observed' ORDER BY created_at"))
 for run in runs:
  run['posts']=c.execute('SELECT count(DISTINCT o.post_id) AS n FROM rmu.run_observations ro JOIN rmu.observations o ON o.workspace_id=ro.workspace_id AND o.id=ro.observation_id WHERE ro.run_id=%s',(run['id'],)).fetchone()['n']
  run['resource_estimate_microusd']=c.execute("SELECT coalesce(sum((checkpoint->>'estimated_cost_microusd')::bigint),0) AS n FROM rmu.collection_pages WHERE run_id=%s",(run['id'],)).fetchone()['n']
 count=c.execute("SELECT count(*) AS n FROM rmu.posts WHERE source_type='observed'").fetchone()['n']
 cohorts=list(c.execute("SELECT cohort,count(DISTINCT post_id) AS posts FROM rmu.observations WHERE source_type='observed' GROUP BY cohort"))
receipt={'runs':runs,'distinct_posts_across_runs':count,'cohorts':cohorts,'reserved_cents_including_access':sum(r['reserved_cents']+r['charged_cents'] for r in runs)+3,'estimated_successful_resources_microusd_including_access':sum(r['resource_estimate_microusd'] for r in runs)+30000,'actual_billing':'unreconciled','model_calls':0,'model_blocker':'OpenAI key not available in accessible I AM configuration','prolific_status':'pending survey data'}
(b/'private/campaign-receipt.json').write_text(json.dumps(receipt,default=str,indent=2))
print(json.dumps(receipt,default=str))
