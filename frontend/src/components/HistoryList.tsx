"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { Simulation } from "@/lib/backend";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function HistoryList({ simulations }: { simulations: Simulation[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => simulations.filter(item =>
    `${item.patient.name} ${item.result?.diagnosis ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ), [query, simulations]);

  return <div className="panel history-panel">
    <div className="history-toolbar"><label className="search-field history-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search patients or diagnoses" aria-label="Search past simulations" /></label><span>{filtered.length} {filtered.length === 1 ? "case" : "cases"}</span></div>
    {filtered.length ? <div className="history-rows">
      {filtered.map(item => <Link className="history-row" href={`/simulations/${item.id}/evaluate`} key={item.id}>
        <span className="history-avatar">{item.patient.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>
        <span className="history-main"><strong>{item.patient.name}</strong><small>{item.result?.diagnosis ?? "Diagnosis pending"}</small></span>
        <span className={`status-pill ${item.status === "completed" ? "complete" : "pending"}`}>{item.status === "completed" ? "Completed" : "Awaiting diagnosis"}</span>
        <span className="history-date">{formatDate(item.created_at)}</span><ArrowUpRight size={18} className="history-arrow" />
      </Link>)}
    </div> : <div className="history-empty">{simulations.length ? "No cases match your search." : "Your completed and active simulations will appear here."}</div>}
  </div>;
}
