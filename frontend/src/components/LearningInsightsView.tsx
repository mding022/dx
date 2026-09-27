import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, ChartNoAxesCombined, CheckCircle2, Focus, LockKeyhole, Target } from "lucide-react";
import { DiagnosisIllustration } from "@/components/DiagnosisIllustration";
import { StartSimulationButton } from "@/components/StartSimulationButton";
import type { LearningInsights } from "@/lib/backend";
import styles from "@/app/insights/insights.module.css";

export function LearningInsightsView({ insights }: { insights: LearningInsights | null }) {
  const completed = insights?.completed_cases ?? 0;
  const required = Math.max(insights?.required_cases ?? 5, 1);
  const correct = insights?.correct_cases ?? 0;
  const incorrect = insights?.incorrect_cases ?? 0;
  const accuracy = completed ? Math.round(correct / completed * 100) : 0;
  const confusions = insights?.top_confusions ?? [];
  const clues = insights?.clues_to_revisit ?? [];
  const progress = Math.min(completed / required * 100, 100);

  return <>
    <div className="page-header"><div><span className="section-overline">MAKE EVERY CASE COUNT</span><h1>Learning insights<span className="heading-period">.</span></h1><p>A clearer picture of your progress, and where to go next.</p></div><StartSimulationButton compact /></div>
    {!insights ? <div className="notice" role="status">Your learning insights are temporarily unavailable. Please refresh to try again.</div> : null}

    {insights && !insights.unlocked ? <>
      <section className={styles.locked}>
        <div className={styles.lockedCopy}><span className={styles.eyebrow}><LockKeyhole size={13} /> YOUR PROGRESS IS TAKING SHAPE</span><h2>A few more cases.<br /><em>A new perspective.</em></h2><p>Complete {required} patient assessments to discover the patterns in your clinical reasoning, the conditions to compare, and the clues worth a second look.</p><div className={styles.progressLabel}><strong>{completed} of {required} cases completed</strong><span>{Math.max(required - completed, 0)} to go</span></div><div className={styles.progressTrack} role="progressbar" aria-label="Cases completed toward insights" aria-valuemin={0} aria-valuemax={required} aria-valuenow={Math.min(completed, required)}><span style={{ width: `${progress}%` }} /></div><Link href="/dashboard" className={styles.primaryLink}>Continue your practice <ArrowRight size={16} /></Link></div>
        <div className={styles.lockedVisual} aria-hidden="true"><div className={styles.progressRing} style={{ "--progress": `${progress}%` } as CSSProperties}><div><ChartNoAxesCombined size={28} strokeWidth={1.5} /><strong>{completed}<span> / {required}</span></strong><small>CASES COMPLETED</small></div></div><span className={styles.visualCaption}>Small steps. Lasting understanding.</span></div>
      </section>
      <div className={styles.previewGrid}>{[{ icon: Target, title: "Understand your decisions", text: "See the conditions you tend to confuse, side by side." }, { icon: Focus, title: "Spot the recurring clues", text: "Revisit symptom patterns from cases you found challenging." }, { icon: BookOpenText, title: "Make your next step count", text: "Return to a past case with a fresh perspective." }].map(({ icon: Icon, title, text }) => <div className={styles.previewCard} key={title}><Icon size={21} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></div>)}</div>
    </> : null}

    {insights?.unlocked ? <>
      <div className={styles.overviewGrid}>
        <section className={styles.performance}><div className={styles.accuracyRing} role="img" aria-label={`${accuracy}% diagnostic accuracy`} style={{ "--progress": `${accuracy}%` } as CSSProperties}><div><strong>{accuracy}<span>%</span></strong><small>ACCURACY</small></div></div><div className={styles.performanceCopy}><span className={styles.eyebrow}>THE BIG PICTURE</span><h2>Your practice, in perspective.</h2><p>Every completed encounter adds to your clinical experience.</p><div className={styles.performanceStats}><span><strong>{completed}</strong><small>Completed</small></span><span><strong>{correct}</strong><small>Correct</small></span><span><strong>{incorrect}</strong><small>To revisit</small></span></div></div></section>
        <section className={styles.focusCard}><span className={styles.eyebrow}><Focus size={13} /> YOUR NEXT FOCUS</span><h2>{confusions.length ? "Look a little closer." : "Keep your curiosity going."}</h2><p>{confusions.length ? `Revisit ${confusions[0].actual_diagnosis} and compare it with ${confusions[0].chosen_diagnosis}.` : "A new encounter is a chance to ask better questions and strengthen your reasoning."}</p><Link href={confusions.length ? `/simulations/${confusions[0].example_simulation_id}/evaluate` : "/dashboard"}>{confusions.length ? "Open the case review" : "Return to your workspace"}<ArrowUpRight size={17} /></Link></section>
      </div>

      <div className={styles.sectionGrid}>
        <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.panelIcon}><Target size={20} strokeWidth={1.6} /></span><div><span className={styles.eyebrow}>DIFFERENTIAL PRACTICE</span><h2>Conditions to compare</h2></div></div><p className={styles.panelIntro}>A closer look at the diagnoses you mixed up. Your most repeated pairs appear first.</p>
          {confusions.length ? <div className={styles.confusionList}>{confusions.map(pair => <article className={styles.confusionCard} key={`${pair.actual_diagnosis_id}-${pair.chosen_diagnosis_id}`}><div className={styles.conditionRow}><div className={styles.condition}><DiagnosisIllustration diseaseId={pair.chosen_diagnosis_id} name={pair.chosen_diagnosis} decorative className={styles.diagnosisArt} /><span><small>YOU CHOSE</small><strong>{pair.chosen_diagnosis}</strong></span></div><ArrowRight className={styles.conditionArrow} size={17} /><div className={styles.condition}><DiagnosisIllustration diseaseId={pair.actual_diagnosis_id} name={pair.actual_diagnosis} decorative className={styles.diagnosisArt} /><span><small>CASE DIAGNOSIS</small><strong>{pair.actual_diagnosis}</strong></span></div></div>{pair.clues.length ? <div className={styles.clueTags}>{pair.clues.map(clue => <span key={clue}>{clue}</span>)}</div> : null}<div className={styles.confusionFoot}><span>Seen in {pair.count} {pair.count === 1 ? "case" : "cases"}</span><Link href={`/simulations/${pair.example_simulation_id}/evaluate`} aria-label={`Review ${pair.actual_diagnosis} case`}>Review case <ArrowUpRight size={14} /></Link></div></article>)}</div> : <div className={styles.emptyState}><CheckCircle2 size={26} strokeWidth={1.5} /><strong>A strong start.</strong><p>No diagnosis mix-ups in your completed cases. Keep practicing to build a broader picture.</p></div>}
        </section>
        <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.panelIcon}><BookOpenText size={20} strokeWidth={1.6} /></span><div><span className={styles.eyebrow}>CONNECT THE CLUES</span><h2>Symptoms to revisit</h2></div></div><p className={styles.panelIntro}>Clues linked to the case diagnosis, but not your choice, in the source dataset.</p>
          {clues.length ? <div className={styles.clueList}>{clues.map(clue => <div className={styles.clueRow} key={clue.symptom_id}><span className={styles.clueText}><strong>{clue.name}</strong><small>Seen with {clue.associated_diseases.join(", ")}</small><span className={styles.clueBar} aria-hidden="true"><i style={{ width: `${Math.min(clue.count / Math.max(...clues.map(item => item.count), 1) * 100, 100)}%` }} /></span></span><span className={styles.clueCount}>{clue.count}×</span></div>)}</div> : <div className={styles.emptyState}><CheckCircle2 size={26} strokeWidth={1.5} /><strong>No recurring clues yet.</strong><p>Patterns will appear here as you work through more cases.</p></div>}
        </section>
      </div>
      <div className={styles.sourceNote}>Study prompts based on your saved cases and the historical Disease-Symptom Knowledge Database. A dataset link is not a clinical rule or symptom probability.<Link href="/history">Explore your case history <ArrowUpRight size={14} /></Link></div>
    </> : null}
  </>;
}
