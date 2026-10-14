"""Local operator helper: load ignored environment without printing credentials."""
import os
import runpy
import sys
from pathlib import Path
for line in (Path(__file__).parent / '.env.local').read_text().splitlines():
    if line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ.setdefault(key, value)
module = sys.argv[1]
sys.argv = sys.argv[1:]
runpy.run_module(module, run_name='__main__')
