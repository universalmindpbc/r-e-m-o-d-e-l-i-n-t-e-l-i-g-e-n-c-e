import copy,unittest
from rmu_backend.contextual import schema,RULES
from rmu_backend.inference import validate_classifications
class ContextContract(unittest.TestCase):
 def record(self,text,stance='support',format='news_report',framing='favourable',relevance='relevant',absence=None):
  return {'record_id':'a','theme':'public transport','relevance':relevance,'stance':stance,'evidence_span':text if stance!='no_clear_position' else None,'reason':'Evidence in the supplied wording','context':{'format':format,'framing':framing,'framing_target':'public transport initiative','framing_span':text,'stance_basis':'contextual' if stance!='no_clear_position' else 'no_position','no_position_reason':absence}}
 def check(self,row,text):return validate_classifications({'classifications':[row]},[{'record_id':'a','text':text}],themes=['public transport'],contextual=True)
 def test_news_all_stances_and_arbitrary_subject(self):
  for text,stance,frame,absence in [('Excellent new public transport plan','support','favourable',None),('This public transport plan is a disgrace','opposition','critical',None),('Good public transport but unaffordable fares','mixed','mixed',None),('Public transport plan announced today','no_clear_position','descriptive','descriptive')]:
   self.check(self.record(text,stance,framing=frame,absence=absence),text)
 def test_affection_and_question_does_not_require_cause_agreement(self):
  text='I love this singer, but what does public transport funding mean?'
  self.check(self.record(text,'no_clear_position','question','favourable',absence='question_only'),text)
 def test_emoji_context(self):
  text='Public transport funding approved! 👏'
  self.check(self.record(text,format='personal_reaction'),text)
 def test_no_context_and_fabricated_quote_fail(self):
  text='Great plan';row=self.record(text);row['context']['framing_span']='invented'
  self.assertRaises(ValueError,self.check,row,text)
  row=self.record(text);del row['context'];self.assertRaises(ValueError,self.check,row,text)
 def test_relevance_and_stance_are_consistent(self):
  text='Buy my makeup';row=self.record(text,'no_clear_position','promotion','descriptive','not_relevant','not_discussed');self.check(row,text)
  row['context']['no_position_reason']='descriptive';self.assertRaises(ValueError,self.check,row,text)
 def test_basis_must_match_stance(self):
  row=self.record('Excellent');row['context']['stance_basis']='no_position';self.assertRaises(ValueError,self.check,row,'Excellent')
 def test_schema_requires_separate_context(self):
  properties=schema(['new topic'])['properties']['classifications']['items']['properties']
  self.assertIn('context',properties);self.assertIn('news_report',properties['context']['properties']['format']['enum'])
 def test_legacy_entrypoint_also_uses_contextual_contract(self):
  import os
  from unittest.mock import patch,MagicMock
  from rmu_backend import inference
  rows=[{'record_id':'a','text':'Excellent climate action'}]
  result={'classifications':[]}
  for theme in inference.THEMES:
   row=self.record(rows[0]['text']);row['theme']=theme;result['classifications'].append(row)
  conn=MagicMock();transaction=MagicMock();transaction.return_value.__enter__.return_value=conn
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only','RMU_WORKSPACE_ID':'test-workspace'}),patch.object(inference,'transaction',transaction),patch.object(inference,'request_model',return_value=(result,'receipt',{'prompt_hash':'test','request_hash':'test'},{'id':'response','usage':{}})) as request:
   inference.request_classifications(rows,'test-run')
   body=request.call_args.args[0]
   self.assertIn('context',body['text']['format']['schema']['properties']['classifications']['items']['properties'])
   self.assertIn('Format is independent of stance',body['instructions'])
   self.assertEqual(conn.execute.call_count,5)
