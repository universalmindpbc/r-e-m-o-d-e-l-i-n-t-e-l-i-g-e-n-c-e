import os,uuid
from unittest.mock import patch
from rmu_backend import workflows
os.environ['RMU_WORKSPACE_ID']='de000000-0000-4000-8000-000000000002';os.environ['RMU_MODEL_ENABLED']='true'
p={'idempotency_key':str(uuid.uuid4()),'campaign':{'name':'Start QA','talent':'Dolly Parton','agency':'WME','topics':['Imagination Library'],'settings_version':2},'start':'2022-01-19','end':'2022-01-19'}
with patch('rmu_backend.x_collection.configuration',return_value=5000),patch.object(workflows,'kick'):
 r=workflows.start(p);print(r['id'],r['workflow']['state'])
