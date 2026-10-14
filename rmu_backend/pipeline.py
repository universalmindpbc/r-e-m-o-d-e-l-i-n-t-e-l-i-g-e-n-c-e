"""Durable evidence pipeline. Numerical summaries are code-computed, never LLM scores."""
import hashlib
import json
import re
from datetime import datetime, timezone
from uuid import uuid4, UUID
from psycopg.types.json import Jsonb
from .db import transaction

METRIC_VERSION = 'evidence-coverage-v1'

class Conflict(ValueError):
    pass


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), default=str).encode()).hexdigest()


def text(value, label, limit):
    if not isinstance(value, str) or not value.strip() or len(value)>limit or any(ord(c)<32 and c not in '\n\t' for c in value):
        raise ValueError('Invalid '+label)
    return value.strip()


def timestamp(value):
    if not isinstance(value,str):
        raise ValueError('Timestamp required')
    dt = datetime.fromisoformat(value.replace('Z','+00:00'))
    if dt.tzinfo is None or dt > datetime.now(timezone.utc):
        raise ValueError('Use a past timestamp with timezone')
    return dt.astimezone(timezone.utc)


def normalize(post, synthetic=False):
    if not isinstance(post,dict) or set(post)-{'id','author_id','created_at','retrieved_at','text','lang','public_metrics','referenced_tweets'}:
        raise ValueError('Invalid post fields')
    ident=text(post.get('id'),'post ID',80)
    author=text(post.get('author_id'),'author ID',80)
    if not synthetic and (not ident.isdigit() or not author.isdigit()):
        raise ValueError('X posts require stable numeric post and author IDs')
    if synthetic and not ident.startswith('fixture-'):
        raise ValueError('Synthetic post IDs must start with fixture-')
    created=timestamp(post.get('created_at'))
    retrieved=timestamp(post.get('retrieved_at'))
    if retrieved<created:
        raise ValueError('Retrieval predates creation')
    content=post.get('text')
    if content is not None:
        content=text(content,'post text',25000)
    metrics=post.get('public_metrics') or {}
    if not isinstance(metrics,dict) or set(metrics)-{'like_count','reply_count','retweet_count','quote_count','impression_count','bookmark_count'}:
        raise ValueError('Invalid metrics')
    for value in metrics.values():
        if value is not None and (type(value) is not int or value<0):
            raise ValueError('Metrics must be non-negative integers or null')
    refs=post.get('referenced_tweets',[])
    if not isinstance(refs,list) or len(refs)>10:
        raise ValueError('Invalid referenced posts')
    for ref in refs:
        if not isinstance(ref,dict) or set(ref)!={'type','id'} or ref['type'] not in ('replied_to','quoted','retweeted'):
            raise ValueError('Invalid reference')
        text(ref['id'],'reference ID',80)
    types={r['type'] for r in refs}
    kind='repost' if 'retweeted' in types else 'reply' if 'replied_to' in types else 'quote' if 'quoted' in types else 'original'
    lang=post.get('lang')
    if lang is not None and (not isinstance(lang,str) or not re.fullmatch('[a-zA-Z-]{2,16}',lang)):
        raise ValueError('Invalid language')
    return dict(id=ident,author_id=author,created_at=created,retrieved_at=retrieved,text=content,lang=lang,metrics=metrics,references=refs,post_type=kind)


def workspace(conn):
    row=conn.execute('SELECT id FROM rmu.workspaces').fetchone()
    if not row:
        raise ValueError('Workspace unavailable')
    return row['id']


