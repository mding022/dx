"use client";

import { useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type { ConversationPatient } from "@/lib/backend";
import { CallStatus } from "@/components/CallStatus";
import { patientVoiceId } from "@/lib/patient-voice";

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
    onError: (message, context) => {
      setStarting(false);
      console.error("ElevenLabs interview connection failed", message, context);
      const detail = context instanceof Error ? context.message : message;
      setError(/voice|override|forbidden|403/i.test(detail)
        ? "The selected voice was rejected. Enable Voice ID overrides for this agent in ElevenLabs Security settings and check that the voice is available."
        : /microphone|permission|media device|notallowed/i.test(detail)
          ? "Microphone access was blocked. Allow microphone access for this site and try again."
          : `ElevenLabs could not connect: ${detail}. Check the agent's Voice ID override setting and try again.`);
    },
  });
  const configured = Boolean(agentId && patient);

  function start() {
    if (!configured || !patient || starting || (conversation.status !== "disconnected" && conversation.status !== "error")) return;
    setStarting(true);
    setError("");
    try {
      conversation.startSession({
        agentId,
        connectionType: "websocket",
        dynamicVariables: {
          patient_json: JSON.stringify(patient),
          opening_line: patient.opening_line,
        },
        overrides: { tts: { voiceId: patientVoiceId(patient) } },
      });
    } catch (cause) {
      setStarting(false);
      setError(cause instanceof Error ? cause.message : "The call could not start. Please try again.");
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
