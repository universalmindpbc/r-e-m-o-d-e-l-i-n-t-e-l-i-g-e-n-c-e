import os,datetime,pathlib
from urllib.parse import urlsplit,urlunsplit
import psycopg
from psycopg.rows import dict_row
from psycopg import sql
from rmu_backend.operations import export_snapshot,restore_snapshot
root=pathlib.Path(__file__).parents[1]
name='rmu_recovery_'+datetime.datetime.now().strftime('%Y%m%d%H%M%S')
backup=root/'private'/('snapshot-'+name+'.json')
print('Snapshot:',export_snapshot(backup))
owner=os.environ['DATABASE_URL_UNPOOLED']
with psycopg.connect(owner,autocommit=True) as conn:conn.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(name)))
u=urlsplit(owner);target=urlunsplit((u.scheme,u.netloc,'/'+name,u.query,u.fragment))
with psycopg.connect(target,row_factory=dict_row) as conn:
 for migration in sorted((root/'migrations').glob('*.sql')):conn.execute(migration.read_text())
 print('Restore:',restore_snapshot(conn,backup))
print('Recovery database:',name,'(synthetic-only pre-collection snapshot)')
