import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getDiseases, listSimulations, type Disease, type Simulation } from "@/lib/backend";
import { AppShell } from "@/components/AppShell";
import { DashboardOverview } from "@/components/DashboardOverview";

export default async function Dashboard() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/dashboard");
  const name = session.user.name ?? session.user.email ?? "Student";
  let simulations: Simulation[] = [];
  let diseases: Disease[] = [];
  let backendError = false;
  const [history, library] = await Promise.allSettled([listSimulations(session.user.sub), getDiseases()]);
  if (history.status === "fulfilled") simulations = history.value;
  else { console.error("Dashboard history unavailable", history.reason); backendError = true; }
  if (library.status === "fulfilled") diseases = library.value;
  else console.error("Condition library unavailable", library.reason);

  return <AppShell name={name} email={session.user.email} active="dashboard"><DashboardOverview firstName={name.trim().split(/\s+/)[0]} simulations={simulations} diseases={diseases} backendError={backendError} /></AppShell>;
}