def create_run(payload, preview):
    if set(payload)-{'query','start','end','mode','idempotency_key','campaign','evidence_lane','source_type'}:
        raise ValueError('Unexpected run fields')
    key=text(payload.get('idempotency_key'),'idempotency key',100)
    campaign=payload.get('campaign')
    if not isinstance(campaign,dict) or set(campaign)-{'name','talent','agency','topics','settings_version'}:
        raise ValueError('Invalid campaign snapshot')
    text(campaign.get('name'),'campaign name',200)
    if len(json.dumps(campaign))>4000:
        raise ValueError('Campaign snapshot too large')
    lane=payload.get('evidence_lane')
    if lane not in ('talent','organisation','audience','cause','ground_truth'):
        raise ValueError('Choose an evidence lane')
    source=payload.get('source_type','observed')
    if source not in ('observed','synthetic'):
        raise ValueError('Unsupported evidence source')
    request_hash=digest(payload)
    cap=0 if source=='synthetic' else (250 if payload.get('mode','test')=='test' else 5000)
    with transaction() as conn:
        ws=workspace(conn)
        row=conn.execute('''INSERT INTO rmu.runs(workspace_id,id,idempotency_key,request_hash,source_type,provider,evidence_lane,campaign,query,starts_on,ends_on,status,budget_cents)
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'planned',%s)
        ON CONFLICT(workspace_id,idempotency_key) DO NOTHING RETURNING *''',
        (ws,uuid4(),key,request_hash,source,'fixture' if source=='synthetic' else 'x',lane,Jsonb(campaign),preview['query'],preview['start'],preview['end'],cap)).fetchone()
        if row is None:
            row=conn.execute('SELECT * FROM rmu.runs WHERE idempotency_key=%s',(key,)).fetchone()
            if row['request_hash']!=request_hash:
                raise Conflict('Idempotency key already used for a different plan')
        return public_run(row)


def public_run(row):
    return {k:v for k,v in row.items() if k not in ('request_hash','idempotency_key','workspace_id')}


def list_runs():
    with transaction() as conn:
        return [public_run(r) for r in conn.execute('SELECT * FROM rmu.runs ORDER BY created_at DESC LIMIT 50')]


def get_run(run_id):
    run_id=UUID(run_id)
    with transaction() as conn:
        row=conn.execute('SELECT * FROM rmu.runs WHERE id=%s',(run_id,)).fetchone()
        if not row:
            return None
        result=public_run(row)
        result['evidence_count']=conn.execute('SELECT count(*) AS n FROM rmu.run_observations WHERE run_id=%s',(run_id,)).fetchone()['n']
        result['analyses']=[dict(r) for r in conn.execute('SELECT id,metric_version,input_hash,result,created_at FROM rmu.analyses WHERE run_id=%s ORDER BY created_at DESC',(run_id,))]
        result['jobs']=[dict(r) for r in conn.execute("SELECT id,kind,CASE WHEN kind='classify' AND state IN ('queued','running') AND coalesce(lease_until,created_at+interval '20 minutes')<now() THEN 'needs_reconciliation' ELSE state END AS state,attempts,error_code FROM rmu.jobs WHERE run_id=%s",(run_id,))]
        result['evidence']=[dict(r) for r in conn.execute('''SELECT DISTINCT ON(o.post_id) o.id,o.post_id,o.text_content,o.source_url,o.cohort,o.cohort_evidence,o.post_type,o.language,o.retrieved_at,p.created_at FROM rmu.run_observations ro JOIN rmu.observations o ON o.workspace_id=ro.workspace_id AND o.id=ro.observation_id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id WHERE ro.run_id=%s ORDER BY o.post_id,o.retrieved_at DESC LIMIT 1000''',(run_id,))]
        result['collection_receipt']=dict(conn.execute('''SELECT count(*) AS pages,coalesce(sum((checkpoint->>'returned_posts')::int),0) AS returned_posts,coalesce(sum((checkpoint->>'returned_profiles')::int),0) AS returned_profiles,coalesce(sum((checkpoint->>'estimated_cost_microusd')::bigint),0) AS estimated_microusd,bool_and(state='reconciled') AS billing_reconciled FROM rmu.collection_pages WHERE run_id=%s''',(run_id,)).fetchone())
        result['findings']=[dict(r) for r in conn.execute("SELECT f.panel,f.content,f.status FROM rmu.findings f JOIN rmu.analyses a ON a.workspace_id=f.workspace_id AND a.id=f.analysis_id WHERE a.run_id=%s AND f.status!='withdrawn'",(run_id,))]
        result['classification_count']=conn.execute('SELECT count(*) AS n FROM rmu.classifications c JOIN rmu.run_observations ro ON ro.workspace_id=c.workspace_id AND ro.observation_id=c.observation_id WHERE ro.run_id=%s',(run_id,)).fetchone()['n']
        evidence_ids=[r['id'] for r in result['evidence']]
        result['classifications']=[dict(r) for r in conn.execute('SELECT id,observation_id,codebook_version,theme,stance,evidence_span,review_state,provenance FROM rmu.classifications WHERE observation_id=ANY(%s) ORDER BY observation_id,theme',(evidence_ids,))] if evidence_ids else []
        result['model_analysis']=dict(conn.execute('''SELECT count(*) AS labels,count(DISTINCT c.observation_id) AS coded_posts,count(*) FILTER(WHERE review_state='approved') AS reviewed_labels FROM rmu.classifications c JOIN rmu.run_observations ro ON ro.workspace_id=c.workspace_id AND ro.observation_id=c.observation_id WHERE ro.run_id=%s''',(run_id,)).fetchone())
        result['model_requests']=[dict(r) for r in conn.execute('SELECT model,state,usage,created_at FROM rmu.model_requests WHERE run_id=%s ORDER BY created_at DESC',(run_id,))]
        return result


