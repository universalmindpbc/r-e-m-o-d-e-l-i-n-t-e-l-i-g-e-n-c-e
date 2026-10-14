"""Gemini's auditable fan heuristic, with uncertainty and stable-ID boundaries."""
import json
import re
from pathlib import Path

RULES=json.loads(Path(__file__).with_name('fan_rules.json').read_text())

def classify_author(profile,post_text,identities):
    ident=str(profile.get('id',''))
    for label in ('talent','organisation'):
        if ident and ident==identities.get(label):
            return {'label':label,'rule_version':RULES['version'],'reason':'Resolved platform account ID','review_status':'identity_resolved'}
    bio=(profile.get('description') or '').lower()
    content=(post_text or '').lower()
    matches=[k for k in RULES['fandom_keywords'] if re.search(r'(?<!\w)'+re.escape(k)+r'(?!\w)',bio)]
    aliases=[k for k in RULES['talent_aliases'] if re.search(r'(?<!\w)'+re.escape(k)+r'(?!\w)',content)]
    score=len(matches)*RULES['bio_keyword_points']+(RULES['text_alias_points'] if aliases else 0)
    return {'label':'inferred_fan' if score>=RULES['threshold'] else 'uncertain','rule_version':RULES['version'],
        'heuristic_points':score,'bio_matches':matches,'text_matches':aliases,'profile_available':bool(profile.get('id')),
        'review_status':'pending','reason':'Profile/content heuristic; not verified membership','limitations':RULES['limitations']}
