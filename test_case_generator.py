import sqlite3
import tempfile
from pathlib import Path
import unittest

from app import CaseGenerator, PatientProfile


class FakeModels:
    def __init__(self, rank=1):
        self.calls = 0
        self.rank = rank

    def generate_content(self, **kwargs):
        self.calls += 1
        self.config = kwargs["config"]
        profile = PatientProfile(
            name="Alex Rivera",
            age=42,
            pronouns="they/them",
            occupation="Teacher",
            background="Lives with family.",
            medical_history=[],
            medications=[],
            allergies=[],
            chief_complaint="Cough and fever",
            opening_line="I've had a cough for a few days.",
            symptom_timeline="It started three days ago.",
            symptoms=[{
                "association_rank": self.rank,
                "name": "cough",
                "patient_description": "I keep coughing.",
                "onset": "Three days ago",
                "severity": "Moderate",
            }],
            pertinent_negatives=[],
            details_to_reveal_if_asked=["The cough is worse at night."],
        )
        return type("Response", (), {"parsed": profile, "text": None})()


class FakeClient:
    def __init__(self, rank=1):
        self.models = FakeModels(rank)


class CaseGeneratorTests(unittest.TestCase):
    def test_fixed_shape_and_persistent_cache(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory) / "cases.sqlite3"
            first_client = FakeClient()
            generator = CaseGenerator(client=first_client, cache_database=cache)
            self.assertEqual(len(generator.diseases()), 134)
            first = generator.generate(5)
            self.assertEqual(set(first), {"schema_version", "case_id", "diagnosis", "patient"})
            self.assertEqual(first["patient"]["symptoms"][0]["association_rank"], 1)
            self.assertEqual(first_client.models.calls, 1)
            self.assertEqual(generator.generate(5), first)
            self.assertEqual(first_client.models.calls, 1)

            second_client = FakeClient(rank=2)
            restarted = CaseGenerator(client=second_client, cache_database=cache)
            self.assertEqual(restarted.generate(5), first)
            self.assertEqual(second_client.models.calls, 0)
            with sqlite3.connect(cache) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], 1)

    def test_invalid_association_rank_is_not_cached(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory) / "cases.sqlite3"
            generator = CaseGenerator(client=FakeClient(rank=999), cache_database=cache)
            with self.assertRaisesRegex(RuntimeError, "invalid symptom ranks"):
                generator.generate(5)
            with sqlite3.connect(cache) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
