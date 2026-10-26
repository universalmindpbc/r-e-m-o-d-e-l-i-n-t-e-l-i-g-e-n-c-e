import json
from rmu_backend.approved_panels import populate
r=populate('0b6e7d76-fd59-49ff-bf5e-d824381c04b4')
print(json.dumps({'version':r['version'],'talent_posts':r['overview']['talentPosts'],'fan_accounts':r['overview']['fanAccounts'],'mapped_fields':list(r['messaging'])}))
