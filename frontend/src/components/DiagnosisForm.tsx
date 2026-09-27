"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import type { Disease } from "@/lib/backend";
import { searchDiseases } from "@/lib/disease-search";
import { DiagnosisIllustration } from "@/components/DiagnosisIllustration";

type Props = { diseases: Disease[]; simulationId: string; onBeforeSubmit?: () => Promise<void>; callActive?: boolean; disabled?: boolean };

export function DiagnosisForm({ diseases, simulationId, onBeforeSubmit, callActive = false, disabled = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Disease | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchDiseases(diseases, query, 8), [diseases, query]);
  const activeOption = results[activeIndex];

  useEffect(() => {
    if (open && activeOption) document.getElementById(`diagnosis-option-${activeOption.id}`)?.scrollIntoView({ block: "nearest" });
  }, [activeOption, open]);

  function choose(disease: Disease) {
    setSelected(disease);
    setQuery(disease.name);
    setOpen(false);
    setError("");
    input.current?.focus();
  }

  async function submit() {
    if (!selected || pending || disabled) return;
    setPending(true);
    setOpen(false);
    setError("");
    try {
      await onBeforeSubmit?.();
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

  return <form className="diagnosis-form" onSubmit={event => { event.preventDefault(); void submit(); }} aria-busy={pending}>
    <label htmlFor="diagnosis-search" className="field-label">Working diagnosis</label>
    <div className="combobox-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <div className={`diagnosis-input ${open ? "focused" : ""} ${selected ? "has-selection" : ""}`}><Search size={18} /><input
        ref={input} id="diagnosis-search" role="combobox" aria-expanded={open} aria-controls={open ? "diagnosis-options" : undefined} aria-autocomplete="list" aria-activedescendant={open && activeOption ? `diagnosis-option-${activeOption.id}` : undefined} aria-describedby="diagnosis-hint"
        placeholder={diseases.length ? "Search the condition library…" : "Condition library unavailable"} value={query} autoComplete="off" disabled={pending || !diseases.length}
        onFocus={() => { if (!selected) setOpen(true); }}
        onChange={event => { setQuery(event.target.value); setSelected(null); setActiveIndex(0); setOpen(true); }}
        onKeyDown={event => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => open && results.length ? Math.min(index + 1, results.length - 1) : 0); setOpen(true); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); setOpen(true); }
          if (event.key === "Enter" && open) { event.preventDefault(); if (activeOption) choose(activeOption); }
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
        }}
      />{query ? <button className="input-clear" type="button" disabled={pending} aria-label="Clear diagnosis" onClick={() => { setSelected(null); setQuery(""); setActiveIndex(0); setOpen(true); input.current?.focus(); }}><X size={16} /></button> : <ChevronDown size={16} />}</div>
      {open ? <div className="diagnosis-dropdown"><span className="diagnosis-dropdown-label">{query ? "MATCHING CONDITIONS" : "BROWSE THE LIBRARY"}</span><div className="diagnosis-options" id="diagnosis-options" role="listbox" aria-label="Conditions">
        {results.length ? results.map((disease, index) => <button id={`diagnosis-option-${disease.id}`} type="button" tabIndex={-1} role="option" aria-selected={index === activeIndex} className={index === activeIndex ? "option-active" : ""} key={disease.id} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(disease)}><DiagnosisIllustration diseaseId={disease.id} name={disease.name} className="diagnosis-art diagnosis-option-art" decorative /><span>{disease.name}</span>{index === activeIndex ? <ArrowRight size={14} /> : null}</button>) : <div className="no-options">No conditions found. Try another spelling.</div>}
      </div></div> : null}
    </div>
    <p className="field-hint" id="diagnosis-hint">{diseases.length ? "Select one condition. You can change it before submitting." : "Refresh this page to try loading the library again."}</p>
    {selected ? <div className="diagnosis-selection"><span className="diagnosis-selection-check"><Check size={15} /></span><span><small>YOUR SELECTED DIAGNOSIS</small><strong>{selected.name}</strong></span><DiagnosisIllustration diseaseId={selected.id} name={selected.name} className="diagnosis-art diagnosis-selected-art" decorative /></div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="button button-dark submit-diagnosis" type="submit" disabled={!selected || pending || disabled}>{pending ? <LoaderCircle size={18} className="spin" /> : null}{pending ? "Preparing your review…" : "Submit & review case"}{!pending ? <ArrowRight size={17} /> : null}</button>
    <p className="submission-note">{callActive ? "Submitting will end your interview and open your case review." : "Your diagnosis is final once submitted. Take your time."}</p>
  </form>;
}
