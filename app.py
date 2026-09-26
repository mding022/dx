"""Generate structured fictional patient cases from the local disease database."""

import json
import logging
import os
import sqlite3
import hmac
import secrets
import copy
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

from illness_repository import IllnessRepository
from simulation_repository import SimulationRepository


ROOT = Path(__file__).resolve().parent
CACHE_DB = ROOT / "data" / "generated_cases.sqlite3"
SCHEMA_VERSION = 1
load_dotenv(ROOT / ".env")


class PatientSymptom(BaseModel):
    association_rank: int = Field(ge=1, description="Rank of the selected source association; smaller ranks are stronger")
    name: str = Field(description="Plain-language symptom name")
    patient_description: str = Field(description="How the patient would describe it")
    onset: str = Field(description="When it started or how it developed")
    severity: str = Field(description="Patient's description of its severity")


class PatientProfile(BaseModel):
    name: str = Field(description="Fictional patient name")
    age: int = Field(ge=1, le=100)
    pronouns: str
    occupation: str
    background: str = Field(description="Short, plausible personal context")
    medical_history: list[str]
    medications: list[str]
    allergies: list[str]
    chief_complaint: str = Field(description="Short reason for visiting, in patient language")
    opening_line: str = Field(description="Natural first thing the patient says to the doctor")
    symptom_timeline: str = Field(description="Coherent account of symptom progression")
    symptoms: list[PatientSymptom]
    pertinent_negatives: list[str] = Field(description="Relevant things the patient denies if asked")
    details_to_reveal_if_asked: list[str] = Field(description="Useful background or symptom details not volunteered immediately")


class PatientPersona(BaseModel):
    occupation: str
    background: str
    opening_line: str
    symptom_timeline: str
    pertinent_negatives: list[str]
    details_to_reveal_if_asked: list[str]


PERSONA_NAMES = {
    "she/her": ("Maya Chen", "Leila Haddad", "Sofia Alvarez", "Nina Patel", "Amara Okafor", "Elena Rossi", "Priya Shah", "Grace Kim"),
    "he/him": ("Daniel Park", "Mateo Rivera", "Omar Hassan", "Noah Bennett", "Ethan Brooks", "Samuel Okoro", "Leo Martin", "Arjun Mehta"),
    "they/them": ("Jordan Lee", "Alex Morgan", "Avery Quinn", "Riley Chen", "Taylor Brooks", "Morgan Patel", "Casey Rivera", "Jamie Reed"),
}
PERSONA_HOBBIES = ("gardening", "cooking", "reading", "painting", "playing board games", "watching films", "photography", "listening to music")


SYSTEM_INSTRUCTION = """Create one fictional patient profile for a medical education simulation.
The input is a disease record and its ranked associated terms from a historical source dataset. The rank is association strength, not symptom probability. The list can contain lab findings, exam signs, tests, and noisy associations; it is not a checklist to copy. Select only a few patient-observable terms that make a medically plausible presentation of the named disease. Every returned symptom must correspond to one input term and have that term's exact association_rank. Favor stronger associations when plausible, but never turn a test or clinical finding into something the patient claims to feel. Use general medical knowledge only to make the fictional story coherent; do not add unranked symptoms, test results, or vital signs. If the disease label is broad or ambiguous, make a conservative presentation and avoid false precision.
Give the patient a consistent age, background, symptom onset, and progression. Use everyday patient language. Do not reveal the diagnosis in the chief complaint or opening line. Keep all fields concise. Use empty lists when medications, allergies, or history are unknown; do not fabricate clinical certainty. The result is a synthetic case for testing, not medical guidance."""

