import unittest
from rmu_backend.inference import validate_classifications,THEMES
class Inference(unittest.TestCase):
 def valid(self):
  return {'classifications':[dict(record_id='a',theme=t,relevance='uncertain',stance='no_clear_position',evidence_span=None,reason='Ambiguous') for t in THEMES]}
 def test_requires_complete_coverage(self):
  d=self.valid();d['classifications'].pop()
  with self.assertRaises(ValueError):validate_classifications(d,[{'record_id':'a','text':'hello'}])
 def test_rejects_invented_quote(self):
  d=self.valid();d['classifications'][0]['evidence_span']='invented'
  with self.assertRaises(ValueError):validate_classifications(d,[{'record_id':'a','text':'hello'}])
 def test_uncertainty_allowed(self):
  validate_classifications(self.valid(),[{'record_id':'a','text':'hello'}])
 def test_rejects_unknown_source(self):
  d=self.valid();d['classifications'][0]['record_id']='fake'
  with self.assertRaises(ValueError):validate_classifications(d,[{'record_id':'a','text':'hello'}])
