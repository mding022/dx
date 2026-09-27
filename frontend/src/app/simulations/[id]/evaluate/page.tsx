import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CalendarDays, ClipboardList, Heart, Pill, ShieldCheck, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { BackendError, getConversationPatient, getDiseases, getSimulation, type ConversationPatient, type Disease, type Simulation } from "@/lib/backend";
import { AppShell } from "@/components/AppShell";
import { PatientConversationWidget } from "@/components/PatientConversationWidget";
import { DiagnosisForm } from "@/components/DiagnosisForm";
import { PatientIllustration } from "@/components/PatientIllustration";
import { ReviewCard } from "@/components/ReviewCard";

function listValue(items: string[]) { return items.length ? items.join(", ") : "Not reported"; }

export default async function EvaluationPage({ params }: PageProps<"/simulations/[id]/evaluate">) {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/dashboard");
  const { id } = await params;
  let simulation: Simulation;
  let diseases: Disease[] = [];
  try {
    simulation = await getSimulation(session.user.sub, id);
    if (simulation.status !== "completed") diseases = await getDiseases();
  }
  catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    console.error("Evaluation unavailable", error);
    return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="simulation"><div className="page-header"><h1>Case unavailable<span className="heading-period">.</span></h1><p>Check that the Python backend is running, then try again.</p></div><Link className="button button-dark" href="/dashboard">Back to dashboard</Link></AppShell>;
  }
  const patient = simulation.patient;
  const completed = simulation.status === "completed";

  if (completed) {
    return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="simulation">
      <Link href="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to dashboard</Link>
      <div className="review-page">
        {simulation.result ? <ReviewCard result={simulation.result} patient={patient} /> : <div className="notice">The review for this case is unavailable right now.</div>}
      </div>
    </AppShell>;
  }

  const agentId = process.env.ELEVENLABS_AGENT_ID?.trim() ?? "";
  let conversationPatient: ConversationPatient | null = null;
  if (agentId) {
    try { conversationPatient = await getConversationPatient(session.user.sub, id); }
    catch (error) { console.error("Patient interview unavailable", error); }
  }

  return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="simulation">
    <Link href="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to dashboard</Link>
    <div className="evaluation-header"><div><span className="section-overline">CASE {simulation.id.slice(0, 8).toUpperCase()}</span><h1>Diagnose this Patient</h1><p>Interview {patient.name.split(" ")[0]}, review their chart, then submit your diagnosis.</p></div><span className="status-pill pending">Awaiting diagnosis</span></div>
    <div className="steps"><div className="step done"><span><BadgeCheck size={16} /></span> Case prepared</div><div className="step-line" /><div className="step current"><span>2</span> Interview &amp; evaluation</div><div className="step-line" /><div className="step"><span>3</span> Review</div></div>
    <PatientConversationWidget key={simulation.id} agentId={agentId} patientName={patient.name} patient={conversationPatient} />
    <div className="evaluation-grid">
      <section className="panel assessment-panel">
        <div className="assessment-patient-summary"><span>ASSESSING</span><strong>{patient.name}</strong><small>{patient.age} years · {patient.pronouns}</small></div>
        <span className="section-overline">YOUR ASSESSMENT</span>
        <h2>What is your diagnosis?</h2>
        <p className="assessment-intro">Search the condition library and choose the diagnosis that best fits this encounter.</p>
        <DiagnosisForm diseases={diseases} simulationId={simulation.id} />
      </section>
      <section className="patient-card">
        <div className="patient-card-top"><div><span className="card-eyebrow">PATIENT PROFILE</span><h2>{patient.name}</h2><p>{patient.age} years old <span>·</span> {patient.pronouns}</p></div><span className="id-chip"><ShieldCheck size={15} /> SIMULATED</span></div>
        <div className="portrait-panel"><div className="portrait-halo" /><PatientIllustration className="patient-portrait" pronouns={patient.pronouns} /><span className="portrait-caption">PATIENT ID <strong>{simulation.id.slice(0, 6).toUpperCase()}</strong></span></div>
        <div className="patient-facts"><div><span><CalendarDays size={17} /> Age</span><strong>{patient.age} years</strong></div><div><span><UserRound size={17} /> Pronouns</span><strong>{patient.pronouns}</strong></div><div><span><BriefcaseBusiness size={17} /> Occupation</span><strong>{patient.occupation}</strong></div></div>
      </section>
      <section className="panel profile-details"><div className="panel-heading"><div><span className="section-overline">PATIENT CHART</span><h2>Clinical background</h2></div><Heart size={19} className="muted-icon" /></div><p className="patient-background">{patient.background}</p><div className="detail-grid"><div className="detail-item"><span className="detail-icon"><ClipboardList size={19} /></span><div><small>MEDICAL HISTORY</small><p>{listValue(patient.medical_history)}</p></div></div><div className="detail-item"><span className="detail-icon"><Pill size={19} /></span><div><small>MEDICATIONS</small><p>{listValue(patient.medications)}</p></div></div><div className="detail-item"><span className="detail-icon"><ShieldCheck size={19} /></span><div><small>ALLERGIES</small><p>{listValue(patient.allergies)}</p></div></div></div></section>
    </div>
  </AppShell>;
}
