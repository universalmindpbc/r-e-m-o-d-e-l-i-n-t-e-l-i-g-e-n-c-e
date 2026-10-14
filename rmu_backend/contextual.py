"""Campaign-independent opinion contract. Post format never determines stance."""
from pathlib import Path
VERSION = 'contextual-opinion-v1'
RULES = (Path(__file__).with_name('contextual_rules.md')).read_text()
FORMATS = ['news_report', 'personal_reaction', 'question', 'promotion', 'announcement', 'other', 'uncertain']
FRAMING = ['favourable', 'critical', 'mixed', 'descriptive', 'uncertain']
BASES = ['explicit', 'contextual', 'no_position']
ABSENCES = ['descriptive', 'question_only', 'not_discussed', 'ambiguous_target', 'insufficient_context']
def obj(props):
 return {'type':'object','properties':props,'required':list(props),'additionalProperties':False}
def enum(values):return {'type':'string','enum':values}
CONTEXT = obj({'format':enum(FORMATS),'framing':enum(FRAMING),'framing_target':{'type':'string'},'framing_span':{'type':['string','null']},'stance_basis':enum(BASES),'no_position_reason':{'type':['string','null'],'enum':ABSENCES+[None]}})
def schema(themes):
 return obj({'classifications':{'type':'array','items':obj({'record_id':{'type':'string'},'theme':enum(list(themes)),'relevance':enum(['relevant','not_relevant','uncertain']),'stance':enum(['support','opposition','mixed','no_clear_position']),'evidence_span':{'type':['string','null']},'reason':{'type':'string'},'context':CONTEXT})}})
def validate_context(item,text):
 context=item.get('context')
 if not isinstance(context,dict) or set(context)!=set(CONTEXT['properties']):raise ValueError('Missing contextual opinion fields')
 for key,values in [('format',FORMATS),('framing',FRAMING),('stance_basis',BASES),('no_position_reason',ABSENCES+[None])]:
  if context[key] not in values:raise ValueError('Invalid contextual opinion label')
 if not isinstance(context['framing_target'],str) or not context['framing_target'].strip():raise ValueError('Framing target required')
 span=context['framing_span']
 if span is not None and (not isinstance(span,str) or not span.strip() or span not in text):raise ValueError('Framing quote not in source')
 if context['framing'] in ('favourable','critical','mixed') and not span:raise ValueError('Evaluative framing requires source text')
 clear=item['stance']!='no_clear_position'
 if clear and (context['stance_basis']=='no_position' or context['no_position_reason'] is not None):raise ValueError('Contradictory stance basis')
 if not clear and (context['stance_basis']!='no_position' or context['no_position_reason'] is None):raise ValueError('Explain the absence of a position')
 if item['relevance']=='not_relevant' and context['no_position_reason']!='not_discussed':raise ValueError('Non-relevance is not neutral opinion')
 if item['relevance']=='relevant' and context['no_position_reason']=='not_discussed':raise ValueError('Relevant theme cannot be absent')

# Wire representation shares post-level framing once; storage uses the canonical schema.
def compact_schema(themes):
 label=obj({'theme':enum(list(themes)),'relevance':enum(['relevant','not_relevant','uncertain']),'stance':enum(['support','opposition','mixed','no_clear_position']),'evidence_span':{'type':['string','null']},'basis':enum(['explicit','contextual']+ABSENCES)})
 context={k:v for k,v in CONTEXT['properties'].items() if k not in ('stance_basis','no_position_reason')}
 return obj({'records':{'type':'array','items':obj({'record_id':{'type':'string'},'context':obj(context),'reason':{'type':'string'},'labels':{'type':'array','items':label}})}})

def expand_compact(output,records,themes):
 if not isinstance(output,dict) or set(output)!={'records'} or not isinstance(output['records'],list):raise ValueError('Invalid compact response')
 seen=set();expanded=[]
 for record in output['records']:
  if not isinstance(record,dict) or set(record)!={'record_id','context','reason','labels'}:raise ValueError('Invalid compact record')
  if record['record_id'] in seen:raise ValueError('Duplicate compact record')
  seen.add(record['record_id'])
  if not isinstance(record['context'],dict) or set(record['context'])!={'format','framing','framing_target','framing_span'}:raise ValueError('Invalid shared framing')
  if not isinstance(record['labels'],list):raise ValueError('Invalid theme labels')
  for label in record['labels']:
   if not isinstance(label,dict) or set(label)!={'theme','relevance','stance','evidence_span','basis'}:raise ValueError('Invalid compact label')
   basis=label['basis']
   if basis not in ['explicit','contextual']+ABSENCES:raise ValueError('Invalid basis')
   expanded.append({'record_id':record['record_id'],**{k:label[k] for k in ('theme','relevance','stance','evidence_span')},'reason':record['reason'],'context':{**record['context'],'stance_basis':basis if basis in ('explicit','contextual') else 'no_position','no_position_reason':None if basis in ('explicit','contextual') else basis}})
 from .inference import validate_classifications
 return validate_classifications({'classifications':expanded},records,themes=themes,contextual=True)

# Sparse wire format records absent themes explicitly, without repeating neutral labels.
def sparse_schema(themes):
 label=obj({'theme':enum(list(themes)),'relevance':enum(['relevant','uncertain']),'stance':enum(['support','opposition','mixed','no_clear_position']),'evidence_span':{'type':['string','null']},'basis':enum(['explicit','contextual','descriptive','question_only','ambiguous_target','insufficient_context'])})
 record=compact_schema(themes)['properties']['records']['items']['properties'].copy()
 record['labels']={'type':'array','items':label}
 record['not_discussed']={'type':'array','items':enum(list(themes))}
 return obj({'records':{'type':'array','items':obj(record)}})

def expand_sparse(output,records,themes):
 if not isinstance(output,dict) or set(output)!={'records'} or not isinstance(output['records'],list):raise ValueError('Invalid sparse response')
 expanded=[]
 for item in output['records']:
  if not isinstance(item,dict) or set(item)!={'record_id','context','reason','labels','not_discussed'}:raise ValueError('Invalid sparse record')
  absent=item['not_discussed']
  if not isinstance(absent,list) or any(t not in themes for t in absent) or len(set(absent))!=len(absent):raise ValueError('Invalid absent themes')
  expanded.append({k:v for k,v in item.items() if k!='not_discussed'})
  expanded[-1]['labels']=item['labels']+[{'theme':t,'relevance':'not_relevant','stance':'no_clear_position','evidence_span':None,'basis':'not_discussed'} for t in absent]
 return expand_compact({'records':expanded},records,themes)