PERSONA_INSTRUCTION = """Write a fresh fictional patient identity and narrative for an existing medical education case.
Use the exact supplied name, age, and pronouns. Keep the cached symptoms, symptom onset and severity, medical history, medications, allergies, chief complaint, and clinical course consistent. Return only the requested narrative fields. Rewrite references to home life, work, travel, pets, or exposures coherently: if a cached clue depends on one of them, preserve that fact in the new person's background and follow-up details. Occupation may remain similar when the case requires it. Write the opening line in the patient's own voice and never reveal the diagnosis there. Do not add symptoms, test results, vital signs, or unsupported clinical facts. Keep the narrative concise. This is a synthetic case, not medical guidance."""


class CaseGenerator:
    def __init__(self, repo=None, client=None, cache_database=CACHE_DB):
        self.repo = repo or IllnessRepository()
        self.client = client
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self.cache_database = Path(cache_database)

    def _cache_connection(self):
        self.cache_database.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.cache_database, timeout=30)
        db.execute("""CREATE TABLE IF NOT EXISTS cases (
            disease_id INTEGER PRIMARY KEY,
            schema_version INTEGER NOT NULL,
            case_json TEXT NOT NULL
        )""")
        db.execute("""CREATE TABLE IF NOT EXISTS persona_state (
            disease_id INTEGER PRIMARY KEY,
            last_name TEXT NOT NULL,
            last_age INTEGER NOT NULL,
            last_pronouns TEXT NOT NULL
        )""")
        return db

    def _last_persona(self, disease_id):
        with closing(self._cache_connection()) as db:
            return db.execute(
                "SELECT last_name, last_age, last_pronouns FROM persona_state WHERE disease_id=?",
                (disease_id,),
            ).fetchone()

    def _remember_persona(self, disease_id, name, age, pronouns):
        with closing(self._cache_connection()) as db, db:
            db.execute("""INSERT INTO persona_state (disease_id, last_name, last_age, last_pronouns)
                VALUES (?, ?, ?, ?) ON CONFLICT(disease_id) DO UPDATE SET
                last_name=excluded.last_name, last_age=excluded.last_age,
                last_pronouns=excluded.last_pronouns""", (disease_id, name, age, pronouns))

    def _choose_identity(self, disease_id, base_patient):
        last = self._last_persona(disease_id)
        previous_pronouns = last[2] if last else base_patient["pronouns"]
        pronouns = secrets.choice([value for value in PERSONA_NAMES if value != previous_pronouns])
        previous_name = last[0] if last else base_patient["name"]
        names = [value for value in PERSONA_NAMES[pronouns] if value not in (previous_name, base_patient["name"])]
        name = secrets.choice(names)
        base_age = base_patient["age"]
        low = max(1 if base_age < 18 else 18, base_age - (3 if base_age < 18 else 12))
        high = min(17 if base_age < 18 else 100, base_age + (3 if base_age < 18 else 12))
        previous_age = last[1] if last else base_age
        ages = [age for age in range(low, high + 1) if age not in (previous_age, base_age)]
        age = secrets.choice(ages or [base_age])
        return name, age, pronouns

    def _client(self):
        if self.client is None:
            key = os.getenv("GEMINI_API_KEY")
            if not key:
                raise RuntimeError("Add GEMINI_API_KEY to .env and restart the server.")
            self.client = genai.Client(api_key=key)
        return self.client

    def _cached_case(self, disease_id):
        with closing(self._cache_connection()) as db:
            row = db.execute(
                "SELECT case_json FROM cases WHERE disease_id=? AND schema_version=?",
                (disease_id, SCHEMA_VERSION),
            ).fetchone()
        return json.loads(row[0]) if row else None

    def _save_case(self, disease_id, case):
        serialized = json.dumps(case, ensure_ascii=False)
        with closing(self._cache_connection()) as db, db:
            db.execute(
                """INSERT INTO cases (disease_id, schema_version, case_json) VALUES (?, ?, ?)
                ON CONFLICT(disease_id) DO UPDATE SET
                    schema_version=excluded.schema_version,
                    case_json=excluded.case_json
                WHERE cases.schema_version != excluded.schema_version""",
                (disease_id, SCHEMA_VERSION, serialized),
            )
            row = db.execute("SELECT case_json FROM cases WHERE disease_id=?", (disease_id,)).fetchone()
        return json.loads(row[0])

    def diseases(self):
        return [{"id": row["id"], "name": row["name"]} for row in self.repo.list_diseases()]

    def generate(self, disease_id):
        if type(disease_id) is not int:
            raise ValueError("Choose a disease from the list.")
        disease = self.repo.get_disease(disease_id)
        if disease is None:
            raise ValueError("Disease not found.")
        cached = self._cached_case(disease_id)
        if cached is not None:
            return cached
        ranked_terms = [
            {"rank": symptom["rank"], "name": symptom["name"]}
            for symptom in disease["symptoms"]
        ]
        prompt_data = {"disease": disease["name"], "ranked_associated_terms": ranked_terms}
        response = self._client().models.generate_content(
            model=self.model,
            contents=json.dumps(prompt_data, ensure_ascii=False),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=PatientProfile,
                temperature=0.6,
            ),
        )
        try:
            parsed = response.parsed
            patient = parsed if isinstance(parsed, PatientProfile) else PatientProfile.model_validate_json(response.text or "")
        except (ValidationError, ValueError) as exc:
            raise RuntimeError("Gemini returned an invalid patient profile. Please try again.") from exc
        if not patient.symptoms or not patient.opening_line.strip():
            raise RuntimeError("Gemini returned an incomplete patient profile. Please try again.")
        valid_ranks = {term["rank"] for term in ranked_terms}
        selected_ranks = [symptom.association_rank for symptom in patient.symptoms]
        if len(selected_ranks) != len(set(selected_ranks)) or not set(selected_ranks) <= valid_ranks:
            raise RuntimeError("Gemini selected invalid symptom ranks. Please try again.")

        case = {
            "schema_version": SCHEMA_VERSION,
            "case_id": disease["id"],
            "diagnosis": disease["name"],
            "patient": patient.model_dump(),
        }
        return self._save_case(disease_id, case)

    def generate_personalized(self, disease_id):
        """Reuse cached clinical clues with a fresh patient for each encounter."""
        base_case = self.generate(disease_id)
        base_patient = base_case["patient"]
        name, age, pronouns = self._choose_identity(disease_id, base_patient)
        prompt_data = {
            "diagnosis": base_case["diagnosis"],
            "new_identity": {"name": name, "age": age, "pronouns": pronouns},
            "fixed_clinical_facts": {
                key: base_patient[key] for key in (
                    "chief_complaint", "symptoms", "medical_history", "medications", "allergies"
                )
            },
            "cached_narrative": {
                key: base_patient[key] for key in (
                    "occupation", "background", "opening_line", "symptom_timeline",
                    "pertinent_negatives", "details_to_reveal_if_asked"
                )
            },
        }
        try:
            response = self._client().models.generate_content(
                model=self.model,
                contents=json.dumps(prompt_data, ensure_ascii=False),
                config=types.GenerateContentConfig(
                    system_instruction=PERSONA_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=PatientPersona,
                    temperature=0.8,
                ),
            )
            parsed = response.parsed
            persona = parsed if isinstance(parsed, PatientPersona) else PatientPersona.model_validate_json(response.text or "")
            if not all((persona.occupation.strip(), persona.background.strip(), persona.opening_line.strip(), persona.symptom_timeline.strip())):
                raise ValueError("Incomplete patient variation")
            updates = persona.model_dump()
        except Exception:
            logging.exception("Patient variation failed; using a local identity variation")
            pronouns = base_patient["pronouns"]
            fallback_names = PERSONA_NAMES.get(pronouns, PERSONA_NAMES["they/them"])
            previous_name = (self._last_persona(disease_id) or (None,))[0]
            name = secrets.choice([value for value in fallback_names if value not in (base_patient["name"], previous_name)])
            updates = {
                "occupation": base_patient["occupation"],
                "background": f"{base_patient['background']} In free time, enjoys {secrets.choice(PERSONA_HOBBIES)}.",
                "opening_line": base_patient["opening_line"],
                "symptom_timeline": base_patient["symptom_timeline"],
                "pertinent_negatives": base_patient["pertinent_negatives"],
                "details_to_reveal_if_asked": base_patient["details_to_reveal_if_asked"],
            }
        case = copy.deepcopy(base_case)
        case["patient"].update(updates)
        case["patient"].update({"name": name, "age": age, "pronouns": pronouns})
        self._remember_persona(disease_id, name, age, pronouns)
        return case


