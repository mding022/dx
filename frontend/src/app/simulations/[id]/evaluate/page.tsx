import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { BackendError, getConversationPatient, getDiseases, getSimulation, type ConversationPatient, type Disease, type Simulation } from "@/lib/backend";
import { AppShell } from "@/components/AppShell";
import { PatientConversationWidget } from "@/components/PatientConversationWidget";
import { PatientChart } from "@/components/PatientChart";
import { ReviewCard } from "@/components/ReviewCard";

export default async function EvaluationPage({ params }: PageProps<"/simulations/[id]/evaluate">) {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/dashboard");
  const { id } = await params;
  let simulation: Simulation;
  try { simulation = await getSimulation(session.user.sub, id); }
  catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    console.error("Evaluation unavailable", error);
    return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="simulation"><div className="page-header"><div><h1>Case unavailable</h1><p>We couldn’t load this encounter. Please try again in a moment.</p></div></div><Link className="button button-dark" href="/dashboard">Back to overview</Link></AppShell>;
  }
  const patient = simulation.patient;
  const completed = simulation.status === "completed";
  const name = session.user.name ?? session.user.email ?? "Student";

  if (completed) return <AppShell name={name} email={session.user.email} active="simulation"><Link href="/history" className="back-link"><ArrowLeft size={15} />All simulations</Link><div className="review-page">{simulation.result ? <ReviewCard result={simulation.result} patient={patient} /> : <div className="notice">The review for this case is unavailable right now.</div>}</div></AppShell>;

  const agentId = process.env.ELEVENLABS_AGENT_ID?.trim() ?? "";
  let conversationPatient: ConversationPatient | null = null;
  let diseases: Disease[] = [];
  const [library, interview] = await Promise.allSettled([getDiseases(), agentId ? getConversationPatient(session.user.sub, id) : Promise.resolve(null)]);
  if (library.status === "fulfilled") diseases = library.value;
  else console.error("Condition library unavailable", library.reason);
  if (interview.status === "fulfilled") conversationPatient = interview.value;
  else console.error("Patient interview unavailable", interview.reason);

  return <AppShell name={name} email={session.user.email} active="simulation">
    <Link href="/dashboard" className="back-link"><ArrowLeft size={15} />Back to overview</Link>
    <div className="evaluation-header"><div><span className="section-overline">YOUR CLINICAL WORKSPACE</span><h1>Patient encounter<span className="heading-period">.</span></h1><p>A person to understand. A diagnosis to work toward.</p></div><span className="status-pill pending"><span />In progress</span></div>
    <ol className="encounter-steps" aria-label="Encounter progress"><li className="done"><span><Check size={14} /></span>Meet your patient</li><li className="current" aria-current="step"><span>02</span>Interview &amp; assess</li><li><span>03</span>Review &amp; reflect</li></ol>
    <PatientConversationWidget key={simulation.id} agentId={agentId} patientName={patient.name} patient={conversationPatient} simulationId={simulation.id} diseases={diseases}><PatientChart patient={patient} simulationId={simulation.id} /></PatientConversationWidget>
  </AppShell>;
}
