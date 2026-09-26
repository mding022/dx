import { ArrowRight, BookOpenText, CircleCheck, Lightbulb, MessageCircleQuestion, ScanSearch } from "lucide-react";
import type { CaseReview, PatientIdentity, ReviewSymptom, Simulation } from "@/lib/backend";
import { PatientIllustration } from "@/components/PatientIllustration";
import { DiagnosisIllustration } from "@/components/DiagnosisIllustration";

type Result = NonNullable<Simulation["result"]>;

function SymptomList({ symptoms, empty }: { symptoms: ReviewSymptom[]; empty: string }) {
  if (!symptoms.length) return <p className="review-empty">{empty}</p>;
  return <div className="review-symptom-list">{symptoms.map((symptom, index) =>
    <div className="review-symptom" key={`${symptom.association_rank}-${index}`}>
      <span className="review-symptom-dot" /><div><strong>{symptom.name}</strong>
        {symptom.patient_description ? <p>“{symptom.patient_description}”</p> : null}
        {symptom.onset || symptom.severity ? <small>{[symptom.onset, symptom.severity].filter(Boolean).join(" · ")}</small> : null}
      </div>
    </div>,
  )}</div>;
}

function ReviewNotes({ review }: { review: CaseReview }) {
  return <div className="review-notes">
    {review.symptom_timeline ? <div className="review-note"><span className="review-note-icon"><ScanSearch size={18} /></span><div><strong>How the symptoms unfolded</strong><p>{review.symptom_timeline}</p></div></div> : null}
    {review.details_to_reveal_if_asked.length ? <div className="review-note"><span className="review-note-icon"><MessageCircleQuestion size={18} /></span><div><strong>Details available if you asked</strong><ul>{review.details_to_reveal_if_asked.map((detail, index) => <li key={index}>{detail}</li>)}</ul></div></div> : null}
    {review.pertinent_negatives.length ? <div className="review-note"><span className="review-note-icon"><CircleCheck size={18} /></span><div><strong>Things the patient denied</strong><ul>{review.pertinent_negatives.map((detail, index) => <li key={index}>{detail}</li>)}</ul></div></div> : null}
  </div>;
}

export function ReviewCard({ result, patient }: { result: Result; patient: PatientIdentity }) {
  const review = result.review;
  const caseSymptoms = [...(review?.shared_symptoms ?? []), ...(review?.not_linked_to_selected_diagnosis ?? [])]
    .sort((a, b) => a.association_rank - b.association_rank);

  return <section className="panel review-panel" aria-labelledby="review-title">
    <div className="review-patient"><span className="review-patient-avatar"><PatientIllustration className="review-patient-portrait" pronouns={patient.pronouns} /></span><div className="review-patient-copy"><strong>{patient.name}</strong><span>{patient.age} years old · {patient.pronouns} · {patient.occupation}</span><p>{patient.background}</p></div><span className="status-pill complete">Completed</span></div>
    <div className="review-heading"><div><span className="review-kicker"><BookOpenText size={17} /> CASE DEBRIEF</span><h2 id="review-title">Look closer at the clues<span className="heading-period">.</span></h2><p>Compare your choice with the case diagnosis and revisit what this patient described.</p></div><span className="review-heading-icon"><Lightbulb size={28} /></span></div>
    <div className="review-diagnosis-row"><div className="review-diagnosis-item"><DiagnosisIllustration diseaseId={result.submitted_diagnosis_id} name={result.submitted_diagnosis} className="diagnosis-art review-diagnosis-art" /><div className="review-diagnosis-copy"><span>YOUR DIAGNOSIS</span><strong>{result.submitted_diagnosis}</strong></div></div><ArrowRight size={21} /><div className="review-diagnosis-item review-actual"><DiagnosisIllustration diseaseId={result.diagnosis_id} name={result.diagnosis} className="diagnosis-art review-diagnosis-art" /><div className="review-diagnosis-copy"><span>CASE DIAGNOSIS</span><strong>{result.diagnosis}</strong></div></div></div>
    {review ? <><div className="review-evidence-grid">
      <div className="review-evidence shared"><div className="review-evidence-head"><span className="review-evidence-icon"><CircleCheck size={18} /></span><div><h3>{result.correct ? "Symptoms in this case" : "Clues that overlap"}</h3><p>{result.correct ? "The patient symptoms selected for this case." : "Patient symptoms also linked to your chosen condition."}</p></div></div><SymptomList symptoms={result.correct ? caseSymptoms : review.shared_symptoms} empty="No selected case symptoms were linked to your chosen condition in the source dataset." /></div>
      <div className="review-evidence contrast"><div className="review-evidence-head"><span className="review-evidence-icon"><ScanSearch size={18} /></span><div><h3>{result.correct ? "Why this fits" : "Clues to reconsider"}</h3><p>{result.correct ? "Your diagnosis matches the case's source condition." : "Patient symptoms linked to the case diagnosis but not your choice in the source dataset."}</p></div></div>{result.correct ? <p className="review-empty">You chose the case diagnosis. Revisit the symptom timeline and the additional details below to see how the story came together.</p> : <SymptomList symptoms={review.not_linked_to_selected_diagnosis} empty="All selected patient symptoms were linked to both conditions in the source dataset. The case may need other information to distinguish them." />}</div>
    </div>
    <ReviewNotes review={review} />
    <p className="review-source-note">This comparison uses the selected case symptoms and linked terms in a historical source dataset. A missing link does not rule out a condition clinically.</p></> : <p className="review-empty">The diagnosis is saved, but the detailed case comparison is unavailable right now.</p>}
  </section>;
}
