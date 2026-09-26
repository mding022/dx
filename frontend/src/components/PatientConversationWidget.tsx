"use client";

import { useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type { ConversationPatient } from "@/lib/backend";
import { CallStatus } from "@/components/CallStatus";

type Props = {
  agentId: string;
  patientName: string;
  patient: ConversationPatient | null;
};

function InterviewControls({ agentId, patientName, patient }: Props) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const conversation = useConversation({
    onConnect: () => { setStarting(false); setError(""); },
    onDisconnect: () => setStarting(false),
    onError: () => {
      setStarting(false);
      setError("The call could not connect. Check microphone access and try again.");
    },
  });
  const configured = Boolean(agentId && patient);

  async function start() {
    if (!configured || !patient || starting || (conversation.status !== "disconnected" && conversation.status !== "error")) return;
    setStarting(true);
    setError("");
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone.getTracks().forEach(track => track.stop());
      conversation.startSession({
        agentId,
        dynamicVariables: {
          patient_json: JSON.stringify(patient),
          opening_line: patient.opening_line,
        },
      });
    } catch {
      setStarting(false);
      setError("Microphone access is needed to interview this patient. Allow access and try again.");
    }
  }

  return <CallStatus
    patientName={patientName}
    state={!configured ? "unavailable" : error || conversation.status === "error" ? "error" : starting || conversation.status === "connecting" ? "connecting" : conversation.status === "connected" ? "connected" : "ready"}
    isSpeaking={conversation.isSpeaking}
    isMuted={conversation.isMuted}
    error={error}
    onStart={start}
    onEnd={() => conversation.endSession()}
    onToggleMute={() => conversation.setMuted(!conversation.isMuted)}
  />;
}

export function PatientConversationWidget(props: Props) {
  return <ConversationProvider><InterviewControls {...props} /></ConversationProvider>;
}
