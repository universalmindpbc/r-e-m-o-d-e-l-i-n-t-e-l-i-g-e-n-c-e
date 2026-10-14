import json,tempfile,unittest
from pathlib import Path
from rmu_backend.operations import restore_snapshot
from rmu_backend.pipeline import digest,Conflict
class Operations(unittest.TestCase):
 def test_corrupt_backup_rejected_before_sql(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.json';p.write_text(json.dumps({'format':'rmu-workspace-v1','tables':{},'sha256':'bad'}))
   with self.assertRaises(ValueError):restore_snapshot(None,p)
 def test_tombstones_block_unsafe_restore(self):
  with tempfile.TemporaryDirectory() as d:
   rows={'deletion_register':[{'post_id':'123'}]};p=Path(d)/'test.json';p.write_text(json.dumps({'format':'rmu-workspace-v1','tables':rows,'sha256':digest(rows)}))
   with self.assertRaises(Conflict):restore_snapshot(None,p)
