import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LearningInsightsView } from "@/components/LearningInsightsView";
import { auth0 } from "@/lib/auth0";
import { getLearningInsights, type LearningInsights } from "@/lib/backend";

export default async function InsightsPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/insights");
  let insights: LearningInsights | null = null;
  try { insights = await getLearningInsights(session.user.sub); }
  catch (error) { console.error("Learning insights unavailable", error); }
  return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="insights"><LearningInsightsView insights={insights} /></AppShell>;
}
