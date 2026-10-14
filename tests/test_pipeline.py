import unittest
from datetime import datetime,timezone
from rmu_backend.pipeline import normalize,measure

class PipelineTest(unittest.TestCase):
    def post(self,**changes):
        p=dict(id='fixture-1',author_id='fixture-author',text='Synthetic test',created_at='2022-02-01T00:00:00Z',retrieved_at='2022-03-01T00:00:00Z')
        p.update(changes)
        return p
    def test_missing_metrics_stay_null(self):
        p=normalize(self.post(),True)
        result=measure([dict(p,text_content=p['text'])],'synthetic')
        self.assertIsNone(result['metric_coverage']['impression_count']['sum'])
        self.assertEqual(result['metric_coverage']['impression_count']['known'],0)
        self.assertIsNone(result['alignment'])
    def test_zero_is_measured(self):
        p=normalize(self.post(public_metrics={'like_count':0}),True)
        result=measure([dict(p,text_content=p['text'])],'synthetic')
        self.assertEqual(result['metric_coverage']['like_count'],{'known':1,'denominator':1,'sum':0})
    def test_reposts_not_original_evidence(self):
        p=normalize(self.post(referenced_tweets=[{'type':'retweeted','id':'fixture-source'}]),True)
        result=measure([dict(p,text_content=p['text'])],'synthetic')
        self.assertEqual(result['reposts'],1)
        self.assertEqual(result['eligible_original_reply_quote_posts'],0)
    def test_invalid_records(self):
        for change in [{'created_at':'2022-01-01'}, {'public_metrics':{'like_count':True}}, {'public_metrics':{'like_count':-1}}, {'referenced_tweets':[{'id':'x'}]}, {'retrieved_at':'2021-01-01T00:00:00Z'}]:
            with self.assertRaises(ValueError): normalize(self.post(**change),True)
    def test_no_synthetic_as_observed(self):
        with self.assertRaises(ValueError): normalize(self.post(),False)
