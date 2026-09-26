import type { PatientIdentity } from "@/lib/backend";

const VOICE_MAP = {
  male: {
    young: "eadgjmk4R4uojdsheG9t",
    middle: "fPIfC3elMLbN9tNwMXkw",
    old: "M5E055lOUxMi0kJpGyE9",
  },
  female: {
    young: "hO2yZ8lxM3axUxL8OeKX",
    middle: "XEoBW4iDmiawQP72xnAF",
    old: "vFLqXa8bgbofGarf6fZh",
  },
} as const;

const NEUTRAL_VOICE_ID = "HgBYFjTEiFvl1rnxVvgz";
const DEFAULT_VOICE_ID = "eadgjmk4R4uojdsheG9t";

export function patientVoiceId(patient: Pick<PatientIdentity, "age" | "pronouns">): string {
  const pronouns = patient.pronouns.trim().toLowerCase();
  if (pronouns === "they/them") return NEUTRAL_VOICE_ID;

  const gender = pronouns === "he/him" ? "male" : pronouns === "she/her" ? "female" : null;
  if (!gender || !Number.isFinite(patient.age)) return DEFAULT_VOICE_ID;

  const ageGroup = patient.age < 40 ? "young" : patient.age < 65 ? "middle" : "old";
  return VOICE_MAP[gender][ageGroup];
}
