"""Verify the published demo is grounded in retained source accounts and receipts."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlparse
BASE=Path(__file__).resolve().parent
class SnapshotTests(unittest.TestCase):
 def test_grounding(self):
  data=json.loads((BASE.parent/'server/network-demo.json').read_text())
  audit=json.loads((BASE/'private/network-demo/audit.json').read_text())
  profiles=json.loads((BASE/'private/network-demo/profiles.json').read_text())
  authors={a['id']:a for a in audit['authors']};metrics={p['id']:p for p in profiles['profiles']}
  self.assertEqual(len(data['candidates']),40)
  self.assertEqual(len({c['id'] for c in data['candidates']}),40)
  self.assertEqual(set(c['category'] for c in data['candidates']),{'Culture','Community','Media','Creators'})
  for c in data['candidates']:
   self.assertNotIn(c['handle'].lower(),['rihanna','claralionelfdn'])
   if c['origin']=='observed':
    self.assertEqual(c['followers'],metrics[c['id']]['public_metrics']['followers_count'])
    self.assertEqual(c['observedPosts'],len(authors[c['id']]['posts']))
   else:
    self.assertIsNone(c['followers']);self.assertEqual(c['observedPosts'],0)
   for link in c['evidence']:
    self.assertIn(link['url'].split('/')[-1],[str(p['post_id']) for p in authors[c['id']]['posts']])
   self.assertTrue(c['research']);self.assertTrue(c['limitation'])
   for link in c['research']+c['evidence']:self.assertEqual(urlparse(link['url']).scheme,'https')
  self.assertEqual(sum(c['recommended'] for c in data['candidates']),20)
  self.assertLessEqual(data['costEstimateUsd'],data['budgetUsd'])
if __name__=='__main__': unittest.main()
