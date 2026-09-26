import { auth0 } from "@/lib/auth0";
import { PatientIllustration } from "@/components/PatientIllustration";
import { ArrowUpRight, AudioLines, BookOpenText, Check, LockKeyhole, MessageCircleMore } from "lucide-react";
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
          <nav className={styles.nav} aria-label="Main navigation">
            <Link className={styles.brand} href="/" aria-label="dx home">
              <span className={styles.brandIcon}><Image src="/dx-transparent.png" width={76} height={76} alt="" priority /></span>
              <span className={styles.brandName}>dx</span>
            </Link>
            <div className={styles.navActions}>
              <span className={styles.navDescriptor}>A clinical learning experience</span>
              <a className={styles.login} href={destination}>{session ? "Dashboard" : "Log in"}<ArrowUpRight size={16} strokeWidth={1.8} /></a>
            </div>
          </nav>

          <div className={styles.content}>
            <section className={styles.hero} aria-labelledby="home-title">
              <h1 id="home-title" className={styles.title}>Practice the <em>human side</em> of medical diagnosis.</h1>
              <p className={styles.description}>Practice with realistic AI patients, work through the clues, and see how your clinical reasoning could improve.</p>
              <div className={styles.ctaRow}>
                <a className={styles.primaryCta} href={destination}>{session ? "Open dashboard" : "Try a simulation"}<ArrowUpRight size={19} strokeWidth={1.8} /></a>
                <span className={styles.ctaNote}>{session ? "Continue your clinical practice" : "Create a free account to begin"}</span>
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
                <div className={styles.cardTop}><span><span className={styles.liveDot} /> PATIENT ENCOUNTER</span><span>CASE 024</span></div>
                <div className={styles.patientPortrait}><PatientIllustration className={styles.portrait} pronouns="she/her" /></div>
                <div className={styles.patientName}>Meet Maya <span>·</span> 34</div>
                <div className={styles.patientCaption}>Your next patient is ready to talk.</div>
                <div className={styles.audioBar}><span className={styles.audioIcon}><AudioLines size={18} strokeWidth={1.9} /></span><div><strong>Patient is speaking</strong><small>A real conversation starts here</small></div><span className={styles.audioWave}><i /><i /><i /><i /><i /></span></div>
              </div>
              <div className={styles.questionCard}><span><MessageCircleMore size={16} /></span><p>“What brings you in today?”</p></div>
              <div className={styles.feedbackCard}><span><Check size={17} strokeWidth={2.5} /></span><div><strong>Learn from every case</strong><small>Thoughtful feedback after each diagnosis</small></div></div>
            </div>
          </div>

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
