"use client";

import { useEffect, useState } from "react";
import { AudioLines, Headphones, LoaderCircle, Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";

export type InterviewState = "ready" | "connecting" | "connected" | "ending" | "unavailable" | "error";

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
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (state !== "connected") return;
    const started = Date.now();
    const interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(interval);
  }, [state]);
  const connected = state === "connected";
  const busy = state === "connecting" || state === "ending";
  const description = {
    ready: "Start with an open question and let the patient tell their story.",
    connecting: "Setting up your audio. This may take a moment.",
    connected: isSpeaking ? `${patientName.split(" ")[0]} is speaking. Take a moment to listen.` : isMuted ? "Your microphone is muted. Unmute when you’re ready to speak." : "Your patient is listening. Ask your next question.",
    ending: "Wrapping up your conversation…",
    unavailable: "Voice is unavailable for this case. You can review the chart and record your assessment.",
    error: error || "We couldn’t connect. Check your microphone and try again.",
  }[state];
  const timer = `${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;

  return <section id="interview" className={`call-status call-status-${state}`} aria-label="Patient interview">
    <div className="call-heading"><span className="section-overline">01 / THE CONVERSATION</span><span className={`call-state-label ${connected ? "is-live" : ""}`}>{connected ? <><span className="live-dot" />Live<span className="call-timer">{timer}</span></> : busy ? "Please wait" : state === "unavailable" ? "Unavailable" : "Voice encounter"}</span></div>
    <div className="call-main"><span className={`call-orb ${connected && isSpeaking ? "speaking" : ""}`} aria-hidden="true">{busy ? <LoaderCircle size={28} className="spin" /> : connected ? <AudioLines size={30} /> : <Headphones size={30} strokeWidth={1.5} />}</span><div className="call-copy"><h2>{connected ? isSpeaking ? `${patientName.split(" ")[0]} is speaking` : isMuted ? "Microphone muted" : "The floor is yours" : busy ? state === "ending" ? "Ending your interview" : "Connecting you…" : `Meet ${patientName.split(" ")[0]}`}</h2><p role="status">{description}</p></div></div>
    {connected && error ? <p className="form-error" role="alert">{error}</p> : null}
    <div className="call-bottom">{connected ? <><span className={`call-wave ${isSpeaking ? "is-speaking" : ""}`} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} />)}</span><div className="call-controls"><button className={`call-mute ${isMuted ? "is-muted" : ""}`} type="button" onClick={onToggleMute} aria-pressed={isMuted} aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}>{isMuted ? <MicOff size={17} /> : <Mic size={17} />}<span>{isMuted ? "Unmute" : "Mute"}</span></button><button className="button call-end" type="button" onClick={onEnd}><PhoneOff size={16} />End interview</button></div></> : <><span className="call-hint"><Mic size={14} />{state === "unavailable" ? "You can continue below" : "Microphone access required"}</span><button className="button button-dark call-start" type="button" onClick={onStart} disabled={busy || state === "unavailable"}>{busy ? <LoaderCircle size={16} className="spin" /> : <PhoneCall size={16} />}{busy ? state === "ending" ? "Ending…" : "Connecting…" : state === "error" ? "Try again" : state === "unavailable" ? "Voice unavailable" : "Start interview"}</button></>}</div>
  </section>;
}
