Inspiration
We built Dx to give medical students a place to practice the conversation of speaking, understanding, and connecting with real patients, without the risk of misdiagnosis or real-world consequences.

What it does
Dx lets anyone speak with a simulated AI patient, gather clues, and submit a diagnosis. Afterward, they see which symptoms supported their answer, which clues pointed elsewhere, and what they can learn from the case.

How we built it
We built the interface with Next.js and use Auth0 for user accounts. ElevenLabs handles the patient conversation. Gemini turns ranked disease and symptom data from Columbia University Biomedical Informatics into structured patient cases which can be used to generate patient profiles. Our Python backend manages the cases, simulation history, and reports of what could be improved on by the user in the case of incorrect diagnosis.

flowchart TD
    U["You"] --> W["Website<br/>Next.js + React + TypeScript"]
    W <-->|Sign in| A["Auth0"]
    W -->|Start simulation| B["Python backend"]

    D["SQLite<br/>Diseases + symptoms + cached cases"] <--> B
    B <-->|Generate or personalize patient| G["Gemini"]
    B -->|Save encounter| S["SQLite<br/>Simulation history"]

    B -->|Patient JSON| W
    W -->|Start call with patient_json| E["ElevenLabs<br/>Reusable patient agent"]
    U <-->|Speak and hear responses| E

Challenges we ran into
We wanted patients to feel like different people while keeping the clinical clues consistent. We also had to keep the diagnosis hidden during the conversation, connect the voice experience to each case, and solve disappearing history caused by temporary server less functions on Vercel, which we achieved by using a more durable database for our backend. We also initially ran into trouble parsing the public datasets provided by the CU Biomedical Informatics Department.

Accomplishments that we're proud of
Students can sign in, meet a patient, have a conversation, make a diagnosis, and get useful feedback. A disease can appear with a new patient identity, so practicing the same case does not feel identical every time. We are really proud of the unique experience we created, a UI/UX design that combines education and fun, and learning & implementing ElevenLab's conversational AI agents.

What we learned
A useful simulation needs more than a correct answer. The patient has to respond naturally, and the review has to help students understand their reasoning. We also learned how much persistent storage matters when an app runs on server-less infrastructure.

What's next for Dx - Simulated Patient Diagnosis Platform
We want to improve voice reliability, add deeper feedback, and help students see how their clinical reasoning develops across cases. Additionally, a more complex data set for medical data, as well as utilizing real-world scraped public patient data would create a much more production-ready experience.

Built With
elevenlabs, gemini, nextjs, python, react, sqlite, turso, vercel

Try it out
www.dxmedical.us
