"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, Search } from "lucide-react";
import type { Disease } from "@/lib/backend";
import { searchDiseases } from "@/lib/disease-search";

export function DiagnosisForm({ diseases, simulationId }: { diseases: Disease[]; simulationId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Disease | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const results = useMemo(() => searchDiseases(diseases, query, 8), [diseases, query]);

  function choose(disease: Disease) {
    setSelected(disease);
    setQuery(disease.name);
    setOpen(false);
    setError("");
  }

  async function submit() {
    if (!selected || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/simulations/${simulationId}/diagnose`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis_id: selected.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit your diagnosis.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit your diagnosis.");
      setPending(false);
    }
  }

  return <div className="diagnosis-form">
    <label htmlFor="diagnosis-search" className="field-label">Your diagnosis</label>
    <div className="combobox-wrap">
      <div className={`diagnosis-input ${open ? "focused" : ""}`}><Search size={19} /><input
        id="diagnosis-search" role="combobox" aria-expanded={open} aria-controls="diagnosis-options" aria-autocomplete="list"
        placeholder="Type to search the condition library" value={query} autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setSelected(null); setActiveIndex(0); setOpen(true); }}
        onKeyDown={event => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => results.length ? Math.min(index + 1, results.length - 1) : 0); setOpen(true); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
          if (event.key === "Enter" && open && results[activeIndex]) { event.preventDefault(); choose(results[activeIndex]); }
          if (event.key === "Escape") setOpen(false);
        }}
      />{selected ? <Check size={18} className="selected-check" /> : null}</div>
      {open ? <div className="diagnosis-options" id="diagnosis-options" role="listbox">
        {results.length ? results.map((disease, index) => <button type="button" role="option" aria-selected={index === activeIndex} className={index === activeIndex ? "option-active" : ""} key={disease.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(disease)}>{disease.name}</button>) : <div className="no-options">No matching condition</div>}
      </div> : null}
    </div>
    <p className="field-hint">Choose one diagnosis from the database to complete this case.</p>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="button button-dark submit-diagnosis" type="button" disabled={!selected || pending} onClick={submit}>
      {pending ? <LoaderCircle size={18} className="spin" /> : null}{pending ? "Submitting…" : "Submit diagnosis"}{!pending ? <ArrowRight size={18} /> : null}
    </button>
  </div>;
}
