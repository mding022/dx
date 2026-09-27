"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Disease } from "@/lib/backend";
import { searchDiseases } from "@/lib/disease-search";
import { DiagnosisIllustration } from "@/components/DiagnosisIllustration";

export function ConditionLibrary({ diseases }: { diseases: Disease[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDiseases(diseases, query), [diseases, query]);

  return <section className="panel library-panel">
    <div className="panel-heading"><div><span className="section-overline">EXPLORE</span><h2>Condition library</h2></div><span className="small-count">{diseases.length ? `${diseases.length} conditions` : "Unavailable"}</span></div>
    <label className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search conditions" aria-label="Search conditions" /></label>
    <div className="library-list">
      {results.length ? results.map(disease => <div className="library-row" key={disease.id}><DiagnosisIllustration diseaseId={disease.id} name={disease.name} className="diagnosis-art library-art" /><span>{disease.name}</span></div>) : <p className="muted-empty">{diseases.length ? "No matching conditions. Try another search." : "The library is temporarily unavailable."}</p>}
    </div>
    <p className="library-footnote">Simulations draw a random condition from this library.</p>
  </section>;
}
