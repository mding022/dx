"""Read-only, JSON-ready access for a future Flask backend. No dependencies."""
import argparse
from contextlib import contextmanager
import json
from pathlib import Path
import sqlite3

DEFAULT_DB = Path(__file__).resolve().parent / 'data/illnesses.sqlite3'


class IllnessRepository:
    def __init__(self, database=DEFAULT_DB):
        self.database = Path(database).resolve()

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(self.database.as_uri() + '?mode=ro', uri=True)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
        finally:
            connection.close()

    def list_diseases(self, search=''):
        """Search names, aliases or UMLS codes; empty search returns all diseases."""
        with self._connect() as db:
            return [dict(row) for row in db.execute('''
                SELECT d.id, d.name, d.occurrence_count FROM diseases d
                WHERE EXISTS (SELECT 1 FROM disease_terms t WHERE t.disease_id=d.id
                    AND (instr(lower(t.name), lower(?)) > 0 OR instr(lower(t.umls_code), lower(?)) > 0))
                ORDER BY d.name, d.id
            ''', (search, search))]

    def get_disease(self, disease_id):
        """Return a disease with its symptoms ordered by source association rank."""
        with self._connect() as db:
            row = db.execute('SELECT * FROM diseases WHERE id=?', (disease_id,)).fetchone()
            if row is None:
                return None
            disease = dict(row)
            disease['terms'] = [dict(t) for t in db.execute(
                'SELECT umls_code, name FROM disease_terms WHERE disease_id=? ORDER BY rowid', (disease_id,))]
            disease['symptoms'] = []
            for row in db.execute('''SELECT s.*, ds.rank, ds.source_row FROM disease_symptoms ds
                JOIN symptoms s ON s.id=ds.symptom_id WHERE ds.disease_id=? ORDER BY ds.rank''', (disease_id,)):
                symptom = dict(row)
                symptom['terms'] = [dict(t) for t in db.execute(
                    'SELECT umls_code, name FROM symptom_terms WHERE symptom_id=? ORDER BY rowid', (symptom['id'],))]
                disease['symptoms'].append(symptom)
            return disease

    def metadata(self):
        with self._connect() as db:
            return dict(db.execute('SELECT key, value FROM metadata').fetchall())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--search', default='')
    parser.add_argument('--id', type=int)
    args = parser.parse_args()
    repo = IllnessRepository()
    print(json.dumps(repo.get_disease(args.id) if args.id is not None else repo.list_diseases(args.search), indent=2))
