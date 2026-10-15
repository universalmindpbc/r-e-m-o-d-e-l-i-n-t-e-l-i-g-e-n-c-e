import unittest
from rmu_backend.campaign_priorities import validate
class PriorityTests(unittest.TestCase):
 def setUp(self):
  self.rows=[{'cohort':'talent'},{'cohort':'organisation'},{'cohort':'uncertain'}]
  self.out={'topics':[{'name':'Transport access','client':['0','1'],'support':['2'],'challenge':[],'mixed':[],'discussion':[]}],'outside':[]}
 def test_organisation_is_client(self):validate(self.out,self.rows)
 def test_missing_post_rejected(self):
  self.out['topics'][0]['support']=[]
  with self.assertRaises(ValueError):validate(self.out,self.rows)
 def test_wrong_attribution_rejected(self):
  self.out['topics'][0]['client']=['0'];self.out['topics'][0]['support']=['1','2']
  with self.assertRaises(ValueError):validate(self.out,self.rows)
 def test_outside_overlap_rejected(self):
  self.out['outside']=['2']
  with self.assertRaises(ValueError):validate(self.out,self.rows)
 def test_sparse_no_client_topic(self):validate({'topics':[],'outside':['0','1','2']},self.rows)
