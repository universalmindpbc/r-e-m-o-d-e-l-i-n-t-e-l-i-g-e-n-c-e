import csv,io,json,unittest
from rmu_backend.exports import render_csv,safe_cell
class Exports(unittest.TestCase):
 def test_formula_injection(self):
  for value in ['=1+1','+CMD','-1+2','@SUM(A1)','  =1+1','\t=1']:
   self.assertTrue(safe_cell(value).startswith("'"))
  self.assertEqual(safe_cell('ordinary text'),'ordinary text')
 def test_complete_rows_and_original_text(self):
  run=dict(id='run',campaign={'name':'CLF'},source_type='observed',evidence_lane='cause',query='q',starts_on='2022-01-01',ends_on='2022-04-30')
  posts=[dict(id=str(i),post_id=str(1000000000000000000+i),source_url='https://x.com/i/web/status/'+str(i),author_id='a',created_at='2022-01-01',retrieved_at='2026-10-14',post_type='original',language='en',text_content='=formula, "quote"\nsecond line',cohort='uncertain',cohort_evidence={},metrics={}) for i in range(31)]
  result=render_csv(run,posts,[]);rows=list(csv.DictReader(io.StringIO(result.decode('utf-8-sig'))))
  self.assertEqual(len(rows),31);self.assertEqual(rows[-1]['post_id'],posts[-1]['post_id'])
  self.assertEqual(json.loads(rows[0]['post_text_json']),posts[0]['text_content'])
  self.assertTrue(rows[0]['post_text'].startswith("'="));self.assertEqual(rows[0]['classification_status'],'not_classified')
  self.assertEqual(rows[0]['climate_justice_stance'],'')
