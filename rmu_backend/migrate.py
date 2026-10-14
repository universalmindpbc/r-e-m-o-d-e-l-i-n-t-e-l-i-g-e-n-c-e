"""Apply numbered SQL migrations once, transactionally, using a direct owner URL."""
import hashlib
import os
from pathlib import Path
import psycopg


def main():
    root = Path(__file__).resolve().parents[1]
    with psycopg.connect(os.environ.get('DATABASE_URL_UNPOOLED', os.environ['DATABASE_URL']), connect_timeout=15) as conn:
        conn.execute('SELECT pg_advisory_xact_lock(74682117)')
        exists = conn.execute("SELECT to_regclass('rmu.schema_migrations')").fetchone()[0]
        done = {r[0] for r in conn.execute('SELECT version FROM rmu.schema_migrations')} if exists else set()
        for path in sorted((root / 'migrations').glob('*.sql')):
            version = int(path.name.split('_')[0])
            if version in done:
                continue
            conn.execute(path.read_text())
            print('Applied migration', version, hashlib.sha256(path.read_bytes()).hexdigest()[:12])

if __name__ == '__main__':
    main()
