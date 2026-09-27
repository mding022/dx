"use client";

import { useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Stethoscope } from "lucide-react";
import type { ConversationPatient, Disease } from "@/lib/backend";
import { CallStatus } from "@/components/CallStatus";
import { DiagnosisForm } from "@/components/DiagnosisForm";
import { EncounterNotes } from "@/components/EncounterNotes";
import { patientVoiceId } from "@/lib/patient-voice";

type Props = {
  agentId: string;
  patientName: string;
  patient: ConversationPatient | null;
  simulationId: string;
  diseases: Disease[];
  children: React.ReactNode;
};

function InterviewWorkspace({ agentId, patientName, patient, simulationId, diseases, children }: Props) {
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const activeCall = useRef<{ endSession: () => Promise<void> } | null>(null);
  const conversation = useConversation({
    onConversationCreated: call => { activeCall.current = call; },
    onConnect: () => { setStarting(false); setError(""); },
    onDisconnect: () => { activeCall.current = null; setStarting(false); setEnding(false); },
    onError: (message, context) => {
      setStarting(false);
      setEnding(false);
      console.error("Patient interview connection failed", message, context);
      const detail = context instanceof Error ? context.message : message;
      setError(/microphone|permission|media device|notallowed/i.test(detail)
        ? "Microphone access was blocked. Allow microphone access for this site and try again."
        : "The interview couldn’t connect. Please try again in a moment.");
    },
  });
  const configured = Boolean(agentId && patient);

  function start() {
    if (!configured || !patient || starting || ending || (conversation.status !== "disconnected" && conversation.status !== "error")) return;
    setStarting(true);
    setError("");
    try {
      conversation.startSession({
        agentId,
        connectionType: "websocket",
        dynamicVariables: { patient_json: JSON.stringify(patient), opening_line: patient.opening_line },
        overrides: { tts: { voiceId: patientVoiceId(patient) } },
      });
    } catch (cause) {
      setStarting(false);
      console.error("Interview start failed", cause);
      setError(cause instanceof Error && /permission|microphone|notallowed/i.test(cause.message)
        ? "Allow microphone access in your browser, then try again."
        : "The interview couldn’t start. Check your connection and try again.");
    }
  }

  async function end() {
    if (!activeCall.current) return;
    setEnding(true);
    try { await activeCall.current.endSession(); }
    catch (cause) { setError("The call couldn’t end. Please try again."); throw cause; }
    finally { setEnding(false); }
  }

  const state = !configured ? "unavailable" : ending ? "ending" : starting || conversation.status === "connecting" ? "connecting" : conversation.status === "connected" ? "connected" : error || conversation.status === "error" ? "error" : "ready";

  return <><nav className="encounter-jump-links" aria-label="Jump to encounter section"><a href="#patient-chart">Patient chart</a><a href="#interview">Interview</a><a href="#assessment">Your diagnosis</a></nav><div className="evaluation-grid"><aside className="evaluation-chart">{children}</aside><div className="evaluation-workspace">
    <CallStatus key={state === "connected" ? "live" : "idle"} patientName={patientName} state={state} isSpeaking={conversation.isSpeaking} isMuted={conversation.isMuted} error={error} onStart={start} onEnd={() => { void end().catch(() => {}); }} onToggleMute={() => conversation.setMuted(!conversation.isMuted)} />
    <EncounterNotes simulationId={simulationId} />
    <section className="panel assessment-panel" id="assessment" aria-labelledby="assessment-title"><div className="assessment-heading"><span className="section-overline">02 / YOUR ASSESSMENT</span><Stethoscope size={20} strokeWidth={1.5} /></div><h2 id="assessment-title">Bring the clues together.</h2><p className="assessment-intro">Choose the diagnosis that best explains this patient’s story. Your case review will follow.</p><DiagnosisForm diseases={diseases} simulationId={simulationId} onBeforeSubmit={end} callActive={conversation.status === "connected"} disabled={starting || ending || conversation.status === "connecting"} /></section>
  </div></div></>;
}

export function PatientConversationWidget(props: Props) {
  return <ConversationProvider><InterviewWorkspace {...props} /></ConversationProvider>;
}
