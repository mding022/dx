import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChartNoAxesCombined, ChevronRight, Clock3, LayoutGrid, LogOut, Stethoscope } from "lucide-react";

type AppShellProps = {
  name: string;
  email?: string;
  active: "dashboard" | "history" | "insights" | "simulation";
  children: React.ReactNode;
};

const navigation = [
  { href: "/dashboard", key: "dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/history", key: "history", label: "Past simulations", icon: Clock3 },
  { href: "/insights", key: "insights", label: "Learning insights", icon: ChartNoAxesCombined },
] as const;

export function AppShell({ name, email, active, children }: AppShellProps) {
  const firstName = name.trim().split(/\s+/)[0] || "Student";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "DX";
  const title = active === "simulation" ? "Patient encounter" : navigation.find(item => item.key === active)?.label;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand" aria-label="Dx overview">
          <span className="brand-mark"><Image src="/dx-transparent.png" width={84} height={84} alt="" /></span>
          <span className="brand-word">dx</span>
        </Link>
        <div className="sidebar-section-label">YOUR WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Workspace">
          {navigation.map(({ href, key, label, icon: Icon }) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`nav-item ${active === key ? "active" : ""}`}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{active === key ? <span className="nav-active-dot" /> : null}</Link>)}
        </nav>
        <div className="sidebar-note"><span className="sidebar-note-icon"><Stethoscope size={21} strokeWidth={1.6} /></span><strong>A little practice.<br />A little more confidence.</strong><p>Every patient has something to teach you.</p><Link href="/dashboard">Find your next case <ArrowUpRight size={15} /></Link></div>
        <div className="sidebar-bottom">
          <div className="sidebar-user"><span className="mini-avatar">{initials}</span><span className="sidebar-user-copy"><strong>{name || firstName}</strong><small title={email}>{email || "Medical student"}</small></span><a className="sidebar-logout" href="/auth/logout" aria-label="Log out" title="Log out"><LogOut size={17} /></a></div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="topbar-context"><span>Workspace</span><ChevronRight size={13} />{title}</div><div className="topbar-right"><span className="topbar-avatar" title={name}>{initials}</span><a className="mobile-logout" href="/auth/logout" aria-label="Log out"><LogOut size={17} /></a></div></header>
        <main id="main-content" className={`main-content ${active}-content`}>{children}</main>
        <footer className="workspace-footer"><span>Made for the art of asking better questions.</span><span>Dx · Clinical simulation</span></footer>
      </div>
    </div>
  );
}
