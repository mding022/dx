import { PhoneCall } from "lucide-react";

export type InterviewState = "loading" | "ready" | "unavailable" | "error";

export function CallStatus({ patientName, state }: { patientName: string; state: InterviewState }) {
  const description = {
    loading: "Preparing your patient interview…",
    ready: "Open the voice widget to interview your patient. End the call before submitting your assessment.",
    unavailable: "The patient interview is unavailable. You can still review the profile and submit your assessment.",
    error: "The voice widget could not load. Refresh the page to try again.",
  }[state];

  return <section className="call-status" aria-label="Simulation call status">
    <span className="call-icon"><PhoneCall size={22} /></span>
    <div className="call-copy"><span className="call-eyebrow">PATIENT INTERVIEW</span><strong>Talk with {patientName}</strong><p role="status">{description}</p></div>
  </section>;
}
