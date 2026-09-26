import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { listSimulations, type Simulation } from "@/lib/backend";
import { AppShell } from "@/components/AppShell";
import { HistoryList } from "@/components/HistoryList";
import { StartSimulationButton } from "@/components/StartSimulationButton";

export default async function HistoryPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/history");
  let simulations: Simulation[] = [];
  let backendError = false;
  try { simulations = await listSimulations(session.user.sub); }
  catch (error) { console.error("History unavailable", error); backendError = true; }
  return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="history">
    <div className="page-header history-page-header"><div><span className="section-overline">YOUR JOURNEY</span><h1>Past simulations<span className="heading-period">.</span></h1><p>Pick up where you left off or revisit a completed case.</p></div><StartSimulationButton compact /></div>
    {backendError ? <div className="notice" role="status">Your history is unavailable while the Python backend is offline.</div> : null}
    <HistoryList simulations={simulations} />
  </AppShell>;
}
