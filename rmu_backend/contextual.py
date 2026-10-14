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
