"""Account-scoped simulation history stored separately from the source dataset."""

import json
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from case_review import build_case_review
from runtime_storage import connect_writable_database, runtime_database


DEFAULT_DB = runtime_database("simulations.sqlite3")
PATIENT_PROFILE_FIELDS = (
    "name", "age", "pronouns", "occupation", "background",
    "medical_history", "medications", "allergies",
)
PATIENT_CONVERSATION_FIELDS = PATIENT_PROFILE_FIELDS + (
    "chief_complaint", "opening_line", "symptom_timeline",
    "pertinent_negatives", "details_to_reveal_if_asked",
)
INSIGHTS_UNLOCK_CASES = 5


class SimulationRepository:
    def __init__(self, database=None):
        self.database = Path(database) if database is not None else DEFAULT_DB
        self.use_turso = database is None

    def _connect(self):
        db = connect_writable_database(self.database, use_turso=self.use_turso, rows=True)
        db.execute("""CREATE TABLE IF NOT EXISTS simulations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            case_id INTEGER NOT NULL,
            case_json TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('awaiting_diagnosis', 'completed')),
            diagnosis_id INTEGER,
            created_at TEXT NOT NULL,
            completed_at TEXT
        )""")
        db.execute("CREATE INDEX IF NOT EXISTS simulations_user_created ON simulations(user_id, created_at DESC)")
        return db

    def create(self, user_id, case):
        simulation_id = uuid4().hex
        created_at = datetime.now(timezone.utc).isoformat()
        with closing(self._connect()) as db, db:
            db.execute("""INSERT INTO simulations
                (id, user_id, case_id, case_json, status, created_at)
                VALUES (?, ?, ?, ?, 'awaiting_diagnosis', ?)""",
                (simulation_id, user_id, case["case_id"], json.dumps(case, ensure_ascii=False), created_at))
        return {"simulation_id": simulation_id, "case": case}

    def _view(self, row, disease_name=None, disease_details=None):
        case = json.loads(row["case_json"])
        patient = case["patient"]
        view = {
            "id": row["id"],
            "status": row["status"],
            "created_at": row["created_at"],
            "completed_at": row["completed_at"],
            "patient": {key: patient[key] for key in PATIENT_PROFILE_FIELDS},
        }
        if row["status"] == "completed":
            view["result"] = {
                "diagnosis": case["diagnosis"],
                "diagnosis_id": case["case_id"],
                "submitted_diagnosis_id": row["diagnosis_id"],
                "submitted_diagnosis": disease_name,
                "correct": row["diagnosis_id"] == case["case_id"],
            }
            if disease_details is not None:
                view["result"]["review"] = build_case_review(
                    case,
                    disease_details(case["case_id"]),
                    disease_details(row["diagnosis_id"]),
                )
        return view

    def list_for_user(self, user_id, disease_lookup):
        with closing(self._connect()) as db:
            rows = db.execute("SELECT * FROM simulations WHERE user_id=? ORDER BY created_at DESC, id DESC", (user_id,)).fetchall()
        return [self._view(row, disease_lookup(row["diagnosis_id"]) if row["diagnosis_id"] else None) for row in rows]

    def insights_for_user(self, user_id, disease_lookup, disease_details):
        """Summarize completed reviews without exposing another account's cases."""
        with closing(self._connect()) as db:
            rows = db.execute(
                "SELECT id, case_id, case_json, diagnosis_id FROM simulations "
                "WHERE user_id=? AND status='completed' ORDER BY completed_at DESC, id DESC",
                (user_id,),
            ).fetchall()

        completed = len(rows)
        locked = {"unlocked": False, "completed_cases": completed, "required_cases": INSIGHTS_UNLOCK_CASES}
        if completed < INSIGHTS_UNLOCK_CASES:
            return locked

        details_cache = {}
        name_cache = {}

        def details(disease_id):
            if disease_id not in details_cache:
                details_cache[disease_id] = disease_details(disease_id)
            return details_cache[disease_id]

        def name(disease_id):
            if disease_id not in name_cache:
                name_cache[disease_id] = disease_lookup(disease_id) or f"Condition {disease_id}"
            return name_cache[disease_id]

        correct = 0
        confusions = {}
        clues = {}
        for row in rows:
            case = json.loads(row["case_json"])
            actual_id = row["case_id"]
            chosen_id = row["diagnosis_id"]
            if actual_id == chosen_id:
                correct += 1
                continue

            actual_name = case.get("diagnosis") or name(actual_id)
            chosen_name = name(chosen_id)
            pair_key = (actual_id, chosen_id)
            if pair_key not in confusions:
                confusions[pair_key] = {
                    "actual_diagnosis": actual_name,
                    "actual_diagnosis_id": actual_id,
                    "chosen_diagnosis": chosen_name,
                    "chosen_diagnosis_id": chosen_id,
                    "count": 0,
                    "example_simulation_id": row["id"],
                    "clues": {},
                }
            pair = confusions[pair_key]
            pair["count"] += 1

            review = build_case_review(case, details(actual_id), details(chosen_id))
            actual_by_rank = {
                symptom["rank"]: symptom["id"]
                for symptom in (details(actual_id) or {}).get("symptoms", [])
            }
            seen_ids = set()
            for symptom in review["not_linked_to_selected_diagnosis"]:
                source_id = actual_by_rank.get(symptom["association_rank"])
                if source_id is None or source_id in seen_ids:
                    continue
                seen_ids.add(source_id)
                label = symptom["name"]
                if source_id not in clues:
                    clues[source_id] = {"symptom_id": source_id, "name": label, "count": 0, "associated_diseases": set()}
                clues[source_id]["count"] += 1
                clues[source_id]["associated_diseases"].add(actual_name)
                pair["clues"][source_id] = label

        top_confusions = sorted(confusions.values(), key=lambda item: (-item["count"], item["actual_diagnosis"], item["chosen_diagnosis"]))[:6]
        for pair in top_confusions:
            pair["clues"] = list(pair["clues"].values())[:3]

        top_clues = sorted(clues.values(), key=lambda item: (-item["count"], item["name"]))[:8]
        for clue in top_clues:
            clue["associated_diseases"] = sorted(clue["associated_diseases"])

        return {
            "unlocked": True,
            "completed_cases": completed,
            "required_cases": INSIGHTS_UNLOCK_CASES,
            "correct_cases": correct,
            "incorrect_cases": completed - correct,
            "top_confusions": top_confusions,
            "clues_to_revisit": top_clues,
        }

    def get_for_user(self, user_id, simulation_id, disease_lookup, disease_details=None):
        with closing(self._connect()) as db:
            row = db.execute("SELECT * FROM simulations WHERE user_id=? AND id=?", (user_id, simulation_id)).fetchone()
        if row is None:
            return None
        return self._view(row, disease_lookup(row["diagnosis_id"]) if row["diagnosis_id"] else None, disease_details)

    def get_patient_for_conversation(self, user_id, simulation_id):
        """Load the saved patient for an active, account-owned interview."""
        with closing(self._connect()) as db:
            row = db.execute(
                "SELECT case_json FROM simulations WHERE user_id=? AND id=? AND status='awaiting_diagnosis'",
                (user_id, simulation_id),
            ).fetchone()
        if row is None:
            return None
        patient = json.loads(row["case_json"])["patient"]
        context = {key: patient[key] for key in PATIENT_CONVERSATION_FIELDS}
        context["symptoms"] = [
            {key: symptom[key] for key in ("name", "patient_description", "onset", "severity")}
            for symptom in patient["symptoms"]
        ]
        return {"patient": context}

    def complete(self, user_id, simulation_id, diagnosis_id, disease_lookup, disease_details=None):
        completed_at = datetime.now(timezone.utc).isoformat()
        with closing(self._connect()) as db, db:
            db.execute("""UPDATE simulations SET status='completed', diagnosis_id=?, completed_at=?
                WHERE user_id=? AND id=? AND status='awaiting_diagnosis'""",
                (diagnosis_id, completed_at, user_id, simulation_id))
            row = db.execute("SELECT * FROM simulations WHERE user_id=? AND id=?", (user_id, simulation_id)).fetchone()
        if row is None:
            return None
        return self._view(row, disease_lookup(row["diagnosis_id"]) if row["diagnosis_id"] else None, disease_details)
