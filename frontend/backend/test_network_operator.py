import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import network_operator as n
class BudgetTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.old=n.FOLDER;n.FOLDER=Path(self.temp.name)
 def tearDown(self):n.FOLDER=self.old;self.temp.cleanup()
 def test_budget_blocks_network_before_spend(self):
  n.save(n.FOLDER/'ledger.json',{'requests':[{'id':'prior','state':'received','reserve_microusd':24900000,'estimate_microusd':24900000}]})
  with patch.object(n,'urlopen') as call:
   with self.assertRaisesRegex(RuntimeError,'cap'):n.paid('test','https://example.invalid',None,200000,'fake',lambda d:0)
   call.assert_not_called()
 def test_uncertain_request_is_not_retried(self):
  with patch.object(n,'urlopen',side_effect=TimeoutError) as call:
   with self.assertRaises(TimeoutError):n.paid('test','https://example.invalid',None,200000,'fake',lambda d:0)
   with self.assertRaisesRegex(RuntimeError,'Uncertain'):n.paid('test','https://example.invalid',None,200000,'fake',lambda d:0)
   self.assertEqual(call.call_count,1)
  self.assertEqual(json.loads((n.FOLDER/'ledger.json').read_text())['requests'][0]['reserve_microusd'],200000)
 def test_received_request_reuses_receipt(self):
  class Result:
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self):return b'{"data":[]}'
  with patch.object(n,'urlopen',return_value=Result()) as call:
   for _ in range(2):self.assertEqual(n.paid('test','https://example.invalid',None,200000,'fake',lambda d:0),{'data':[]})
   self.assertEqual(call.call_count,1)
if __name__=='__main__':unittest.main()
