"""Operator-only: create a least-privilege login; never print its password."""
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,quote
import secrets
import psycopg
from psycopg import sql
p=Path(__file__).parent / '.env.local'
settings=dict(line.split('=',1) for line in p.read_text().splitlines() if line and not line.startswith('#'))
owner=settings.get('DATABASE_URL_UNPOOLED',settings['DATABASE_URL'])
with psycopg.connect(owner,connect_timeout=15) as conn:
    if conn.execute("SELECT 1 FROM pg_roles WHERE rolname='rmu_runtime'").fetchone():
        raise SystemExit('Runtime role exists; preserve its credential')
    password=secrets.token_urlsafe(48)
    conn.execute(sql.SQL('CREATE ROLE rmu_runtime LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD {}').format(sql.Literal(password)))
    conn.execute('GRANT rmu_api TO rmu_runtime')
parts=urlsplit(owner)
host=parts.hostname
pooled=host.replace('.','-pooler.',1) if '-pooler.' not in host else host
settings['DATABASE_URL_UNPOOLED']=owner
settings['DATABASE_URL']=urlunsplit((parts.scheme,'rmu_runtime:'+quote(password,safe='')+'@'+pooled+((':'+str(parts.port)) if parts.port else ''),parts.path,parts.query,parts.fragment))
p.write_text(''.join(k+'='+v+'\n' for k,v in settings.items()))
p.chmod(0o600)
print('Restricted runtime role created; pooled runtime and direct migration URLs saved privately')
