import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, ChartNoAxesCombined, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, MessageCircleMore, Stethoscope, Target } from "lucide-react";
import type { Disease, Simulation } from "@/lib/backend";
import { ConditionLibrary } from "@/components/ConditionLibrary";
import { StartSimulationButton } from "@/components/StartSimulationButton";
import { PatientIllustration } from "@/components/PatientIllustration";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function DashboardOverview({ firstName, simulations, diseases, backendError = false }: { firstName: string; simulations: Simulation[]; diseases: Disease[]; backendError?: boolean }) {
  const sorted = [...simulations].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const completed = sorted.filter(item => item.status === "completed");
  const correct = completed.filter(item => item.result?.correct).length;
  const activeCase = sorted.find(item => item.status !== "completed");
  const accuracy = completed.length ? `${Math.round(correct / completed.length * 100)}%` : "—";

  return <>
    <div className="page-header"><div><h1>Welcome back, {firstName}<span className="heading-period">.</span></h1><p>Your next step toward more confident clinical reasoning.</p></div><span className="header-date"><Clock3 size={15} />{new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date())}</span></div>
    {backendError ? <div className="notice" role="status">Your workspace couldn’t load all its data. Please refresh to try again.</div> : null}

    <div className="stats-grid">
      <div className="stat-card"><span className="stat-icon"><Stethoscope size={19} /></span><div><span className="stat-label">Cases started</span><strong>{backendError ? "—" : simulations.length.toString().padStart(2, "0")}</strong></div><small>Your clinical experience</small></div>
      <div className="stat-card"><span className="stat-icon"><CheckCircle2 size={19} /></span><div><span className="stat-label">Cases completed</span><strong>{backendError ? "—" : completed.length.toString().padStart(2, "0")}</strong></div><small>One lesson in every case</small></div>
      <div className="stat-card"><span className="stat-icon"><Target size={19} /></span><div><span className="stat-label">Diagnostic accuracy</span><strong>{accuracy}</strong></div><small>{completed.length ? `${correct} of ${completed.length} diagnoses correct` : "Complete a case to get started"}</small></div>
    </div>

    <div className="practice-grid">
      <section className="hero-card">
        <div className="hero-copy"><h2>Every conversation<br />makes you better.</h2><p>Meet a new patient. Follow the clues.<br />Put your clinical reasoning into practice.</p><StartSimulationButton /><div className="hero-footnote"><AudioLines size={14} /> Voice-led encounters <span>·</span> At your own pace</div></div>
        <div className="encounter-preview" aria-hidden="true"><span className="encounter-preview-caption">THE PRACTICE LOOP</span>{[{ icon: MessageCircleMore, title: "Listen", text: "Find the story behind the symptoms." }, { icon: Stethoscope, title: "Reason", text: "Connect the clues. Make your call." }, { icon: ClipboardCheck, title: "Reflect", text: "Take something into the next case." }].map(({ icon: Icon, title, text }, index) => <div className="encounter-preview-row" key={title}><span className="encounter-preview-number"><Icon size={19} /></span><div><small>0{index + 1}</small><strong>{title}</strong><p>{text}</p></div></div>)}</div>
      </section>
      {activeCase ? <section className="continue-card"><span className="section-overline">PICK UP WHERE YOU LEFT OFF</span><div className="continue-patient"><span className="continue-portrait"><PatientIllustration pronouns={activeCase.patient.pronouns} /></span><span className="status-pill pending"><span />In progress</span></div><h2>{activeCase.patient.name}</h2><p>{activeCase.patient.age} years · {activeCase.patient.pronouns}</p><div className="continue-caption"><Clock3 size={15} />Started {formatDate(activeCase.created_at)}</div><Link href={`/simulations/${activeCase.id}/evaluate`} className="button button-outline">Continue encounter <ArrowRight size={17} /></Link></section> : <section className="continue-card practice-guide"><span className="section-overline">A GOOD PLACE TO START</span><span className="guide-icon"><MessageCircleMore size={28} strokeWidth={1.5} /></span><h2>Stay curious.<br />Start with a question.</h2><p>Let the patient tell their story before narrowing down your diagnosis.</p><div className="practice-prompt">“What brings you in today?”</div></section>}
    </div>

    <div className="dashboard-grid">
      <section className="panel recent-panel">
        <div className="panel-heading"><div><span className="section-overline">KEEP BUILDING</span><h2>Recent simulations</h2></div><Link href="/history" className="text-link">All activity <ArrowUpRight size={16} /></Link></div>
        {sorted.length ? <div className="recent-list">{sorted.slice(0, 4).map(item => <Link href={`/simulations/${item.id}/evaluate`} className="recent-row" key={item.id}><span className="recent-initials">{item.patient.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><span className="recent-info"><strong>{item.patient.name}</strong><small>{item.result?.diagnosis ?? "Ready to continue your encounter"}</small></span><span className="recent-meta"><span className={`status-pill ${item.status !== "completed" ? "pending" : item.result?.correct ? "complete" : "review"}`}>{item.status !== "completed" ? "In progress" : item.result?.correct ? <><Check size={12} />Correct</> : "To revisit"}</span><small>{formatDate(item.created_at)}</small></span><ChevronRight size={16} /></Link>)}</div> : <div className="recent-empty"><span className="empty-icon"><Stethoscope size={27} strokeWidth={1.5} /></span><strong>{backendError ? "Activity is temporarily unavailable" : "Your first chapter starts here"}</strong><p>{backendError ? "Refresh the page to load your saved encounters." : "Each encounter becomes a case you can come back to. Start your first simulation above."}</p></div>}
        <Link href="/insights" className="insight-link"><span className="insight-link-icon"><ChartNoAxesCombined size={20} /></span><span><strong>Turn practice into perspective</strong><small>Explore patterns in your learning insights</small></span><ArrowRight size={17} /></Link>
      </section>
      <ConditionLibrary diseases={diseases} />
    </div>
  </>;
}
