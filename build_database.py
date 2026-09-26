"""Import the notebook's original Excel rows without changing their ranking."""
import argparse
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import tempfile

ROOT = Path(__file__).resolve().parent
DEFAULT_SOURCE = ROOT / 'upstream/notebook/dataset/raw_data.xlsx'
DEFAULT_DB = ROOT / 'data/illnesses.sqlite3'
SOURCE_URL = 'https://impact.dbmi.columbia.edu/~friedma/Projects/DiseaseSymptomKB/index.html'


def terms(raw):
    result = []
    for item in raw.split('^'):
        match = re.fullmatch(r'UMLS:(C\d+)_(.*)', item.strip())
        if not match:
            raise ValueError(f'Invalid source term: {item!r}')
        result.append({'umls_code': match[1], 'name': match[2]})
    return result


def read_source(source):
    from openpyxl import load_workbook
    workbook = load_workbook(source, read_only=True, data_only=True)
    try:
        sheet = workbook.active
        rows = iter(sheet.values)
        if tuple(next(rows)) != ('Disease', 'Count of Disease Occurrence', 'Symptom'):
            raise ValueError('Unexpected Excel headers')
        diseases = []
        current = None
        for row_number, (disease, count, symptom) in enumerate(rows, 2):
            if disease is None and count is None and symptom is None:
                continue
            if disease is not None:
                if count is None or int(count) != count or count < 0:
                    raise ValueError(f'Invalid occurrence count at row {row_number}')
                current = {'raw': disease, 'count': int(count), 'terms': terms(disease), 'symptoms': []}
                diseases.append(current)
            elif count is not None:
                raise ValueError(f'Unexpected count at row {row_number}')
            if current is None or not symptom:
                raise ValueError(f'Missing disease or symptom at row {row_number}')
            current['symptoms'].append((symptom, terms(symptom), row_number))
        return diseases
    finally:
        workbook.close()


def build_database(source=DEFAULT_SOURCE, destination=DEFAULT_DB):
    source, destination = Path(source), Path(destination)
    diseases = read_source(source)
    if not diseases:
        raise ValueError('Source contains no diseases')
    destination.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(dir=destination.parent, suffix='.sqlite3')
    os.close(handle)
    try:
        with closing(sqlite3.connect(temporary)) as db, db:
            db.executescript('''
                PRAGMA foreign_keys = ON;
                CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE diseases (
                    id INTEGER PRIMARY KEY, name TEXT NOT NULL,
                    source_term TEXT NOT NULL UNIQUE, occurrence_count INTEGER NOT NULL CHECK(occurrence_count >= 0));
                CREATE TABLE disease_terms (
                    disease_id INTEGER NOT NULL REFERENCES diseases(id),
                    umls_code TEXT NOT NULL, name TEXT NOT NULL,
                    PRIMARY KEY(disease_id, umls_code, name));
                CREATE TABLE symptoms (
                    id INTEGER PRIMARY KEY, name TEXT NOT NULL, source_term TEXT NOT NULL UNIQUE);
                CREATE TABLE symptom_terms (
                    symptom_id INTEGER NOT NULL REFERENCES symptoms(id),
                    umls_code TEXT NOT NULL, name TEXT NOT NULL,
                    PRIMARY KEY(symptom_id, umls_code, name));
                CREATE TABLE disease_symptoms (
                    disease_id INTEGER NOT NULL REFERENCES diseases(id),
                    symptom_id INTEGER NOT NULL REFERENCES symptoms(id),
                    rank INTEGER NOT NULL CHECK(rank > 0), source_row INTEGER NOT NULL UNIQUE,
                    PRIMARY KEY(disease_id, rank));
                CREATE INDEX symptom_diseases ON disease_symptoms(symptom_id);
            ''')
            metadata = {
                'source_url': SOURCE_URL,
                'repository_url': 'https://github.com/anujdutt9/Disease-Prediction-from-Symptoms',
                'repository_commit': (ROOT / 'upstream/.git/refs/heads/master').read_text().strip() if (ROOT / 'upstream/.git/refs/heads/master').exists() else 'unknown',
                'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'ranking': 'Source row order: decreasing strength of association; not probability.',
                'schema_version': '1',
            }
            db.executemany('INSERT INTO metadata VALUES (?, ?)', metadata.items())
            for disease in diseases:
                disease_id = db.execute('INSERT INTO diseases(name, source_term, occurrence_count) VALUES (?, ?, ?)',
                    (disease['terms'][0]['name'], disease['raw'], disease['count'])).lastrowid
                db.executemany('INSERT INTO disease_terms VALUES (?, ?, ?)',
                    [(disease_id, t['umls_code'], t['name']) for t in disease['terms']])
                for rank, (raw, aliases, row) in enumerate(disease['symptoms'], 1):
                    db.execute('INSERT OR IGNORE INTO symptoms(name, source_term) VALUES (?, ?)', (aliases[0]['name'] or aliases[0]['umls_code'], raw))
                    symptom_id = db.execute('SELECT id FROM symptoms WHERE source_term = ?', (raw,)).fetchone()[0]
                    db.executemany('INSERT OR IGNORE INTO symptom_terms VALUES (?, ?, ?)',
                        [(symptom_id, t['umls_code'], t['name']) for t in aliases])
                    db.execute('INSERT INTO disease_symptoms VALUES (?, ?, ?, ?)', (disease_id, symptom_id, rank, row))
            assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
            assert not db.execute('PRAGMA foreign_key_check').fetchall()
            counts = {table: db.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
                      for table in ('diseases', 'symptoms', 'disease_symptoms')}
        os.replace(temporary, destination)
        return counts
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--database', type=Path, default=DEFAULT_DB)
    args = parser.parse_args()
    print(json.dumps(build_database(args.source, args.database), indent=2))
