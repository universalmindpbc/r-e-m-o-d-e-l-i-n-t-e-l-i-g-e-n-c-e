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
   with patch.dict(inference.os.environ,env),patch.object(inference,'current_pricing',return_value=True),patch.object(inference,'transaction',tx),patch.object(inference,'BASE',root),patch.object(inference,'urlopen',return_value=io.StringIO(json.dumps(payload))) as provider:
    with self.assertRaises(FileExistsError):inference.request_model({'instructions':'Test','input':'Source text','max_output_tokens':100},[{'record_id':'a','text':'Source text'}],'run',full_collection=True)
    self.assertEqual(provider.call_args.kwargs['timeout'],900)
  self.assertEqual(len(writes),1)
  self.assertIn('response_payload',writes[0][0]);self.assertEqual(writes[0][1][2].obj,payload)
 def test_authorised_recovery_is_single_use(self):
  body={'instructions':'Test','input':'Source text','max_output_tokens':100}
  original=inference.digest(body);recorded=set()
  class Result:
   def __init__(self,row=None,rows=()):self.row=row;self.rows=rows
   def fetchone(self):return self.row
   def __iter__(self):return iter(self.rows)
  class Connection:
   def execute(self,sql,params=()):
    if sql.startswith('SELECT id,resolution'):return Result({'id':'old-request','resolution':{'outcome':'retry_authorised'}} if params[0]==original else None)
    if 'AS held' in sql:return Result({'held':1000000,'n':1})
    if sql.startswith('SELECT 1 FROM rmu.model_requests'):return Result({'exists':True} if params[0] in recorded else None)
    if 'SELECT o.id,o.text_content' in sql:return Result(rows=[{'id':'a','text_content':'Source text'}])
    if sql.startswith('INSERT INTO rmu.model_requests'):recorded.add(params[3])
    return Result()
  @contextmanager
  def tx():yield Connection()
  payload={'id':'replacement','status':'completed','usage':{'input_tokens':10,'output_tokens':10},'output':[{'type':'message','content':[{'type':'output_text','text':'{}'}]}]}
  env={'OPENAI_API_KEY':'test-only','RMU_MODEL_MAX_CALLS':'60','RMU_MODEL_BUDGET_MICROUSD':'32000000','RMU_MODEL_INPUT_MICROUSD_PER_TOKEN':'12.5','RMU_MODEL_OUTPUT_MICROUSD_PER_TOKEN':'50','RMU_WORKSPACE_ID':'test'}
  with tempfile.TemporaryDirectory() as directory:
   with patch.dict(inference.os.environ,env),patch.object(inference,'current_pricing',return_value=True),patch.object(inference,'transaction',tx),patch.object(inference,'BASE',Path(directory)),patch.object(inference,'urlopen',return_value=io.StringIO(json.dumps(payload))) as provider:
    inference.request_model(body,[{'record_id':'a','text':'Source text'}],'run',full_collection=True)
    sent=json.loads(provider.call_args.args[0].data)
    self.assertEqual(sent['metadata']['rmu_recovery_of'],'old-request')
    with self.assertRaises(inference.Conflict):inference.request_model(body,[{'record_id':'a','text':'Source text'}],'run',full_collection=True)
    self.assertEqual(provider.call_count,1)