def insert_observation(conn,ws,run,post,rights):
    provider,source=run['provider'],run['source_type']
    deleted=conn.execute('SELECT 1 FROM rmu.deletion_register WHERE provider=%s AND source_type=%s AND post_id=%s',(provider,source,post['id'])).fetchone()
    if deleted:
        raise Conflict('Evidence is in the deletion register')
    if not run['starts_on']<=post['created_at'].date()<=run['ends_on']:
        raise ValueError('Post is outside the observation window')
    conn.execute('''INSERT INTO rmu.posts(workspace_id,provider,source_type,post_id,author_id,created_at) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING''',(ws,provider,source,post['id'],post['author_id'],post['created_at']))
    identity=conn.execute('SELECT author_id,created_at FROM rmu.posts WHERE provider=%s AND source_type=%s AND post_id=%s',(provider,source,post['id'])).fetchone()
    if identity['author_id']!=post['author_id'] or identity['created_at']!=post['created_at']:
        raise Conflict('Stable post identity does not match retained evidence')
    params=(ws,uuid4(),provider,source,post['id'],post['retrieved_at'],digest(post),post['text'],None if source=='synthetic' else 'https://x.com/i/web/status/'+post['id'],post['lang'],post['post_type'],Jsonb(post['metrics']),Jsonb(post['references']),rights)
    obs=conn.execute('''INSERT INTO rmu.observations(workspace_id,id,provider,source_type,post_id,retrieved_at,content_hash,text_content,source_url,language,post_type,metrics,references_json,rights_reference)
    VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING RETURNING id''',params).fetchone()
    if not obs:
        obs=conn.execute('SELECT id FROM rmu.observations WHERE provider=%s AND source_type=%s AND post_id=%s AND retrieved_at=%s AND content_hash=%s',(provider,source,post['id'],post['retrieved_at'],digest(post))).fetchone()
    conn.execute('INSERT INTO rmu.run_observations VALUES(%s,%s,%s) ON CONFLICT DO NOTHING',(ws,run['id'],obs['id']))


def import_fixture(run_id,payload):
    if not isinstance(payload,dict) or set(payload)!={'posts'} or not isinstance(payload['posts'],list) or not 1<=len(payload['posts'])<=100:
        raise ValueError('Supply 1–100 synthetic posts')
    posts=[normalize(p,synthetic=True) for p in payload['posts']]
    with transaction() as conn:
        ws=workspace(conn)
        run=conn.execute('SELECT * FROM rmu.runs WHERE id=%s FOR UPDATE',(UUID(run_id),)).fetchone()
        if not run or run['source_type']!='synthetic':
            raise ValueError('Fixture import requires a synthetic run')
        if run['status']!='planned':
            raise Conflict('Run is sealed; create a new run for additional evidence')
        for post in posts:
            insert_observation(conn,ws,run,post,'Synthetic test fixture; no observed social evidence')
    return {'accepted':len(posts),'source_type':'synthetic'}


