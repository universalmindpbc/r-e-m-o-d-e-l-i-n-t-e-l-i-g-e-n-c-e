"""Draft lightbox contracts. Interpretation requires reviewed coding, never publishes."""
import json,os
from uuid import UUID,uuid4
from psycopg.types.json import Jsonb
from .db import transaction
from .pipeline import Conflict,digest
from .inference import request_model,object_schema,STR,MODEL,BASE,THEMES,CODEBOOK_VERSION
PANELS=['rihanna','fans','alignment','talent_needs','audience_needs','societal_needs','shared_values']
IDS={'type':'array','items':STR}
ITEM=object_schema({'status':{'type':'string','enum':['observation','hypothesis','research_question']},'seeing':STR,'supports':IDS,'challenges':IDS,'limitations':{'type':'array','items':STR},'change':STR,'test':STR})
SCHEMA=object_schema({key:ITEM for key in PANELS})


def validate_findings(output,records,panels=None):
    panels=PANELS if panels is None else panels
    if not isinstance(output,dict) or set(output)!=set(panels):raise ValueError('All lightbox panels must be present')
    ids={r['record_id'] for r in records}
    for item in output.values():
        if not isinstance(item,dict) or set(item)!=set(ITEM['properties']):raise ValueError('Invalid finding fields')
        if item['status'] not in ('observation','hypothesis','research_question'):raise ValueError('Invalid finding status')
        for k in ('seeing','change','test'):
            if not isinstance(item[k],str) or not item[k].strip():raise ValueError('Human question is unanswered')
        for k in ('supports','challenges'):
            if not isinstance(item[k],list) or any(not isinstance(v,str) or v not in ids for v in item[k]):raise ValueError('Finding cites unknown evidence')
        if item['status']=='observation' and not item['supports']:raise ValueError('Observation requires source evidence')
        if not isinstance(item['limitations'],list) or not item['limitations'] or any(not isinstance(v,str) for v in item['limitations']):raise ValueError('Scope limitations required')
    return output


def request_draft(run_id):
    with transaction() as c:
        run=c.execute('SELECT * FROM rmu.runs WHERE id=%s',(UUID(run_id),)).fetchone()
        if not run or run['status']!='complete':raise Conflict('Complete collection before synthesis')
        rows=list(c.execute('''SELECT DISTINCT ON(o.post_id) o.*,p.author_id FROM rmu.observations o JOIN rmu.run_observations ro ON ro.workspace_id=o.workspace_id AND ro.observation_id=o.id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id WHERE ro.run_id=%s AND o.text_content IS NOT NULL AND o.post_type!='repost' ORDER BY o.post_id,o.retrieved_at DESC''',(run['id'],)))
        classes=list(c.execute('SELECT c.* FROM rmu.classifications c JOIN rmu.run_observations ro ON ro.workspace_id=c.workspace_id AND ro.observation_id=c.observation_id WHERE ro.run_id=%s AND c.codebook_version=%s',(run['id'],CODEBOOK_VERSION)))
        approved_rows=[r for r in classes if r['review_state']=='approved']
        approved={(str(r['observation_id']),r['theme']):r for r in approved_rows}
        if len(approved)!=len(approved_rows):raise Conflict('Resolve duplicate reviewed classifications before synthesis')
        expected={(str(r['id']),t) for r in rows for t in THEMES}
        if not expected or not expected.issubset(approved):raise Conflict('Researcher coding validation is required before synthesis')
        metric=c.execute('SELECT * FROM rmu.analyses WHERE run_id=%s ORDER BY created_at DESC LIMIT 1',(run['id'],)).fetchone()
        if not metric:raise Conflict('Compute coverage before synthesis')
    # Auditable bounded evidence excerpts. Counts below are calculated over all eligible records.
    counts={theme:{stance:sum(approved[(str(r['id']),theme)]['stance']==stance for r in rows) for stance in ['support','opposition','mixed','no_clear_position']} for theme in THEMES}
    records=[{'record_id':str(r['id']),'text':r['text_content'],'cohort':r['cohort'],'post_type':r['post_type']} for r in rows[:20]]
    prompt=(BASE/'rmu_backend/approved_prompt.md').read_text()
    prompt+='\nReturn the seven requested panel objects. Shared Values is a proposed research message only. All outputs are draft, not approved publication. Do not infer survey results, private objectives or community delivery. This run is only one evidence lane; missing lanes must be explicit research questions.'
    data={'campaign':run['campaign'],'evidence_lane':run['evidence_lane'],'reviewed_evidence':records,'evidence_selection':'First 20 eligible posts in stable post-ID order; not a representative subsample','computed_metrics':metric['result'],'reviewed_post_stance_counts':counts,'eligible_post_denominator':len(rows),'prolific':{'status':'pending','responses':None}}
    body={'model':MODEL,'reasoning':{'effort':'high'},'store':False,'service_tier':'default','max_output_tokens':12000,'instructions':prompt,'input':json.dumps(data,default=str),'text':{'format':{'type':'json_schema','name':'rmu_lightbox_draft','strict':True,'schema':SCHEMA}}}
    output,request_id,metadata,response=request_model(body,records,run_id)
    validate_findings(output,records)
    with transaction() as c:
        for panel,content in output.items():
            ident=uuid4()
            c.execute('INSERT INTO rmu.findings(workspace_id,id,analysis_id,panel,content,prompt_hash,model) VALUES(%s,%s,%s,%s,%s,%s,%s)',(run['workspace_id'],ident,metric['id'],panel,Jsonb({**content,'review_status':'draft','request_id':str(request_id)}),metadata['prompt_hash'],MODEL))
            for relation in ['supports','challenges']:
                for evidence_id in set(content[relation]):c.execute('INSERT INTO rmu.finding_evidence VALUES(%s,%s,%s,%s)',(run['workspace_id'],ident,UUID(evidence_id),relation))
        c.execute("UPDATE rmu.model_requests SET state='validated' WHERE id=%s",(request_id,))
    return {'panels':len(output),'review_status':'draft','publication_status':'unpublished','usage':response.get('usage')}
