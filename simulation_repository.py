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
