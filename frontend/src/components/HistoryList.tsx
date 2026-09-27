"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpRight, Check, Clock3, Search, X } from "lucide-react";
import type { Simulation } from "@/lib/backend";

const filters = [{ id: "all", label: "All cases" }, { id: "active", label: "In progress" }, { id: "correct", label: "Correct" }, { id: "review", label: "To revisit" }] as const;
type Filter = typeof filters[number]["id"];
function matches(item: Simulation, filter: Filter) {
  return filter === "all" || (filter === "active" && item.status !== "completed") || (filter === "correct" && item.result?.correct === true) || (filter === "review" && item.result?.correct === false);
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function HistoryList({ simulations }: { simulations: Simulation[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState("newest");
  const filtered = useMemo(() => simulations.filter(item => matches(item, filter) &&
    `${item.patient.name} ${item.result?.diagnosis ?? ""} ${item.result?.submitted_diagnosis ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ).sort((a, b) => (Date.parse(b.created_at) - Date.parse(a.created_at)) * (sort === "newest" ? 1 : -1)), [query, filter, sort, simulations]);

  return <section className="panel history-panel" aria-label="Simulation history">
    <div className="history-filters" role="group" aria-label="Filter simulations">{filters.map(item => <button key={item.id} type="button" className={filter === item.id ? "filter-tab active" : "filter-tab"} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{simulations.filter(simulation => matches(simulation, item.id)).length}</span></button>)}</div>
    <div className="history-toolbar"><label className="search-field history-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search patients or diagnoses…" aria-label="Search past simulations" />{query ? <button type="button" className="input-clear" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button> : null}</label><label className="sort-control"><ArrowDownWideNarrow size={16} /><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort simulations"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
    {filtered.length ? <div className="history-rows"><div className="history-table-head" aria-hidden="true"><span>Patient / case</span><span>Outcome</span><span>Started</span><span /></div>
      {filtered.map(item => <Link className="history-row" href={`/simulations/${item.id}/evaluate`} key={item.id}>
        <span className="history-patient"><span className="history-avatar">{item.patient.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><span className="history-main"><strong>{item.patient.name}<span>{item.patient.age}y</span></strong><small>{item.result?.diagnosis ?? "Patient encounter in progress"}</small></span></span>
        <span className={`status-pill ${item.status !== "completed" ? "pending" : item.result?.correct ? "complete" : "review"}`}>{item.status !== "completed" ? <><Clock3 size={12} />In progress</> : item.result?.correct ? <><Check size={12} />Correct</> : "To revisit"}</span>
        <time className="history-date" dateTime={item.created_at}>{formatDate(item.created_at)}</time><span className="history-open"><ArrowUpRight size={17} /></span>
      </Link>)}
    </div> : <div className="history-empty"><span className="empty-icon">{simulations.length ? <Search size={25} /> : <Clock3 size={25} />}</span><h2>{simulations.length ? "No cases found" : "A fresh page in your practice"}</h2><p>{simulations.length ? "Try a different patient, diagnosis, or filter." : "Your active encounters and completed reviews will live here."}</p>{simulations.length ? <button className="text-link" type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Clear all filters <X size={14} /></button> : null}</div>}
    <div className="history-footer" role="status">{filtered.length} {filtered.length === 1 ? "case" : "cases"}{filter !== "all" || query ? ` of ${simulations.length}` : " in your practice history"}<span>Select a case to {filter === "active" ? "continue" : "open the encounter"}<ArrowUpRight size={13} /></span></div>
  </section>;
}