def queue_measurement(run_id):
    with transaction() as conn:
        ws=workspace(conn)
        run=conn.execute('SELECT * FROM rmu.runs WHERE id=%s FOR UPDATE',(UUID(run_id),)).fetchone()
        if not run:
            raise ValueError('Run not found')
        existing=conn.execute("SELECT id,state FROM rmu.jobs WHERE run_id=%s AND kind='measure'",(run['id'],)).fetchone()
        if existing:
            return dict(existing)
        if run['source_type']=='observed' and run['status']!='complete':
            raise Conflict('Complete collection before measuring')
        count=conn.execute('SELECT count(*) AS n FROM rmu.run_observations WHERE run_id=%s',(run['id'],)).fetchone()['n']
        if count==0:
            raise Conflict('Collect evidence before measuring')
        job=conn.execute("INSERT INTO rmu.jobs(workspace_id,id,run_id,kind) VALUES(%s,%s,%s,'measure') RETURNING id,state",(ws,uuid4(),run['id'])).fetchone()
        conn.execute("UPDATE rmu.runs SET status='queued' WHERE id=%s",(run['id'],))
        return dict(job)


def measure(rows,source):
    # Each stable post contributes once using its latest available observation in this sealed run.
    eligible=[r for r in rows if r['text_content'] and r['post_type']!='repost']
    return {'source_type':source,'status':'coverage_only','sample_posts':len(rows),
        'eligible_original_reply_quote_posts':len(eligible),'unique_authors':len({r['author_id'] for r in rows}),
        'missing_text':sum(not r['text_content'] for r in rows),'reposts':sum(r['post_type']=='repost' for r in rows),
        'metric_coverage':{key:{'known':sum(r['metrics'].get(key) is not None for r in rows),'denominator':len(rows),'sum':sum(r['metrics'].get(key) or 0 for r in rows) if any(r['metrics'].get(key) is not None for r in rows) else None} for key in ['like_count','reply_count','retweet_count','quote_count','impression_count']},
        'cohort_counts':{key:len({r['author_id'] for r in rows if r.get('cohort','uncertain')==key}) for key in ['talent','organisation','inferred_fan','uncertain']},
        'cohort_note':'Unique authors per heuristic label; a changing profile may appear in more than one group. Inferred fans are not verified fandom.',
        'prolific':{'status':'pending','responses':None,'note':'Survey responses have not been supplied; no survey results inferred.'},
        'alignment':None,'audience_stance':None,'publication_status':'unpublished',
        'limitations':['Collected sample only; not a representative audience estimate.','Engagement totals are retrieval snapshots, not unique people or causal impact.','Theme and stance proportions require reviewed classifications.'],
        'panels':{key:{'status':'insufficient_evidence','seeing':None,'supports':[],'challenges':[],'change':None,'test':'Add and review the evidence required for this panel.'} for key in ['rihanna','fans','alignment','talent_needs','societal_needs','audience_needs','shared_values']}}


def process_one(run_id=None):
    # A bounded transaction makes safe measurement jobs atomic. Paid requests use a separate ledger.
    with transaction() as conn:
        ws=workspace(conn)
        job=conn.execute("SELECT * FROM rmu.jobs WHERE kind='measure' AND state='queued' AND (%s::uuid IS NULL OR run_id=%s::uuid) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",(UUID(run_id) if run_id else None,UUID(run_id) if run_id else None)).fetchone()
        if not job:
            return {'processed':False}
        conn.execute("UPDATE rmu.jobs SET state='running',attempts=attempts+1,updated_at=now() WHERE id=%s",(job['id'],))
        run=conn.execute('SELECT * FROM rmu.runs WHERE id=%s FOR UPDATE',(job['run_id'],)).fetchone()
        rows=list(conn.execute('''SELECT DISTINCT ON(o.provider,o.source_type,o.post_id) o.*,p.author_id FROM rmu.run_observations ro
          JOIN rmu.observations o ON o.workspace_id=ro.workspace_id AND o.id=ro.observation_id
          JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id
          WHERE ro.run_id=%s ORDER BY o.provider,o.source_type,o.post_id,o.retrieved_at DESC,o.id''',(run['id'],)))
        result=measure(rows,run['source_type'])
        input_hash=digest(sorted(str(r['id'])+r['content_hash'] for r in rows))
        conn.execute('''INSERT INTO rmu.analyses(workspace_id,id,run_id,metric_version,input_hash,result) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING''',(ws,uuid4(),run['id'],METRIC_VERSION,input_hash,Jsonb(result)))
        conn.execute("UPDATE rmu.jobs SET state='complete',updated_at=now() WHERE id=%s",(job['id'],))
        conn.execute("UPDATE rmu.runs SET status='complete' WHERE id=%s",(run['id'],))
        return {'processed':True,'job_id':job['id'],'run_id':run['id'],'status':'complete'}
