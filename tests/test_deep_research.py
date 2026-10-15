import unittest,copy
from rmu_backend.deep_research import collection_stats,validate
class ResearchTests(unittest.TestCase):
 def setUp(self):
  self.rows=[{'record_id':'a','text':'Love her but what does it mean?','cohort':'uncertain'},{'record_id':'b','text':'Show the work','cohort':'organisation'}]
  f={k:'Specific interpretation' for k in ['title','observation','interpretation','value_tension','alternative','implication','message_a','message_b','test','limitation']}
  f.update(views=['Talent','Audience','Society','Shared Values'],evidence=[{'source':'0','quote':'Love her','role':'supports','reading':'Affection'},{'source':'1','quote':'Show the work','role':'context','reading':'Delivery'}])
  self.out={'headline':'A tension','summary':'Evidence','findings':[copy.deepcopy(f) for _ in range(6)]}
 def test_source_validation(self):validate(self.out,self.rows)
 def test_rejects_invented_quote(self):
  self.out['findings'][0]['evidence'][0]['quote']='Everyone loves her'
  with self.assertRaises(ValueError):validate(self.out,self.rows)
 def test_rejects_unknown_source(self):
  self.out['findings'][0]['evidence'][0]['source']='99'
  with self.assertRaises(ValueError):validate(self.out,self.rows)
 def test_repetition_ignores_link_not_meaning(self):
  rows=[{'record_id':str(i),'text':t,'cohort':'uncertain'} for i,t in enumerate(['Same headline https://t.co/a','same headline https://t.co/b','Not the same headline','https://t.co/c'])]
  s=collection_stats(rows)
  self.assertEqual(s['repeated_posts'],2);self.assertEqual(s['repeat_excess'],1);self.assertEqual(s['total'],4)
 def test_missing_perspective_rejected(self):
  for f in self.out['findings']:f['views']=['Audience']
  with self.assertRaises(ValueError):validate(self.out,self.rows)
if __name__=='__main__':unittest.main()
