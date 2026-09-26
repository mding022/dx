import tempfile
from pathlib import Path
import unittest

from simulation_repository import SimulationRepository


class SimulationRepositoryTests(unittest.TestCase):
    def test_account_isolation_and_one_time_evaluation(self):
        case = {"case_id": 5, "diagnosis": "pneumonia", "patient": {
            "name": "Alex Rivera", "age": 42, "pronouns": "they/them",
            "occupation": "Teacher", "background": "Lives with family.",
            "medical_history": [], "medications": [], "allergies": [],
            "symptoms": [{"name": "cough"}],
        }}
        with tempfile.TemporaryDirectory() as directory:
            repo = SimulationRepository(Path(directory) / "simulations.sqlite3")
            created = repo.create("auth0|student-one", case)
            simulation_id = created["simulation_id"]
            self.assertEqual(repo.list_for_user("auth0|student-two", lambda _: None), [])
            self.assertIsNone(repo.get_for_user("auth0|student-two", simulation_id, lambda _: None))
            before = repo.get_for_user("auth0|student-one", simulation_id, lambda _: None)
            self.assertEqual(before["status"], "awaiting_diagnosis")
            self.assertNotIn("symptoms", before["patient"])
            self.assertNotIn("result", before)

            lookup = lambda disease_id: {5: "pneumonia", 8: "asthma"}.get(disease_id)
            result = repo.complete("auth0|student-one", simulation_id, 5, lookup)
            self.assertTrue(result["result"]["correct"])
            self.assertEqual(repo.complete("auth0|student-one", simulation_id, 8, lookup), result)
            self.assertEqual(repo.list_for_user("auth0|student-one", lookup)[0], result)

    def test_review_compares_only_selected_case_symptoms_by_source_id(self):
        case = {"case_id": 5, "diagnosis": "pneumonia", "patient": {
            "name": "Alex Rivera", "age": 42, "pronouns": "they/them",
            "occupation": "Teacher", "background": "Lives with family.",
            "medical_history": [], "medications": [], "allergies": [],
            "symptom_timeline": "The cough began two days ago.",
            "details_to_reveal_if_asked": ["Feels worse at night."],
            "pertinent_negatives": ["No recent travel."],
            "symptoms": [
                {"association_rank": 1, "name": "cough", "patient_description": "I keep coughing.", "onset": "Two days ago", "severity": "Moderate"},
                {"association_rank": 2, "name": "fever", "patient_description": "I feel hot.", "onset": "Yesterday", "severity": "Mild"},
            ],
        }}
        diseases = {
            5: {"symptoms": [{"id": 45, "rank": 1}, {"id": 46, "rank": 2}, {"id": 99, "rank": 3}]},
            8: {"symptoms": [{"id": 45, "rank": 4}, {"id": 77, "rank": 5}]},
        }
        with tempfile.TemporaryDirectory() as directory:
            repo = SimulationRepository(Path(directory) / "simulations.sqlite3")
            simulation_id = repo.create("student", case)["simulation_id"]
            result = repo.complete("student", simulation_id, 8,
                                   lambda disease_id: {5: "pneumonia", 8: "asthma"}[disease_id],
                                   diseases.get)
            review = result["result"]["review"]
            self.assertEqual([item["name"] for item in review["shared_symptoms"]], ["cough"])
            self.assertEqual([item["name"] for item in review["not_linked_to_selected_diagnosis"]], ["fever"])
            self.assertEqual(review["details_to_reveal_if_asked"], ["Feels worse at night."])
            self.assertEqual(review["symptom_timeline"], "The cough began two days ago.")
            self.assertEqual(repo.get_for_user("student", simulation_id,
                lambda disease_id: {5: "pneumonia", 8: "asthma"}[disease_id], diseases.get)["result"]["review"], review)


if __name__ == "__main__":
    unittest.main()
