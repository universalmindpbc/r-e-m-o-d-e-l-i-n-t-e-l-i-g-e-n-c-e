"""Transactions always select a non-owner role and a server-bound workspace."""
import os
import encodings.idna  # Initialise hostname codec before recovery/request threads start.
from contextlib import contextmanager
from uuid import UUID
import psycopg
from psycopg.rows import dict_row

@contextmanager
def transaction(workspace=None):
    workspace = str(UUID(workspace or os.environ['RMU_WORKSPACE_ID']))
    with psycopg.connect(os.environ['DATABASE_URL'], connect_timeout=10, row_factory=dict_row) as conn:
        conn.execute('SET LOCAL ROLE rmu_api')
        conn.execute("SELECT set_config('rmu.workspace_id',%s,true)", (workspace,))
        conn.execute("SET LOCAL statement_timeout='15s'")
        yield conn


def status():
    with transaction() as conn:
        version = conn.execute('SELECT max(version) AS version FROM rmu.schema_migrations').fetchone()['version']
        workspace = conn.execute('SELECT name FROM rmu.workspaces').fetchone()
        if not workspace:
            raise RuntimeError('Workspace not configured')
        return {'database_verified': True, 'schema_version': version, 'workspace': workspace['name']}
