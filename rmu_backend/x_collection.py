"""One checkpointed X archive page per invocation. Off until explicitly configured."""
import json
import math
import os
from datetime import datetime,timedelta,timezone
from urllib.parse import urlencode
from urllib.request import Request,urlopen
from uuid import UUID
from psycopg.types.json import Jsonb
from .db import transaction
from .pipeline import Conflict,workspace,normalize,insert_observation,digest
from .budget import reserve,uncertain


def configuration():
    if os.environ.get('RMU_X_COLLECTION_ENABLED')!='true':
        raise Conflict('Paid X collection is not activated')
    if os.environ.get('RMU_X_PRICE_VERIFIED_ON')!=datetime.now(timezone.utc).date().isoformat():
        raise Conflict('Verify endpoint pricing for today before collecting')
    price=int(os.environ.get('RMU_X_POST_PRICE_MICROUSD','0'))
    if price<=0 or not os.environ.get('X_API_BEARER_TOKEN'):
        raise Conflict('X pricing and authentication must be configured')
    return price


def fetch_page(params,token):
    request=Request('https://api.x.com/2/tweets/search/all?'+urlencode(params),headers={'Authorization':'Bearer '+token,'Accept':'application/json'})
    with urlopen(request,timeout=20) as response:
        raw=response.read(4*1024*1024+1)
        if len(raw)>4*1024*1024:
            raise ValueError('Provider response too large')
        return json.loads(raw)


def collect_one(run_id,fetch=fetch_page):
    price=configuration()
    with transaction() as conn:
        run=conn.execute('SELECT * FROM rmu.runs WHERE id=%s',(UUID(run_id),)).fetchone()
        if not run or run['source_type']!='observed' or run['status'] not in ('planned','running'):
            raise Conflict('Run is unavailable for collection')
        pages=list(conn.execute('SELECT * FROM rmu.collection_pages WHERE run_id=%s ORDER BY created_at DESC',(run['id'],)))
        if any(p['state'] in ('reserved','uncertain') for p in pages):
            raise Conflict('A previous request needs reconciliation; no retry sent')
        cursor=pages[0]['checkpoint'].get('next_token') if pages else None
        if pages and not cursor:
            raise Conflict('Collection has reached the final page')
        available=run['budget_cents']-run['reserved_cents']-run['charged_cents']
        maximum=min(100,(available*10000)//price)
        if maximum<10:
            raise Conflict('Remaining budget cannot reserve another page')
        params={'query':run['query'],'start_time':run['starts_on'].isoformat()+'T00:00:00Z',
            'end_time':(run['ends_on']+timedelta(days=1)).isoformat()+'T00:00:00Z','max_results':maximum,
            'tweet.fields':'id,text,author_id,created_at,lang,public_metrics,referenced_tweets'}
        if cursor: params['next_token']=cursor
    page_id=reserve(run_id,digest(params),math.ceil(maximum*price/10000))
    try:
        payload=fetch(params,os.environ['X_API_BEARER_TOKEN'])
        if not isinstance(payload,dict) or payload.get('errors') or not isinstance(payload.get('data',[]),list):
            raise ValueError('Provider response incomplete')
        posts=payload.get('data',[])
        if len(posts)>maximum:
            raise ValueError('Provider exceeded page bound')
        retrieved=datetime.now(timezone.utc).isoformat()
        normal=[normalize({**{k:p[k] for k in ['id','author_id','created_at','text','lang','public_metrics','referenced_tweets'] if k in p},'retrieved_at':retrieved}) for p in posts]
        cursor=payload.get('meta',{}).get('next_token')
        if cursor is not None and (not isinstance(cursor,str) or len(cursor)>2048):
            raise ValueError('Invalid provider checkpoint')
        with transaction() as conn:
            ws=workspace(conn)
            current=conn.execute('SELECT * FROM rmu.runs WHERE id=%s FOR UPDATE',(UUID(run_id),)).fetchone()
            page=conn.execute('SELECT * FROM rmu.collection_pages WHERE id=%s FOR UPDATE',(UUID(page_id),)).fetchone()
            if page['state']!='reserved': raise Conflict('Page state changed')
            for post in normal:
                insert_observation(conn,ws,current,post,'X API developer agreement; source availability and retention require compliance review')
            checkpoint={'next_token':cursor,'returned_posts':len(posts),'estimated_cost_microusd':len(posts)*price,'price_microusd':price,'retrieved_at':retrieved,'response_hash':digest(payload)}
            conn.execute("UPDATE rmu.collection_pages SET state='received',checkpoint=%s WHERE id=%s",(Jsonb(checkpoint),UUID(page_id)))
            remaining=current['budget_cents']-current['reserved_cents']-current['charged_cents']
            finished=not cursor or (remaining*10000)//price<10
            coverage={'complete_for_query':not bool(cursor),'budget_limited':bool(cursor) and finished,'sample_only':True,'billing_reconciled':False}
            conn.execute('UPDATE rmu.runs SET status=%s,coverage=%s WHERE id=%s',('complete' if finished else 'running',Jsonb(coverage),UUID(run_id)))
        return {'page_id':page_id,'stored_posts':len(posts),'has_next_page':bool(cursor),'run_complete':finished,'billing_reconciled':False}
    except Exception:
        uncertain(page_id)
        raise Conflict('Collection outcome needs reconciliation; reservation retained and automatic retries blocked')
