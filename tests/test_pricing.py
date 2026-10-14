from datetime import date
import unittest
from rmu_backend.pricing import current
class Pricing(unittest.TestCase):
 def test_window(self):
  now=date(2026,10,14)
  self.assertTrue(current('2026-10-14',now));self.assertTrue(current('2026-09-14',now))
  self.assertFalse(current('2026-09-13',now));self.assertFalse(current('2026-10-15',now));self.assertFalse(current(None,now))
