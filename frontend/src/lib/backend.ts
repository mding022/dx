export type Disease = { id: number; name: string };

export type PatientIdentity = {
  name: string;
  age: number;
  pronouns: string;
  occupation: string;
  background: string;
  medical_history: string[];
  medications: string[];
  allergies: string[];
};

export type ReviewSymptom = {
  name: string;
  patient_description: string;
  onset: string;
  severity: string;
  association_rank: number;
};

export type CaseReview = {
  shared_symptoms: ReviewSymptom[];
  not_linked_to_selected_diagnosis: ReviewSymptom[];
  symptom_timeline: string;
  details_to_reveal_if_asked: string[];
  pertinent_negatives: string[];
};

export type Simulation = {
  id: string;
  status: "awaiting_diagnosis" | "completed";
  created_at: string;
  completed_at: string | null;
  patient: PatientIdentity;
  result?: {
    diagnosis: string;
    diagnosis_id: number;
    submitted_diagnosis: string;
    submitted_diagnosis_id: number;
    correct: boolean;
    review?: CaseReview;
  };
};

export type GeneratedCase = {
  schema_version: number;
  case_id: number;
  diagnosis: string;
  patient: PatientIdentity & {
    chief_complaint: string;
    opening_line: string;
    symptom_timeline: string;
    symptoms: Array<{
      association_rank: number;
      name: string;
      patient_description: string;
      onset: string;
      severity: string;
    }>;
    pertinent_negatives: string[];
    details_to_reveal_if_asked: string[];
  };
};

export type LearningInsights = {
  unlocked: boolean;
  completed_cases: number;
  required_cases: number;
  correct_cases?: number;
  incorrect_cases?: number;
  top_confusions?: Array<{
    actual_diagnosis: string;
    actual_diagnosis_id: number;
    chosen_diagnosis: string;
    chosen_diagnosis_id: number;
    count: number;
    example_simulation_id: string;
    clues: string[];
  }>;
  clues_to_revisit?: Array<{
    symptom_id: number;
    name: string;
    count: number;
    associated_diseases: string[];
  }>;
};

export type ConversationPatient = Omit<GeneratedCase["patient"], "symptoms"> & {
  symptoms: Array<Omit<GeneratedCase["patient"]["symptoms"][number], "association_rank">>;
};

export class BackendError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const backendUrl = () => process.env.DX_BACKEND_URL ?? "https://dx-six-ivory.vercel.app";

export async function backendPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = process.env.DX_BACKEND_TOKEN;
  if (!token) throw new BackendError("Backend token is not configured.", 503);
  const response = await fetch(`${backendUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-DX-Backend-Token": token },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new BackendError(data.error ?? "Backend request failed.", response.status);
  return data as T;
}

export async function getDiseases(): Promise<Disease[]> {
  const response = await fetch(`${backendUrl()}/api/diseases`, { cache: "no-store" });
  if (!response.ok) throw new BackendError("Could not load diseases.", response.status);
  const data = await response.json();
  return data.diseases as Disease[];
}

export async function listSimulations(userId: string): Promise<Simulation[]> {
  const data = await backendPost<{ simulations: Simulation[] }>("/api/simulations/list", { user_id: userId });
  return data.simulations;
}

export async function getLearningInsights(userId: string): Promise<LearningInsights> {
  return backendPost<LearningInsights>("/api/simulations/insights", { user_id: userId });
}

export async function getSimulation(userId: string, id: string): Promise<Simulation> {
  return backendPost<Simulation>("/api/simulations/get", { user_id: userId, simulation_id: id });
}

export async function getConversationPatient(userId: string, id: string): Promise<ConversationPatient> {
  const data = await backendPost<{ patient: ConversationPatient }>("/api/simulations/conversation", {
    user_id: userId, simulation_id: id,
  });
  return data.patient;
}
