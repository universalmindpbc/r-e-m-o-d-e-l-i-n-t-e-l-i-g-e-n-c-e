import unittest
from rmu_backend.approved_panels import aggregate,THEMES
class ApprovedMapping(unittest.TestCase):
 def test_author_denominator_and_conflicting_stance(self):
  rows=[{'record_id':'a','cohort':'talent','author_id':'talent'},{'record_id':'b','cohort':'inferred_fan','author_id':'fan'},{'record_id':'c','cohort':'inferred_fan','author_id':'fan'}]
  codes=[{'observation_id':r['record_id'],'theme':t,'stance':'opposition' if r['record_id']=='c' else 'support','evidence_span':'quote','review_state':'pending','provenance':{'relevance':'relevant','reason':'test'}} for r in rows for t in THEMES]
  result=aggregate(rows,codes)
  self.assertEqual(result['fanAccounts'],1);self.assertEqual(result['fanPosts'],2);self.assertEqual(result['talentPosts'],1)
  self.assertEqual(result['themes'][0]['stance'],[0,0,1,0]);self.assertEqual(result['priorities'],0);self.assertEqual(result['reviewedLabels'],0)
 def test_unclear_is_in_denominator(self):
  rows=[{'record_id':'a','cohort':'inferred_fan','author_id':'fan'}]
  codes=[{'observation_id':'a','theme':t,'stance':'no_clear_position','evidence_span':None,'review_state':'pending','provenance':{'relevance':'uncertain','reason':'No explicit position'}} for t in THEMES]
  result=aggregate(rows,codes);self.assertEqual(result['themes'][0]['stance'],[0,0,0,1]);self.assertEqual(result['fanAccounts'],1)
 def test_full_public_conversation_includes_uncertain_and_other_not_organisation(self):
  rows=[{'record_id':str(i),'cohort':cohort,'author_id':author} for i,(cohort,author) in enumerate([('talent','t'),('organisation','o'),('inferred_fan','f'),('uncertain','u'),('uncertain','u'),('other','v')])]
  codes=[{'observation_id':r['record_id'],'theme':t,'stance':'support','evidence_span':'quote','review_state':'pending','provenance':{'relevance':'relevant','reason':'test'}} for r in rows for t in THEMES]
  result=aggregate(rows,codes)
  self.assertEqual(result['fanPosts'],4);self.assertEqual(result['fanAccounts'],3)
  self.assertEqual(result['organisationPosts'],1);self.assertEqual(result['inferredFanAccounts'],1)
  self.assertEqual(result['themes'][0]['stance'],[3,0,0,0]);self.assertEqual(result['audienceScope'],'public_conversation')
