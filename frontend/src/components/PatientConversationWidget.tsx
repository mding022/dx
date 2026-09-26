"use client";

import Script from "next/script";
import { createElement, useState } from "react";
import type { ConversationPatient } from "@/lib/backend";
import { CallStatus } from "@/components/CallStatus";

type Props = {
  agentId: string;
  patientName: string;
  patient: ConversationPatient | null;
};

export function PatientConversationWidget({ agentId, patientName, patient }: Props) {
  const [scriptState, setScriptState] = useState<"loading" | "ready" | "error">("loading");
  const configured = Boolean(agentId && patient);

  return <>
    <CallStatus patientName={patientName} state={configured ? scriptState : "unavailable"} />
    {configured && patient ? <>
      {/* Supply the saved patient's variables before the custom element starts a call. */}
      {createElement("elevenlabs-convai", {
        "agent-id": agentId,
        "dynamic-variables": JSON.stringify({
          patient_json: JSON.stringify(patient),
          opening_line: patient.opening_line,
        }),
        "action-text": `Interview ${patientName.split(" ")[0]}`,
        "start-call-text": "Start patient interview",
        "end-call-text": "End interview",
        "avatar-orb-color-1": "#446c57",
        "avatar-orb-color-2": "#d5ef97",
      })}
      <Script
        id="elevenlabs-patient-widget"
        src="https://unpkg.com/@elevenlabs/convai-widget-embed@0.16.0"
        strategy="afterInteractive"
        onReady={() => setScriptState("ready")}
        onError={() => setScriptState("error")}
      />
    </> : null}
  </>;
}
