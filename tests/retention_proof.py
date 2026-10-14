import os,psycopg
from psycopg.rows import dict_row
from rmu_backend.retention import purge_posts
ws='de000000-0000-4000-8000-000000000002'
with psycopg.connect(os.environ['DATABASE_URL_UNPOOLED'],row_factory=dict_row) as conn:
 row=conn.execute("SELECT post_id FROM rmu.posts WHERE workspace_id=%s AND provider='x' LIMIT 1",(ws,)).fetchone()
 assert row,'Run mock transport integration first'
 result=purge_posts(conn,ws,[row['post_id']],'Synthetic QA rollback proof')
 assert conn.execute('SELECT count(*) AS n FROM rmu.observations WHERE workspace_id=%s AND post_id=%s',(ws,row['post_id'])).fetchone()['n']==0
 assert conn.execute('SELECT count(*) AS n FROM rmu.deletion_register WHERE workspace_id=%s AND post_id=%s',(ws,row['post_id'])).fetchone()['n']==1
 conn.rollback()
 print('PASS: takedown removed QA evidence and derived results, registered tombstone; transaction rolled back',result)
