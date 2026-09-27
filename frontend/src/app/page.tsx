import { auth0 } from "@/lib/auth0";
import { LandingPatientPreview } from "./LandingPatientPreview";
import { ScrollReveal } from "./ScrollReveal";
import { ArrowDown, ArrowUpRight, AudioLines, BookOpenText, Check, ClipboardCheck, LockKeyhole, MessageCircleMore, MessagesSquare, SearchCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth0.getSession();
  const destination = session ? "/dashboard" : "/auth/login?returnTo=/dashboard";

  return (
    <main className={styles.canvas}>
      <div className={styles.frame}>
        <div className={styles.inner}>
          <ScrollReveal />
          <nav className={styles.nav} aria-label="Main navigation">
            <Link className={styles.brand} href="/" aria-label="dx home">
              <span className={styles.brandIcon}><Image src="/dx-transparent.png" width={76} height={76} alt="" priority /></span>
              <span className={styles.brandName}>dx</span>
            </Link>
            <div className={styles.navActions}>
              <a className={styles.navDescriptor} href="#how-it-works">How it works</a>
              <a className={styles.login} href={destination}><span className={styles.loginText}>{session ? "Dashboard" : "Log in"}</span><span className={styles.loginIcon}><ArrowUpRight size={16} strokeWidth={1.8} /></span></a>
            </div>
          </nav>

          <div className={styles.content}>
            <section className={styles.hero} aria-labelledby="home-title">
              <h1 id="home-title" className={styles.title}>
                <span>Practice the</span>
                <span><em>human side</em> of</span>
                <span>medical diagnosis.</span>
              </h1>
              <p className={styles.description}>Practice with realistic AI patients, work through the clues, and see how your clinical reasoning could improve.</p>
              <div className={styles.ctaRow}>
                <a className={styles.primaryCta} href={destination}><span className={styles.ctaText}>{session ? "Open dashboard" : "Try a simulation"}</span><span className={styles.ctaArrow}><ArrowUpRight size={19} strokeWidth={1.8} /></span></a>
                <span className={styles.ctaNote}>{session ? "Continue your clinical practice" : <><LockKeyhole size={13} strokeWidth={1.7} /> Account data secured by Auth0</>}</span>
              </div>
              <div className={styles.steps} aria-label="How dx works">
                <span><b>01</b> Meet a patient</span><i aria-hidden="true" /><span><b>02</b> Make a diagnosis</span><i aria-hidden="true" /><span><b>03</b> Learn from the case</span>
              </div>
            </section>

            <div className={styles.visual} aria-hidden="true">
              <div className={styles.visualGlow} />
              <div className={styles.visualRingOne} />
              <div className={styles.visualRingTwo} />
              <div className={styles.patientCard}>
                <div className={styles.cardTop}><span><span className={styles.liveDot} /> PATIENT ENCOUNTER</span><span>DX / 01</span></div>
                <LandingPatientPreview />
                <div className={styles.audioBar}><span className={styles.audioIcon}><AudioLines size={18} strokeWidth={1.9} /></span><div><strong>Patient is speaking</strong><small>A real conversation starts here</small></div><span className={styles.audioWave}><i /><i /><i /><i /><i /></span></div>
              </div>
              <div className={styles.questionCard}><span><MessageCircleMore size={16} /></span><p>“What brings you in today?”</p></div>
              <div className={styles.feedbackCard}><span><Check size={17} strokeWidth={2.5} /></span><div><strong>Learn from every case</strong><small>Thoughtful feedback after each diagnosis</small></div></div>
            </div>
          </div>

          <a href="#why-dx" className={styles.scrollPrompt}>Explore dx <ArrowDown size={15} /></a>

          <section id="why-dx" className={styles.problemSection} aria-labelledby="problem-title">
            <div className={`${styles.sectionIntro} ${styles.reveal}`} data-reveal>
              <span className={styles.sectionLabel}>WHY DX EXISTS</span>
              <h2 id="problem-title">The hardest part of diagnosis happens <em>between the questions.</em></h2>
            </div>
            <div className={`${styles.problemCopy} ${styles.reveal}`} data-reveal>
              <p>Knowing a condition is different from sitting across from someone and figuring out what matters. Dx gives students a safe place to practice that conversation, make a decision, and learn from it.</p>
              <span className={styles.copyRule} />
              <span>Built for the moment when theory becomes a patient encounter.</span>
            </div>
            <div className={styles.problemCards}>
              <article className={`${styles.problemCard} ${styles.reveal}`} data-reveal><span className={styles.problemIcon}><MessagesSquare size={22} strokeWidth={1.65} /></span><span className={styles.cardNumber}>01 / LISTEN</span><h3>Patients tell stories, not lists.</h3><p>Practice hearing the person behind the symptoms and asking the next useful question.</p></article>
              <article className={`${styles.problemCard} ${styles.reveal}`} data-reveal><span className={styles.problemIcon}><SearchCheck size={22} strokeWidth={1.65} /></span><span className={styles.cardNumber}>02 / REASON</span><h3>Clues take shape over time.</h3><p>Work through an encounter before you commit to an answer, just as you would in practice.</p></article>
              <article className={`${styles.problemCard} ${styles.reveal}`} data-reveal><span className={styles.problemIcon}><ClipboardCheck size={22} strokeWidth={1.65} /></span><span className={styles.cardNumber}>03 / REFLECT</span><h3>Feedback should teach.</h3><p>See which clues supported your diagnosis and which ones deserved a closer look.</p></article>
            </div>
          </section>

          <section id="how-it-works" className={styles.processSection} aria-labelledby="process-title">
            <div className={`${styles.processHeading} ${styles.reveal}`} data-reveal><span className={styles.sectionLabel}>THE EXPERIENCE</span><h2 id="process-title">One encounter.<br /><em>Three useful steps.</em></h2><p>Move from conversation to decision to understanding, at your own pace.</p></div>
            <div className={styles.processList}>
              <div className={`${styles.processItem} ${styles.reveal}`} data-reveal><span className={styles.processNumber}>01</span><div><h3>Meet your patient</h3><p>Speak with a believable patient and uncover the details behind their visit.</p></div><MessageCircleMore size={24} strokeWidth={1.55} /></div>
              <div className={`${styles.processItem} ${styles.reveal}`} data-reveal><span className={styles.processNumber}>02</span><div><h3>Make your call</h3><p>Search the condition library and choose the diagnosis you think fits.</p></div><SearchCheck size={24} strokeWidth={1.55} /></div>
              <div className={`${styles.processItem} ${styles.reveal}`} data-reveal><span className={styles.processNumber}>03</span><div><h3>Understand the case</h3><p>Review the evidence and take a clearer thought process into your next encounter.</p></div><BookOpenText size={24} strokeWidth={1.55} /></div>
            </div>
          </section>

          <footer className={styles.footer}>
            <div className={styles.footerTop}>
              <div className={styles.technology}>
                <span className={styles.footerLabel}>POWERED BY</span>
                <Image src="/elevenlabs-logo.svg" width={139} height={18} alt="ElevenLabs" unoptimized />
                <span className={styles.footerDivider} />
                <Image src="/gemini-logo.svg" width={91} height={21} alt="Google Gemini" unoptimized />
              </div>
              <a className={styles.sourceCredit} href="https://impact.dbmi.columbia.edu/~friedma/Projects/DiseaseSymptomKB/index.html" target="_blank" rel="noopener noreferrer">
                <span className={styles.sourceIcon}><BookOpenText size={15} strokeWidth={1.8} /></span>
                <span>Disease-Symptom Dataset provided by Columbia University Biomedical Informatics.</span>
                <ArrowUpRight size={13} strokeWidth={1.8} />
              </a>
              <div className={styles.authentication}><LockKeyhole size={14} strokeWidth={1.7} /><span>SECURE SIGN IN WITH</span><Image src="/auth0-logo.svg" width={20} height={20} alt="Auth0 logo" unoptimized /><strong>Auth0</strong></div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