APP = CaseGenerator()
SIMULATIONS = SimulationRepository()


def disease_name(disease_id):
    if disease_id is None:
        return None
    disease = APP.repo.get_disease(disease_id)
    return disease["name"] if disease else None


class Handler(BaseHTTPRequestHandler):
    def _json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/":
            body = (ROOT / "static" / "index.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/api/diseases":
            self._json(200, {"diseases": APP.diseases()})
        else:
            self._json(404, {"error": "Not found."})

    def do_POST(self):
        simulation_paths = {
            "/api/simulations/start", "/api/simulations/list",
            "/api/simulations/get", "/api/simulations/complete",
            "/api/simulations/conversation",
        }
        if self.path != "/api/generate" and self.path not in simulation_paths:
            return self._json(404, {"error": "Not found."})
        try:
            if self.path in simulation_paths:
                expected = os.getenv("DX_BACKEND_TOKEN", "")
                supplied = self.headers.get("X-DX-Backend-Token", "")
                if not expected or not hmac.compare_digest(supplied, expected):
                    return self._json(401, {"error": "Unauthorized."})
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 8192:
                return self._json(400, {"error": "Invalid request size."})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError("Expected a JSON object.")
            if self.path == "/api/generate":
                result = APP.generate_personalized(data.get("disease_id"))
            else:
                user_id = data.get("user_id")
                if not isinstance(user_id, str) or not 1 <= len(user_id) <= 200:
                    raise ValueError("Invalid account.")
                if self.path == "/api/simulations/start":
                    case_id = secrets.choice(APP.diseases())["id"]
                    result = SIMULATIONS.create(user_id, APP.generate_personalized(case_id))
                elif self.path == "/api/simulations/list":
                    result = {"simulations": SIMULATIONS.list_for_user(user_id, disease_name)}
                else:
                    simulation_id = data.get("simulation_id")
                    if not isinstance(simulation_id, str) or len(simulation_id) != 32:
                        raise ValueError("Invalid simulation ID.")
                    if self.path == "/api/simulations/get":
                        result = SIMULATIONS.get_for_user(user_id, simulation_id, disease_name, APP.repo.get_disease)
                    elif self.path == "/api/simulations/conversation":
                        result = SIMULATIONS.get_patient_for_conversation(user_id, simulation_id)
                    else:
                        diagnosis_id = data.get("diagnosis_id")
                        if type(diagnosis_id) is not int or disease_name(diagnosis_id) is None:
                            raise ValueError("Choose a diagnosis from the list.")
                        result = SIMULATIONS.complete(user_id, simulation_id, diagnosis_id, disease_name, APP.repo.get_disease)
                    if result is None:
                        return self._json(404, {"error": "Simulation not found."})
            self._json(200, result)
        except (ValueError, TypeError) as exc:
            self._json(400, {"error": str(exc)})
        except RuntimeError as exc:
            self._json(503, {"error": str(exc)})
        except Exception:
            logging.exception("Gemini case generation failed")
            self._json(502, {"error": "Gemini request failed. Check the key, model, and server terminal."})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"DX case generator: http://127.0.0.1:{port}")
    server.serve_forever()
