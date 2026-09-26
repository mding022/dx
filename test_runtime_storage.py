"""Vercel runtime databases must not write into the deployment bundle."""

import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import app
import runtime_storage
from runtime_storage import ROOT, runtime_database


class RuntimeStorageTests(unittest.TestCase):
    def test_vercel_uses_temporary_storage(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.dict(os.environ, {"VERCEL": "1"}):
                with patch("runtime_storage.tempfile.gettempdir", return_value=directory):
                    self.assertEqual(runtime_database("simulations.sqlite3"),
                                     Path(directory) / "dx" / "simulations.sqlite3")
            with patch.dict(os.environ, {"VERCEL": "", "VERCEL_ENV": ""}):
                self.assertEqual(runtime_database("simulations.sqlite3"),
                                 ROOT / "data" / "simulations.sqlite3")
                with patch.object(runtime_storage, "ROOT", Path("/var/task")):
                    with patch("runtime_storage.tempfile.gettempdir", return_value=directory):
                        self.assertEqual(runtime_database("simulations.sqlite3"),
                                         Path(directory) / "dx" / "simulations.sqlite3")

    def test_case_cache_is_copied_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "generated_cases.sqlite3"
            with sqlite3.connect(app.CACHE_SEED_DB) as db:
                initial_count = db.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
            with patch.object(app, "CACHE_DB", destination):
                generator = app.CaseGenerator(cache_database=destination)
                saved = generator._save_case(9999, {"case_id": 9999})
            self.assertEqual(saved, {"case_id": 9999})
            with sqlite3.connect(destination) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], initial_count + 1)
            with sqlite3.connect(app.CACHE_SEED_DB) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], initial_count)


if __name__ == "__main__":
    unittest.main()
