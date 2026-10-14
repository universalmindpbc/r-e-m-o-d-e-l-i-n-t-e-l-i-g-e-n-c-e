"""Reserve maximum page cost before any paid network request; uncertainty holds funds."""
from uuid import uuid4,UUID
from .db import transaction
from .pipeline import Conflict,workspace


def reserve(run_id,request_key,cents):
    if type(cents) is not int or cents<=0 or not isinstance(request_key,str) or not 1<=len(request_key)<=200:
        raise ValueError('Invalid spend reservation')
    with transaction() as conn:
        ws=workspace(conn)
        run=conn.execute('SELECT * FROM rmu.runs WHERE id=%s FOR UPDATE',(UUID(str(run_id)),)).fetchone()
        if not run or run['source_type']!='observed' or run['status'] not in ('planned','running'):
            raise Conflict('Run is not available for collection')
        if conn.execute('SELECT 1 FROM rmu.collection_pages WHERE run_id=%s AND request_key=%s',(run['id'],request_key)).fetchone():
            raise Conflict('Page already reserved; reconcile before retrying')
        if conn.execute("SELECT 1 FROM rmu.collection_pages WHERE run_id=%s AND state IN ('reserved','uncertain')",(run['id'],)).fetchone():
            raise Conflict('An outstanding request must be reconciled before another page')
        if run['reserved_cents']+run['charged_cents']+cents>run['budget_cents']:
            raise Conflict('Run budget exhausted')
        page_id=uuid4()
        conn.execute("INSERT INTO rmu.collection_pages(workspace_id,id,run_id,request_key,state,reserved_cents) VALUES(%s,%s,%s,%s,'reserved',%s)",(ws,page_id,run['id'],request_key,cents))
        conn.execute("UPDATE rmu.runs SET reserved_cents=reserved_cents+%s,status='running' WHERE id=%s",(cents,run['id']))
        return str(page_id)


def uncertain(page_id):
    with transaction() as conn:
        page=conn.execute('SELECT * FROM rmu.collection_pages WHERE id=%s FOR UPDATE',(UUID(str(page_id)),)).fetchone()
        if not page or page['state']!='reserved':
            raise Conflict('Reservation cannot be changed')
        conn.execute("UPDATE rmu.collection_pages SET state='uncertain' WHERE id=%s",(page['id'],))
        conn.execute("UPDATE rmu.runs SET status='needs_reconciliation' WHERE id=%s",(page['run_id'],))
