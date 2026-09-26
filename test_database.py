import sqlite3
from contextlib import closing
import tempfile
from pathlib import Path
import unittest

from build_database import DEFAULT_SOURCE, build_database, read_source
from illness_repository import IllnessRepository


class ImportTests(unittest.TestCase):
    def test_full_source_and_rebuild(self):
        source = read_source(DEFAULT_SOURCE)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'test.sqlite3'
            first = build_database(DEFAULT_SOURCE, path)
            self.assertEqual(first, build_database(DEFAULT_SOURCE, path))
            repo = IllnessRepository(path)
            self.assertEqual(len(repo.list_diseases()), len(source))
            for disease_id, original in enumerate(source, 1):
                actual = repo.get_disease(disease_id)
                self.assertEqual(actual['source_term'], original['raw'])
                self.assertEqual(actual['occurrence_count'], original['count'])
                self.assertEqual(actual['terms'], original['terms'])
                self.assertEqual(len(actual['symptoms']), len(original['symptoms']))
                for rank, (symptom, original_symptom) in enumerate(zip(actual['symptoms'], original['symptoms']), 1):
                    raw, aliases, row = original_symptom
                    self.assertEqual((symptom['rank'], symptom['source_term'], symptom['source_row']), (rank, raw, row))
                    self.assertEqual(symptom['terms'], aliases)
            self.assertTrue(repo.list_diseases('pneumonia'))
            self.assertTrue(repo.list_diseases('C0032285'))
            self.assertTrue(repo.list_diseases('depressive disorder'))
            self.assertEqual(repo.list_diseases("' OR 1=1 --"), [])
            self.assertIsNone(repo.get_disease(-1))
            with closing(sqlite3.connect(path)) as db:
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
                self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(), [])


if __name__ == '__main__':
    unittest.main()
