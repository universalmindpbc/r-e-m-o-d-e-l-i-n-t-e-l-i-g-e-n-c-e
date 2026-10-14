"""Authenticated, spreadsheet-safe exports of one immutable collection."""
import csv,io,json
from datetime import datetime,timezone
from uuid import UUID
from .db import transaction
from .inference import THEMES,CODEBOOK_VERSION
BASE_COLUMNS=['exported_at_utc','run_id','campaign_name','source_type','evidence_lane','collection_query','analysis_start','analysis_end','post_id','post_url','author_id','published_at_utc','retrieved_at_utc','post_type','language','post_text','post_text_json','inferred_cohort','cohort_evidence_json','public_metrics_json','codebook_version','classification_status','all_classifications_json']
THEME_COLUMNS=['relevance','stance','evidence_span','reason','review_state','model','reasoning_effort','prompt_hash','context_json']

def safe_cell(value):
 text='' if value is None else str(value)
 # Post content is untrusted. Quoting alone does not stop spreadsheet formulas.
 if text.lstrip(' \t\r\n').startswith(('=','+','-','@')) or text.startswith(('\t','\r','\n')):return "'"+text
 return text

def render_csv(run,records,classifications):
 by_record={}
 for item in classifications:by_record.setdefault(str(item['observation_id']),[]).append(item)
 from .workflows import THEMES as GENERIC,VERSION,GENERIC_VERSIONS
 generic=any(c['codebook_version'] in GENERIC_VERSIONS for c in classifications)
 themes=GENERIC if generic else THEMES;version=(VERSION if any(c['codebook_version']==VERSION for c in classifications) else 'campaign-evidence-v1') if generic else (CODEBOOK_VERSION if any(c['codebook_version']==CODEBOOK_VERSION for c in classifications) else 'clf-proposed-v1')
 fields=BASE_COLUMNS+[theme+'_'+field for theme in themes for field in THEME_COLUMNS]
 stream=io.StringIO(newline='');writer=csv.DictWriter(stream,fieldnames=fields,quoting=csv.QUOTE_ALL);writer.writeheader()
 exported=datetime.now(timezone.utc).isoformat()
 for post in records:
  codes=by_record.get(str(post['id']),[]);current=[c for c in codes if c['codebook_version']==version]
  status='not_classified' if not codes else ('researcher_approved' if len(current)==len(themes) and {c['theme'] for c in current}==set(themes) and all(c['review_state']=='approved' for c in current) else 'requires_review')
  row=dict(exported_at_utc=exported,run_id=run['id'],campaign_name=run['campaign'].get('name',''),source_type=run['source_type'],evidence_lane=run['evidence_lane'],collection_query=run['query'],analysis_start=run['starts_on'],analysis_end=run['ends_on'],post_id=post['post_id'],post_url=post['source_url'],author_id=post['author_id'],published_at_utc=post['created_at'],retrieved_at_utc=post['retrieved_at'],post_type=post['post_type'],language=post['language'],post_text=post['text_content'],post_text_json=json.dumps(post['text_content'],ensure_ascii=False),inferred_cohort=post['cohort'],cohort_evidence_json=json.dumps(post['cohort_evidence'],ensure_ascii=False,default=str),public_metrics_json=json.dumps(post['metrics'],ensure_ascii=False,default=str),codebook_version=version,classification_status=status,all_classifications_json=json.dumps(codes,ensure_ascii=False,default=str))
  for theme in themes:
   matches=[c for c in current if c['theme']==theme]
   if len(matches)!=1:continue
   c=matches[0];provenance=c['provenance']
   values=dict(relevance=provenance.get('relevance'),stance=c['stance'],evidence_span=c['evidence_span'],reason=provenance.get('reason'),review_state=c['review_state'],model=provenance.get('model'),reasoning_effort=provenance.get('reasoning'),prompt_hash=provenance.get('prompt_hash'),context_json=json.dumps(provenance.get('context'),ensure_ascii=False))
   row.update({theme+'_'+key:value for key,value in values.items()})
  writer.writerow({key:safe_cell(value) for key,value in row.items()})
 return ('\ufeff'+stream.getvalue()).encode('utf-8')

def export_run(run_id):
 with transaction() as c:
  run=c.execute('SELECT * FROM rmu.runs WHERE id=%s',(UUID(run_id),)).fetchone()
  if not run:return None
  records=list(c.execute('''SELECT DISTINCT ON(o.post_id) o.*,p.author_id,p.created_at FROM rmu.run_observations ro JOIN rmu.observations o ON o.workspace_id=ro.workspace_id AND o.id=ro.observation_id JOIN rmu.posts p ON p.workspace_id=o.workspace_id AND p.provider=o.provider AND p.source_type=o.source_type AND p.post_id=o.post_id WHERE ro.run_id=%s ORDER BY o.post_id,o.retrieved_at DESC''',(run['id'],)))
  ids=[r['id'] for r in records]
  codes=list(c.execute('SELECT id,observation_id,codebook_version,theme,stance,evidence_span,provenance,review_state FROM rmu.classifications WHERE observation_id=ANY(%s) ORDER BY observation_id,codebook_version,theme',(ids,))) if ids else []
 return {'content':render_csv(run,records,codes),'rows':len(records),'filename':'rmu-'+run['evidence_lane']+'-'+str(run['id'])+'.csv'}
