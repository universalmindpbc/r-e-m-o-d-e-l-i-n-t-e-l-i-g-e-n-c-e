"""Versioned price verification window; monetary reservations remain enforced."""
from datetime import date,datetime,timezone

def current(verified_on,today=None):
 try:
  verified=date.fromisoformat(verified_on or '')
 except (TypeError,ValueError):return False
 elapsed=((today or datetime.now(timezone.utc).date())-verified).days
 return 0<=elapsed<=30
