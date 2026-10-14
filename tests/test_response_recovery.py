import io,json,tempfile,unittest
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch
from rmu_backend import inference
class ResponseRecovery(unittest.TestCase):
 def test_paid_response_persists_before_ephemeral_file_failure(self):
  writes=[]
  class Result:
   def __init__(self,row=None,rows=()):self.row=row;self.rows=rows
   def fetchone(self):return self.row
   def __iter__(self):return iter(self.rows)
  class Connection:
   def execute(self,sql,params=()):
    if 'AS held' in sql:return Result({'held':0,'n':0})
    if 'SELECT o.id,o.text_content' in sql:return Result(rows=[{'id':'a','text_content':'Source text'}])
    if sql.startswith('UPDATE rmu.model_requests'):writes.append((sql,params))
    return Result()
  @contextmanager
  def tx():yield Connection()
  payload={'id':'response-test','status':'completed','usage':{'input_tokens':10,'output_tokens':10},'output':[]}
  env={'OPENAI_API_KEY':'test-only','RMU_MODEL_MAX_CALLS':'60','RMU_MODEL_BUDGET_MICROUSD':'30000000','RMU_MODEL_INPUT_MICROUSD_PER_TOKEN':'12.5','RMU_MODEL_OUTPUT_MICROUSD_PER_TOKEN':'50','RMU_WORKSPACE_ID':'test'}
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);(root/'private').write_text('File prevents archive directory creation')
   with patch.dict(inference.os.environ,env),patch.object(inference,'current_pricing',return_value=True),patch.object(inference,'transaction',tx),patch.object(inference,'BASE',root),patch.object(inference,'urlopen',return_value=io.StringIO(json.dumps(payload))):
    with self.assertRaises(FileExistsError):inference.request_model({'instructions':'Test','input':'Source text','max_output_tokens':100},[{'record_id':'a','text':'Source text'}],'run')
  self.assertEqual(len(writes),1)
  self.assertIn('response_payload',writes[0][0]);self.assertEqual(writes[0][1][2].obj,payload)
