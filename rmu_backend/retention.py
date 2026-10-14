"""Operator-only takedown. Owner credential is never deployed to the API."""
from uuid import UUID
import os,json
from pathlib import Path
import psycopg
from psycopg.rows import dict_row


def purge_posts(conn,workspace_id,post_ids,reason):
    ws=UUID(workspace_id)
    if not post_ids or any(not isinstance(p,str) or not p.isdigit() for p in post_ids) or not reason.strip():
        raise ValueError('Explicit numeric post IDs and reason required')
    affected=[r['run_id'] for r in conn.execute('''SELECT DISTINCT ro.run_id FROM rmu.run_observations ro JOIN rmu.observations o ON o.workspace_id=ro.workspace_id AND o.id=ro.observation_id WHERE o.workspace_id=%s AND o.provider='x' AND o.source_type='observed' AND o.post_id=ANY(%s)''',(ws,post_ids))]
    for post in post_ids:
        conn.execute("INSERT INTO rmu.deletion_register(workspace_id,provider,source_type,post_id,reason) VALUES(%s,'x','observed',%s,%s) ON CONFLICT DO NOTHING",(ws,post,reason))
    # Invalidate all derived outputs for impacted runs: no stale quotations survive.
    for run in affected:
        conn.execute('DELETE FROM rmu.review_events WHERE workspace_id=%s AND finding_id IN (SELECT id FROM rmu.findings WHERE workspace_id=%s AND analysis_id IN (SELECT id FROM rmu.analyses WHERE workspace_id=%s AND run_id=%s))',(ws,ws,ws,run))
        conn.execute('DELETE FROM rmu.finding_evidence WHERE workspace_id=%s AND finding_id IN (SELECT id FROM rmu.findings WHERE workspace_id=%s AND analysis_id IN (SELECT id FROM rmu.analyses WHERE workspace_id=%s AND run_id=%s))',(ws,ws,ws,run))
        conn.execute('DELETE FROM rmu.findings WHERE workspace_id=%s AND analysis_id IN (SELECT id FROM rmu.analyses WHERE workspace_id=%s AND run_id=%s)',(ws,ws,run))
        conn.execute('DELETE FROM rmu.analyses WHERE workspace_id=%s AND run_id=%s',(ws,run))
        conn.execute("UPDATE rmu.runs SET status='needs_reconciliation',coverage=coverage || '{\"evidence_removed\":true}'::jsonb WHERE workspace_id=%s AND id=%s",(ws,run))
    ids=[r['id'] for r in conn.execute("SELECT id FROM rmu.observations WHERE workspace_id=%s AND provider='x' AND source_type='observed' AND post_id=ANY(%s)",(ws,post_ids))]
    for table in ['finding_evidence','classifications','embeddings','run_observations']:
        # table names are a fixed internal allowlist.
        conn.execute('DELETE FROM rmu.'+table+' WHERE workspace_id=%s AND observation_id=ANY(%s)',(ws,ids))
    conn.execute("DELETE FROM rmu.observations WHERE workspace_id=%s AND provider='x' AND source_type='observed' AND post_id=ANY(%s)",(ws,post_ids))
    conn.execute("DELETE FROM rmu.posts WHERE workspace_id=%s AND provider='x' AND source_type='observed' AND post_id=ANY(%s)",(ws,post_ids))
    return {'removed_observations':len(ids),'invalidated_runs':len(affected)}


def purge(post_ids,reason):
    with psycopg.connect(os.environ['DATABASE_URL_UNPOOLED'],row_factory=dict_row) as conn:
        result=purge_posts(conn,os.environ['RMU_WORKSPACE_ID'],post_ids,reason)
    # Raw local recovery copies must not survive a takedown; regenerate a clean one.
    root=Path(__file__).parents[1]/'private'
    for file in list(root.glob('snapshot-*.json'))+list(root.glob('x-response-*.json')):
        value=json.loads(file.read_text())
        if value.get('workspace_id')==os.environ['RMU_WORKSPACE_ID']:
            file.unlink()
    return result


def expire_demo_evidence():
    """Thirty-day operator retention sweep, also run before a new paid collection."""
    with psycopg.connect(os.environ['DATABASE_URL_UNPOOLED'],row_factory=dict_row) as conn:
        rows=conn.execute("SELECT DISTINCT post_id FROM rmu.observations WHERE workspace_id=%s AND provider='x' AND source_type='observed' AND retrieved_at < now()-interval '30 days'",(os.environ['RMU_WORKSPACE_ID'],)).fetchall()
    if rows:return purge([r['post_id'] for r in rows],'Demo retention expiry: 30 days after retrieval')
    return {'removed_observations':0}
