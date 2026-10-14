"""One checkpointed X archive page per invocation. Off until explicitly configured."""
import json
import math
import os
from pathlib import Path
from uuid import uuid4
from datetime import datetime,timedelta,timezone
from urllib.parse import urlencode
from urllib.request import Request,urlopen
from uuid import UUID
from psycopg.types.json import Jsonb
from .db import transaction
from .pipeline import Conflict,workspace,normalize,insert_observation,digest
from .budget import reserve,uncertain
from .cohorts import classify_author


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
        data=json.loads(raw)
        folder=Path(__file__).parents[1]/'private'
        folder.mkdir(mode=0o700,exist_ok=True)
        filename=folder/('x-response-'+str(uuid4())+'.json')
        with filename.open('x') as out:
            os.chmod(filename,0o600)
            json.dump({'workspace_id':os.environ['RMU_WORKSPACE_ID'],'params':params,'response':data},out)
        return data


def collect_one(run_id,fetch=fetch_page):
    price=configuration()
    user_price=int(os.environ.get("RMU_X_USER_PRICE_MICROUSD","10000"))
    if user_price!=10000: raise Conflict("Verify profile read pricing")
    unit_reservation=price+user_price
    identities=json.loads(os.environ.get("RMU_X_IDENTITIES","{}"))
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
        maximum=min(100,max(10,int(os.environ.get("RMU_X_PAGE_SIZE","100"))),(available*10000)//unit_reservation)
        if maximum<10:
            raise Conflict('Remaining budget cannot reserve another page')
        params={'query':run['query'],'start_time':run['starts_on'].isoformat()+'T00:00:00Z',
            'end_time':(run['ends_on']+timedelta(days=1)).isoformat()+'T00:00:00Z','max_results':maximum,
            'tweet.fields':'id,text,author_id,created_at,lang,public_metrics,referenced_tweets',
            'expansions':'author_id','user.fields':'id,username,description'}
        if cursor: params['next_token']=cursor
    page_id=reserve(run_id,digest(params),math.ceil(maximum*unit_reservation/10000))
    try:
        payload=fetch(params,os.environ['X_API_BEARER_TOKEN'])
        if not isinstance(payload,dict) or payload.get('errors') or not isinstance(payload.get('data',[]),list):
            raise ValueError('Provider response incomplete')
        posts=payload.get('data',[])
        profiles={p['id']:p for p in payload.get('includes',{}).get('users',[])}
        if len(profiles)>maximum: raise ValueError('Profile count exceeded reservation')
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
                insert_observation(conn,ws,current,post,'X API developer agreement; operator takedown and 30-day demo retention')
                profile=profiles.get(post['author_id'],{'id':post['author_id']})
                if conn.execute('SELECT 1 FROM rmu.workflows WHERE run_id=%s',(current['id'],)).fetchone():
                    handle=current['campaign'].get('talent','').lstrip('@').lower()
                    resolved=bool(profile.get('username')) and profile['username'].lower()==handle
                    cohort={'label':'talent' if resolved else 'uncertain','rule_version':'campaign-identity-v1','reason':'Exact requested handle matched to returned X user ID' if resolved else 'Fan relationship is not established','resolved_user_id':profile.get('id') if resolved else None,'review_status':'pending','limitations':['Public discussion is not verified fandom; Prolific pending.']}
                else:
                    cohort=classify_author(profile,post['text'],identities)
                cohort['profile_retrieved_at']=retrieved
                conn.execute("UPDATE rmu.observations SET cohort=%s,cohort_evidence=%s WHERE workspace_id=%s AND provider='x' AND source_type='observed' AND post_id=%s AND retrieved_at=%s",(cohort['label'],Jsonb(cohort),ws,post['id'],post['retrieved_at']))
            checkpoint={'next_token':cursor,'returned_posts':len(posts),'returned_profiles':len(profiles),'estimated_cost_microusd':len(posts)*price+len(profiles)*user_price,'price_microusd':price,'retrieved_at':retrieved,'response_hash':digest(payload)}
            conn.execute("UPDATE rmu.collection_pages SET state='received',checkpoint=%s WHERE id=%s",(Jsonb(checkpoint),UUID(page_id)))
            remaining=current['budget_cents']-current['reserved_cents']-current['charged_cents']
            finished=not cursor or (remaining*10000)//unit_reservation<10
            coverage={'complete_for_query':not bool(cursor),'budget_limited':bool(cursor) and finished,'sample_only':True,'billing_reconciled':False}
            conn.execute('UPDATE rmu.runs SET status=%s,coverage=%s WHERE id=%s',('complete' if finished else 'running',Jsonb(coverage),UUID(run_id)))
        return {'page_id':page_id,'stored_posts':len(posts),'has_next_page':bool(cursor),'run_complete':finished,'billing_reconciled':False}
    except Exception as error:
        uncertain(page_id,{"error_type":type(error).__name__,"http_status":getattr(error,"code",None)})
        raise Conflict('Collection outcome needs reconciliation; reservation retained and automatic retries blocked')
