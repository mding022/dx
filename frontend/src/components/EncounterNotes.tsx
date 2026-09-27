"use client";

import { useEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";

export function EncounterNotes({ simulationId }: { simulationId: string }) {
  const notes = useRef<HTMLTextAreaElement>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const storageKey = `dx-encounter-notes:${simulationId}`;
  useEffect(() => {
    try { if (notes.current) notes.current.value = sessionStorage.getItem(storageKey) ?? ""; }
    catch { /* Notes remain usable when browser storage is restricted. */ }
  }, [storageKey]);

  return <details className="panel encounter-notes" open>
    <summary><span><NotebookPen size={17} />Your clinical notes<span className="optional-label">Optional</span></span><span className="notes-chevron" aria-hidden="true" /></summary>
    <div className="notes-body"><label className="sr-only" htmlFor="encounter-notes">Clinical notes for this encounter</label><textarea id="encounter-notes" ref={notes} rows={3} placeholder="Capture key symptoms, the timeline, and diagnoses to consider…" onChange={event => {
      try { sessionStorage.setItem(storageKey, event.target.value); setStorageFailed(false); }
      catch { setStorageFailed(true); }
    }} /><p>{storageFailed ? "Browser storage is unavailable. Keep this page open to retain your notes." : "Saved in this tab. For your reasoning; not included in your assessment."}</p></div>
  </details>;
}
