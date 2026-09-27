# Dx

**A simulated patient diagnosis platform for medical students.**

Dx gives students a place to practice patient conversations, make a diagnosis, and learn from the clues they gathered. Each case pairs a fictional patient with structured disease and symptom data, then turns the encounter into a practical review of clinical reasoning.

## At a glance

1. **Meet a patient.** Start a simulation with a fictional patient profile and a hidden diagnosis.
2. **Have a conversation.** Ask questions and listen to the patient through an ElevenLabs conversational agent.
3. **Make a diagnosis.** Search the condition library and submit your assessment.
4. **Review the case.** Compare your answer with the case diagnosis and see which symptoms overlapped or pointed elsewhere.
5. **Spot patterns.** After five completed cases, Learning Insights highlights recurring diagnosis mix-ups and symptoms to revisit.

## Inspiration

We built Dx to give medical students a place to practice the human side of diagnosis: speaking with patients, understanding their stories, and connecting the details. A simulation lets students work through those conversations without real-world consequences for a patient.

## What it does

Dx lets students speak with a simulated AI patient, gather clues, and submit a diagnosis. Afterward, they can see which symptoms supported their answer, which clues were linked to a different condition, and what they could review before the next case.

The Learning Insights page looks across completed simulations to show conditions a student has confused and symptoms that appeared in those cases. It becomes available after five completed assessments, when there is enough case history to make the review useful.

## How we built it

| Part | Technology | Role |
| --- | --- | --- |
| Frontend | Next.js | Dashboard, patient encounters, case reviews, and learning insights |
| Accounts | Auth0 | Sign-in and account-specific simulation history |
| Patient conversations | ElevenLabs Conversational AI | Voice interaction with the simulated patient |
| Case generation | Gemini | Turns ranked disease and symptom associations into structured fictional patient cases |
| Backend | Python | Case generation, simulation history, diagnosis reviews, and learning insights |
| Persistent storage | Turso | Stores generated cases and simulation history across serverless runs |

The disease associations come from the public [Disease-Symptom Knowledge Database](https://impact.dbmi.columbia.edu/~friedma/Projects/DiseaseSymptomKB/index.html) from Columbia University Biomedical Informatics. The source ranks associations; those ranks are **not** symptom probabilities. Dx uses the data to build educational cases and compare the clues selected for each encounter.

## Challenges we ran into

- **Making patients feel distinct.** We wanted the same condition to appear with different identities and backgrounds while keeping its clinical clues consistent.
- **Protecting the reveal.** The patient conversation needed to feel natural without exposing the diagnosis before the student submitted an answer.
- **Connecting voice to a specific case.** Each ElevenLabs conversation needed the right patient context and opening line.
- **Keeping history reliable.** Local SQLite data disappeared when the Vercel backend ran on temporary serverless storage, so we moved persistent data to Turso.
- **Working with the source data.** Parsing the public dataset and preserving its original association order took more care than we expected.

## Accomplishments that we're proud of

Students can sign in, meet a patient, have a conversation, make a diagnosis, and receive feedback in one flow. The same disease can return with a new patient identity, so repeated practice does not feel identical. We are also proud of the interface, which makes the experience approachable while keeping the learning review useful, and of getting ElevenLabs conversational agents working with individual cases.

## What we learned

A useful simulation needs more than a correct answer. The patient has to respond naturally, and the review has to help students understand why they made their choice. We also learned how important persistent storage is when an app runs on serverless infrastructure.

## What's next for Dx - Simulated Patient Diagnosis Platform

We want to improve voice reliability, offer deeper feedback, and help students track how their clinical reasoning develops over time. We also want to explore richer medical datasets and responsibly sourced public patient narratives to make future cases more varied and realistic.

## Run locally

The repository has a Python backend at the root and a Next.js app in `frontend/`. The source disease database is included in `data/`.

**Backend**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Set `GEMINI_API_KEY` and `DX_BACKEND_TOKEN` in the root `.env`. For local development, Turso credentials can be left blank; the backend will use local SQLite. The backend runs at `http://127.0.0.1:8000` by default.

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

In `frontend/.env.local`, set your Auth0 credentials, `ELEVENLABS_AGENT_ID`, `DX_BACKEND_URL=http://127.0.0.1:8000`, and the same `DX_BACKEND_TOKEN` used by the backend. Open `http://localhost:3000` to use the app.
