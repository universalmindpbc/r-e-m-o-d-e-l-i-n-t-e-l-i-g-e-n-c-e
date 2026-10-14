"""Operator-only recovery and billing. No public HTTP mutation routes."""
import json
import os
from pathlib import Path
from uuid import UUID
from psycopg import sql
from psycopg.types.json import Jsonb
from .db import transaction
from .pipeline import Conflict,digest

TABLES=['runs','posts','observations','run_observations','jobs','collection_pages','analyses','classifications','findings','finding_evidence','review_events','embeddings','deletion_register','model_requests']

def export_snapshot(path):
    path=Path(path)
    with transaction() as conn:
        conn.execute(sql.SQL('LOCK TABLE {} IN SHARE MODE').format(sql.SQL(',').join(sql.Identifier('rmu',t) for t in ['workspaces']+TABLES)))
        data={t:conn.execute(sql.SQL('SELECT coalesce(jsonb_agg(to_jsonb(t)),\'[]\'::jsonb) AS rows FROM rmu.{} t').format(sql.Identifier(t))).fetchone()['rows'] for t in ['workspaces']+TABLES}
    payload={'format':'rmu-workspace-v1','workspace_id':os.environ['RMU_WORKSPACE_ID'],'tables':data,'sha256':digest(data)}
    path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    with path.open('x') as out:
        os.chmod(path,0o600);json.dump(payload,out,default=str)
    return {'sha256':payload['sha256'],'counts':{t:len(rows) for t,rows in data.items()}}

def restore_snapshot(conn,path):
    """Restore only to an empty isolated database initialized from the migrations.

    Before disaster recovery, replay the current deletion register and retention
    cutoff. This function refuses snapshots with tombstones so they cannot be
    restored without that explicit review.
    """
    payload=json.loads(Path(path).read_text())
    if payload['format']!='rmu-workspace-v1' or digest(payload['tables'])!=payload['sha256']:
        raise ValueError('Snapshot integrity check failed')
    if payload['tables']['deletion_register']:
        raise Conflict('Deletion register must be applied before restoring this snapshot')
    for t in TABLES:
        if conn.execute(sql.SQL('SELECT count(*) AS n FROM rmu.{}').format(sql.Identifier(t))).fetchone()['n']:
            raise Conflict('Restore target must be empty')
    for t,rows in payload['tables'].items():
        if t=='workspaces':
            for row in rows:conn.execute('INSERT INTO rmu.workspaces VALUES(%s,%s) ON CONFLICT DO NOTHING',(row['id'],row['name']))
        else:
            conn.execute(sql.SQL('INSERT INTO rmu.{} SELECT * FROM jsonb_populate_recordset(NULL::rmu.{},%s)').format(sql.Identifier(t),sql.Identifier(t)),(Jsonb(rows),))
    restored={t:conn.execute(sql.SQL('SELECT coalesce(jsonb_agg(to_jsonb(t)),\'[]\'::jsonb) AS rows FROM rmu.{} t').format(sql.Identifier(t))).fetchone()['rows'] for t in TABLES}
    for t,rows in restored.items():
        if sorted(map(digest,rows))!=sorted(map(digest,payload['tables'][t])):raise ValueError('Restore verification failed: '+t)
    return {'verified':True,'tables':len(TABLES),'rows':sum(map(len,restored.values()))}

def reconcile_page(page_id,charged_cents,receipt):
    """Only a provider billing receipt establishes actual charges, never estimates."""
    if type(charged_cents) is not int or charged_cents<0 or not isinstance(receipt,str) or len(receipt.strip())<10:
        raise ValueError('Supply actual charge and provider receipt reference')
    with transaction() as conn:
        page=conn.execute('SELECT * FROM rmu.collection_pages WHERE id=%s FOR UPDATE',(UUID(page_id),)).fetchone()
        if not page or page['state'] not in ('received','uncertain'):raise Conflict('Page cannot be reconciled')
        if charged_cents>page['reserved_cents']:raise Conflict('Charge exceeds reservation; operator investigation required')
        # Never resume an ambiguous collection automatically; it may have lost evidence.
        checkpoint={**page['checkpoint'],'billing_receipt':receipt,'reconciled_by':'operator'}
        conn.execute("UPDATE rmu.collection_pages SET state='reconciled',charged_cents=%s,checkpoint=%s WHERE id=%s",(charged_cents,Jsonb(checkpoint),page['id']))
        conn.execute('UPDATE rmu.runs SET reserved_cents=reserved_cents-%s,charged_cents=charged_cents+%s WHERE id=%s',(page['reserved_cents'],charged_cents,page['run_id']))
