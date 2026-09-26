"use client";

import { useMemo, useState } from "react";
import { Search, Stethoscope } from "lucide-react";
import type { Disease } from "@/lib/backend";
import { searchDiseases } from "@/lib/disease-search";

export function ConditionLibrary({ diseases }: { diseases: Disease[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDiseases(diseases, query), [diseases, query]);

  return <section className="panel library-panel">
    <div className="panel-heading"><div><span className="section-overline">EXPLORE</span><h2>Condition library</h2></div><span className="small-count">{diseases.length} conditions</span></div>
    <label className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search conditions" aria-label="Search conditions" /></label>
    <div className="library-list">
      {results.length ? results.map(disease => <div className="library-row" key={disease.id}><span className="library-icon"><Stethoscope size={17} /></span><span>{disease.name}</span></div>) : <p className="muted-empty">No matching conditions.</p>}
    </div>
    <p className="library-footnote">Simulations draw a random condition from this library.</p>
  </section>;
}
