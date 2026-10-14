import unittest
from rmu_backend.synthesis import PANELS,validate_findings
class Synthesis(unittest.TestCase):
 def valid(self):return {p:dict(status='research_question',seeing='Evidence is missing.',supports=[],challenges=[],limitations=['One evidence lane only.'],change='Review source evidence.',test='Run the planned survey.') for p in PANELS}
 def test_questions_preserve_missing_evidence(self):validate_findings(self.valid(),[])
 def test_unknown_evidence_rejected(self):
  d=self.valid();d['fans']['supports']=['invented']
  with self.assertRaises(ValueError):validate_findings(d,[])
 def test_observation_requires_support(self):
  d=self.valid();d['fans']['status']='observation'
  with self.assertRaises(ValueError):validate_findings(d,[])
 def test_missing_panel_rejected(self):
  d=self.valid();del d['alignment']
  with self.assertRaises(ValueError):validate_findings(d,[])
