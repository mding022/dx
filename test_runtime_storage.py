"""Persistent storage works across backend instances."""

import os
import sqlite3
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

from app import CACHE_SEED_DB, CaseGenerator
from runtime_storage import connect_writable_database, runtime_database
from simulation_repository import SimulationRepository


class RuntimeStorageTests(unittest.TestCase):
    def test_vercel_requires_turso_credentials(self):
        with patch.dict(os.environ, {"VERCEL": "1", "TURSO_DATABASE_URL": "", "TURSO_AUTH_TOKEN": ""}):
            with self.assertRaisesRegex(RuntimeError, "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN"):
                connect_writable_database(runtime_database("simulations.sqlite3"))

    def test_remote_cache_and_history_survive_new_instances(self):
        with tempfile.TemporaryDirectory() as directory:
            remote_file = Path(directory) / "turso.sqlite3"
            fake_driver = types.SimpleNamespace(
                connect=lambda url, auth_token: sqlite3.connect(remote_file),
                Row=sqlite3.Row,
            )
            with sqlite3.connect(CACHE_SEED_DB) as seed:
                disease_id = seed.execute("SELECT disease_id FROM cases LIMIT 1").fetchone()[0]
            with patch.dict(os.environ, {
                "TURSO_DATABASE_URL": "libsql://dx.turso.io",
                "TURSO_AUTH_TOKEN": "test-token",
            }), patch.dict("sys.modules", {"turso_serverless": fake_driver}):
                generator = CaseGenerator()
                self.assertIsNotNone(generator._cached_case(disease_id))
                generator._save_case(9999, {"case_id": 9999})
                self.assertEqual(CaseGenerator()._cached_case(9999), {"case_id": 9999})

                case = {
                    "case_id": 9999,
                    "diagnosis": "test",
                    "patient": {
                        "name": "Maya", "age": 34, "pronouns": "she/her",
                        "occupation": "Teacher", "background": "Lives nearby.",
                        "medical_history": [], "medications": [], "allergies": [],
                    },
                }
                simulation_id = SimulationRepository().create("student", case)["simulation_id"]
                saved = SimulationRepository().get_for_user("student", simulation_id, lambda _: "test")
                self.assertEqual(saved["patient"]["name"], "Maya")

    def test_local_development_uses_sqlite(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "local.sqlite3"
            with patch.dict(os.environ, {
                "VERCEL": "", "VERCEL_ENV": "",
                "TURSO_DATABASE_URL": "", "TURSO_AUTH_TOKEN": "",
            }):
                with connect_writable_database(path) as db:
                    db.execute("CREATE TABLE demo (id INTEGER PRIMARY KEY)")
                self.assertTrue(path.is_file())


if __name__ == "__main__":
    unittest.main()
