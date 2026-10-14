import unittest
from rmu_backend.cohorts import classify_author
class Cohorts(unittest.TestCase):
 def test_identity_requires_id(self):
  self.assertEqual(classify_author({'id':'9','username':'rihanna'},'climate',{'talent':'1'})['label'],'uncertain')
  self.assertEqual(classify_author({'id':'1'},'',{'talent':'1'})['label'],'talent')
 def test_profile_signal_is_inference(self):
  self.assertEqual(classify_author({'id':'2','description':'Rihanna Navy'},'Rih',{})['label'],'inferred_fan')
 def test_positive_cause_does_not_make_fan(self):
  self.assertEqual(classify_author({},'I support climate justice and Rihanna',{})['label'],'uncertain')
 def test_substring_not_affinity(self):
  self.assertEqual(classify_author({'description':'navyard'},'Robin',{})['label'],'uncertain')
