import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, CheckCircle2, LockKeyhole, Target } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DiagnosisIllustration } from "@/components/DiagnosisIllustration";
import { auth0 } from "@/lib/auth0";
import { getLearningInsights, type LearningInsights } from "@/lib/backend";
import styles from "./insights.module.css";

export default async function InsightsPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/insights");

  let insights: LearningInsights | null = null;
  try {
    insights = await getLearningInsights(session.user.sub);
  } catch (error) {
    console.error("Learning insights unavailable", error);
  }

  const completed = insights?.completed_cases ?? 0;
  const required = insights?.required_cases ?? 5;
  const confusions = insights?.top_confusions ?? [];
  const clues = insights?.clues_to_revisit ?? [];

  return <AppShell name={session.user.name ?? session.user.email ?? "Student"} email={session.user.email} active="insights">
    <div className="page-header">
      <div>
        <span className="section-overline">PROGRESS REVIEW</span>
        <h1>Learning insights</h1>
        <p>See patterns in your completed cases and choose what to review next.</p>
      </div>
    </div>

    {!insights ? <div className="notice" role="status">Your learning insights are unavailable while the case service is offline.</div> : null}

    {insights && !insights.unlocked ? <section className={styles.locked}>
      <div className={styles.lockIcon}><LockKeyhole size={25} strokeWidth={1.7} /></div>
      <span className={styles.eyebrow}>PERSONALIZED REVIEW</span>
      <h2>Build your case history first</h2>
      <p>Complete five patient assessments to unlock a review of your diagnosis patterns and the clues worth revisiting.</p>
      <div className={styles.progressLabel}><strong>{completed} of {required} completed</strong><span>{Math.max(required - completed, 0)} to go</span></div>
      <div className={styles.progressTrack} role="progressbar" aria-label="Cases completed toward insights" aria-valuemin={0} aria-valuemax={required} aria-valuenow={completed}>
        <span style={{ width: `${Math.min(completed / required * 100, 100)}%` }} />
      </div>
      <Link href="/dashboard" className={styles.primaryLink}>Go to dashboard <ArrowRight size={17} /></Link>
    </section> : null}

    {insights?.unlocked ? <>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}><span className={styles.summaryLabel}>COMPLETED CASES</span><strong>{completed}</strong><small>Patient assessments submitted</small></div>
        <div className={styles.summaryCard}><span className={styles.summaryLabel}>CORRECT DIAGNOSES</span><strong>{insights.correct_cases}</strong><small>{Math.round((insights.correct_cases ?? 0) / completed * 100)}% across completed cases</small></div>
        <div className={styles.summaryCard}><span className={styles.summaryLabel}>CASES TO REVISIT</span><strong>{insights.incorrect_cases}</strong><small>Useful differential practice</small></div>
      </div>

      <div className={styles.sectionGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}><span className={styles.panelIcon}><Target size={19} /></span><div><span className={styles.eyebrow}>DIFFERENTIAL PRACTICE</span><h2>Conditions to compare</h2></div></div>
          <p className={styles.panelIntro}>These are conditions you chose when the case diagnosis was different. Repeated pairs appear first.</p>
          {confusions.length ? <div className={styles.confusionList}>{confusions.map(pair => <article className={styles.confusionCard} key={`${pair.actual_diagnosis_id}-${pair.chosen_diagnosis_id}`}>
            <div className={styles.conditionRow}>
              <div className={styles.condition}><DiagnosisIllustration diseaseId={pair.chosen_diagnosis_id} name={pair.chosen_diagnosis} decorative className={styles.diagnosisArt} /><span><small>YOU CHOSE</small><strong>{pair.chosen_diagnosis}</strong></span></div>
              <ArrowRight className={styles.conditionArrow} size={18} />
              <div className={styles.condition}><DiagnosisIllustration diseaseId={pair.actual_diagnosis_id} name={pair.actual_diagnosis} decorative className={styles.diagnosisArt} /><span><small>CASE DIAGNOSIS</small><strong>{pair.actual_diagnosis}</strong></span></div>
            </div>
            <div className={styles.confusionFoot}><span>{pair.count} {pair.count === 1 ? "case" : "cases"}{pair.clues.length ? ` · Clues to compare: ${pair.clues.join(", ")}` : " · Review the full case context"}</span><Link href={`/simulations/${pair.example_simulation_id}/evaluate`} aria-label={`Review ${pair.actual_diagnosis} case`}>Review case <ArrowUpRight size={15} /></Link></div>
          </article>)}</div> : <div className={styles.emptyState}><CheckCircle2 size={26} /><strong>No diagnosis mix-ups yet.</strong><p>As you complete more cases, comparisons will appear here when you choose a different diagnosis.</p></div>}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}><span className={styles.panelIcon}><BookOpenText size={19} /></span><div><span className={styles.eyebrow}>REVIEW</span><h2>Symptom patterns</h2></div></div>
          <p className={styles.panelIntro}>In your missed cases, these patient symptoms were linked to the case diagnosis but not to the condition you chose in the source dataset.</p>
          {clues.length ? <div className={styles.clueList}>{clues.map(clue => <div className={styles.clueRow} key={clue.symptom_id}>
            <span className={styles.clueCount}>{clue.count}×</span>
            <span className={styles.clueText}><strong>{clue.name}</strong><small>Seen with {clue.associated_diseases.join(", ")}</small></span>
          </div>)}</div> : <div className={styles.emptyState}><CheckCircle2 size={26} /><strong>No distinct symptom links yet.</strong><p>Your completed cases do not currently show a recurring clue to revisit.</p></div>}
        </section>
      </div>
      <div className={styles.sourceNote}>These are study prompts based on your saved cases and the historical Disease-Symptom Knowledge Database. A dataset link is not a clinical rule or symptom probability. <Link href="/history">Browse past simulations <ArrowUpRight size={14} /></Link></div>
    </> : null}
  </AppShell>;
}
