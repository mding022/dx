import { LoaderCircle, Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";

export type InterviewState = "ready" | "connecting" | "connected" | "unavailable" | "error";

type Props = {
  patientName: string;
  state: InterviewState;
  isSpeaking: boolean;
  isMuted: boolean;
  error: string;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
};

export function CallStatus({ patientName, state, isSpeaking, isMuted, error, onStart, onEnd, onToggleMute }: Props) {
  const description = {
    ready: "Start the interview when you're ready. Your browser will ask for microphone access.",
    connecting: "Connecting to your patient…",
    connected: isSpeaking ? `${patientName.split(" ")[0]} is speaking…` : "Call connected. Ask the patient about their symptoms.",
    unavailable: "The patient interview is unavailable. You can still submit your assessment.",
    error: error || "The call could not connect. Please try again.",
  }[state];

  return <section className={`call-status call-status-${state}`} aria-label="Patient interview">
    <span className="call-icon"><PhoneCall size={22} /></span>
    <div className="call-copy"><span className="call-eyebrow">{state === "connected" ? <span className="live-dot" /> : null} PATIENT INTERVIEW</span><strong>Talk with {patientName}</strong><p role="status">{description}</p></div>
    {state === "connected" ? <div className="call-controls"><span className="call-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span><button className="call-mute" type="button" onClick={onToggleMute} aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}>{isMuted ? <MicOff size={17} /> : <Mic size={17} />}</button><button className="button call-end" type="button" onClick={onEnd}><PhoneOff size={17} /> End call</button></div> : <button className="button button-dark call-start" type="button" onClick={onStart} disabled={state === "connecting" || state === "unavailable"}>{state === "connecting" ? <LoaderCircle size={17} className="spin" /> : <PhoneCall size={17} />}{state === "connecting" ? "Connecting…" : state === "error" ? "Try again" : state === "unavailable" ? "Interview unavailable" : "Start patient interview"}</button>}
  </section>;
}
