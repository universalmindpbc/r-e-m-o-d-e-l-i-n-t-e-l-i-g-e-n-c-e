"""On-demand entrypoint. No always-on worker or recurring paid service."""
import json
from .pipeline import process_one
if __name__ == '__main__':
    print(json.dumps(process_one(),default=str))
