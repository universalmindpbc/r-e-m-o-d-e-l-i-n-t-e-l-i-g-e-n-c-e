import json,os
from urllib.request import Request,urlopen
r=Request('https://rmu-intelligence-demo-api.onrender.com/v1/status',headers={'Authorization':'Bearer '+os.environ['RMU_SERVICE_TOKEN']})
try:
 with urlopen(r,timeout=60) as x: print(x.status,x.read().decode())
except Exception as e:print(type(e).__name__,getattr(e,'code',None))
