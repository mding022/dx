import { auth0 } from "@/lib/auth0";
import Image from "next/image";
import { ArrowUpRight, HeartPulse } from "lucide-react";

export default async function Home() {
  const session = await auth0.getSession();
  return (
    <main className="home-page">
      <nav className="home-nav" aria-label="Main navigation">
        <div className="wordmark"><span className="brand-mark"><Image src="/dx-transparent.png" width={84} height={84} alt="dx logo" /></span></div>
        <a className="home-nav-link" href={session ? "/dashboard" : "/auth/login?returnTo=/dashboard"}>
          {session ? "Dashboard" : "Log in"} <ArrowUpRight size={17} strokeWidth={1.8} />
        </a>
      </nav>
      <section className="home-hero">
        <div className="home-orbit orbit-one" /><div className="home-orbit orbit-two" />
        <div className="home-hero-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> A space to practice clinical thinking</span>
          <h1>Practice the<br /><em>human side</em> of diagnosis.</h1>
          <p>Meet a new patient, make your assessment, and build confidence one case at a time.</p>
          <a className="button button-dark home-cta" href={session ? "/dashboard" : "/auth/login?returnTo=/dashboard"}>
            {session ? "Open dashboard" : "Log in to dx"} <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="home-symbol" aria-hidden="true"><HeartPulse size={88} strokeWidth={1.1} /></div>
      </section>
      <footer className="home-footer"><span>dx © {new Date().getFullYear()}</span><span>Clinical learning, thoughtfully designed.</span></footer>
    </main>
  );
}
