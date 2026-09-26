import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Sparkles, Stethoscope } from "lucide-react";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getDiseases, listSimulations, type Disease, type Simulation } from "@/lib/backend";
import { AppShell } from "@/components/AppShell";
import { ConditionLibrary } from "@/components/ConditionLibrary";
import { StartSimulationButton } from "@/components/StartSimulationButton";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export default async function Dashboard() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/dashboard");
  const name = session.user.name ?? session.user.email ?? "Student";
  const firstName = name.split(" ")[0];
  let simulations: Simulation[] = [];
  let diseases: Disease[] = [];
  let backendError = false;
  try { [simulations, diseases] = await Promise.all([listSimulations(session.user.sub), getDiseases()]); }
  catch (error) { console.error("Dashboard data unavailable", error); backendError = true; }
  const completed = simulations.filter(item => item.status === "completed");
  const correct = completed.filter(item => item.result?.correct).length;
  const accuracy = completed.length ? `${Math.round(correct / completed.length * 100)}%` : "—";

  return <AppShell name={name} email={session.user.email} active="dashboard">
    <div className="page-header"><div><span className="section-overline">YOUR WORKSPACE</span><h1>Good to see you, {firstName}<span className="heading-period">.</span></h1><p>A quiet place to practice, reflect, and keep moving forward.</p></div><span className="header-date">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span></div>
    {backendError ? <div className="notice" role="status">The case service is offline. Start the Python backend to load your simulations.</div> : null}

    <section className="hero-card">
      <div className="hero-copy"><span className="hero-kicker"><Sparkles size={14} /> THE CLINICAL STUDIO</span><h2>Every great diagnosis<br />starts with curiosity.</h2><p>Step into a new patient encounter and put your clinical reasoning to work.</p><StartSimulationButton /></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit art-orbit-one" /><span className="art-orbit art-orbit-two" /><span className="art-main"><Stethoscope size={90} strokeWidth={1.1} /></span><span className="art-dot art-dot-one" /><span className="art-dot art-dot-two" /></div>
    </section>

    <div className="stats-grid">
      <div className="stat-card"><span className="stat-icon lime"><Stethoscope size={20} /></span><span className="stat-label">Total cases</span><strong>{simulations.length.toString().padStart(2, "0")}</strong><small>Your practice journey</small></div>
      <div className="stat-card"><span className="stat-icon cream"><CheckCircle2 size={20} /></span><span className="stat-label">Completed</span><strong>{completed.length.toString().padStart(2, "0")}</strong><small>Assessments submitted</small></div>
      <div className="stat-card"><span className="stat-icon mint"><Clock3 size={20} /></span><span className="stat-label">Diagnostic accuracy</span><strong>{accuracy}</strong><small>Across completed cases</small></div>
    </div>

    <div className="dashboard-grid">
      <section className="panel recent-panel">
        <div className="panel-heading"><div><span className="section-overline">YOUR ACTIVITY</span><h2>Recent simulations</h2></div><Link href="/history" className="text-link">View all <ArrowUpRight size={16} /></Link></div>
        {simulations.length ? <div className="recent-list">{simulations.slice(0, 4).map(item => <Link href={`/simulations/${item.id}/evaluate`} className="recent-row" key={item.id}><span className="recent-initials">{item.patient.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><span className="recent-info"><strong>{item.patient.name}</strong><small>{item.result?.diagnosis ?? "Diagnosis pending"}</small></span><span className="recent-meta"><span className={`status-pill ${item.status === "completed" ? "complete" : "pending"}`}>{item.status === "completed" ? "Completed" : "In progress"}</span><small>{formatDate(item.created_at)}</small></span><ArrowRight size={17} /></Link>)}</div> : <div className="recent-empty"><span className="empty-icon"><Stethoscope size={25} /></span><strong>Your first case is waiting.</strong><p>Start a simulation to begin building your clinical practice history.</p></div>}
      </section>
      <ConditionLibrary diseases={diseases} />
    </div>
  </AppShell>;
}
