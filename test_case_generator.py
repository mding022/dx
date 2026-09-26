import sqlite3
import tempfile
from contextlib import closing
from pathlib import Path
import unittest

from app import CaseGenerator, PatientPersona, PatientProfile


class FakeModels:
    def __init__(self, rank=1, fail_persona=False):
        self.calls = 0
        self.rank = rank
        self.fail_persona = fail_persona

    def generate_content(self, **kwargs):
        self.calls += 1
        self.config = kwargs["config"]
        if self.config.response_schema is PatientPersona:
            if self.fail_persona:
                raise RuntimeError("Simulated Gemini failure")
            persona = PatientPersona(
                occupation="Teacher",
                background=f"Lives near family; variation {self.calls}.",
                opening_line="I've had a cough for a few days.",
                symptom_timeline="It started three days ago.",
                pertinent_negatives=[],
                details_to_reveal_if_asked=["The cough is worse at night."],
            )
            return type("Response", (), {"parsed": persona, "text": None})()
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
    def __init__(self, rank=1, fail_persona=False):
        self.models = FakeModels(rank, fail_persona)


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
            with closing(sqlite3.connect(cache)) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], 1)

    def test_invalid_association_rank_is_not_cached(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory) / "cases.sqlite3"
            generator = CaseGenerator(client=FakeClient(rank=999), cache_database=cache)
            with self.assertRaisesRegex(RuntimeError, "invalid symptom ranks"):
                generator.generate(5)
            with closing(sqlite3.connect(cache)) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], 0)

    def test_new_simulations_reuse_symptoms_with_different_patients(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory) / "cases.sqlite3"
            client = FakeClient()
            generator = CaseGenerator(client=client, cache_database=cache)
            first = generator.generate_personalized(5)
            second = generator.generate_personalized(5)
            cached = generator.generate(5)

            self.assertEqual(client.models.calls, 3)
            self.assertEqual(first["patient"]["symptoms"], second["patient"]["symptoms"])
            self.assertEqual(first["patient"]["symptoms"], cached["patient"]["symptoms"])
            self.assertNotEqual(first["patient"]["name"], second["patient"]["name"])
            self.assertNotEqual(first["patient"]["age"], second["patient"]["age"])
            self.assertNotEqual(first["patient"]["pronouns"], second["patient"]["pronouns"])
            self.assertEqual({first["patient"]["pronouns"], second["patient"]["pronouns"]}, {"he/him", "she/her"})
            self.assertNotEqual(first["patient"]["background"], second["patient"]["background"])
            self.assertEqual(set(first), set(second))
            self.assertEqual(set(first["patient"]), set(second["patient"]))
            with closing(sqlite3.connect(cache)) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM cases").fetchone()[0], 1)
                self.assertEqual(db.execute("SELECT COUNT(*) FROM persona_state").fetchone()[0], 1)

    def test_persona_fallback_keeps_supported_pronouns(self):
        with tempfile.TemporaryDirectory() as directory:
            generator = CaseGenerator(client=FakeClient(fail_persona=True), cache_database=Path(directory) / "cases.sqlite3")
            first = generator.generate_personalized(5)
            second = generator.generate_personalized(5)
            self.assertEqual({first["patient"]["pronouns"], second["patient"]["pronouns"]}, {"he/him", "she/her"})


if __name__ == "__main__":
    unittest.main()
