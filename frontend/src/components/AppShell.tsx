import Link from "next/link";
import Image from "next/image";
import { ChartNoAxesCombined, Clock3, LayoutGrid, LogOut } from "lucide-react";

type AppShellProps = {
  name: string;
  email?: string;
  active: "dashboard" | "history" | "insights" | "simulation";
  children: React.ReactNode;
};

export function AppShell({ name, email, active, children }: AppShellProps) {
  const firstName = name.trim().split(/\s+/)[0] || "Student";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "DX";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand" aria-label="dx dashboard">
          <span className="brand-mark"><Image src="/dx-transparent.png" width={84} height={84} alt="" /></span>
        </Link>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Workspace">
          <Link href="/dashboard" className={`nav-item ${active === "dashboard" ? "active" : ""}`}><LayoutGrid size={19} />Dashboard</Link>
          <Link href="/history" className={`nav-item ${active === "history" ? "active" : ""}`}><Clock3 size={19} />Past simulations</Link>
          <Link href="/insights" className={`nav-item ${active === "insights" ? "active" : ""}`}><ChartNoAxesCombined size={19} />Learning insights</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user"><span className="mini-avatar">{initials}</span><span className="sidebar-user-copy"><strong>{name || firstName}</strong><small>{email || "Medical student"}</small></span></div>
          <a className="sidebar-logout" href="/auth/logout"><LogOut size={16} /> Log out</a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><Link href="/dashboard" className="mobile-brand" aria-label="dx dashboard"><span className="brand-mark"><Image src="/dx-transparent.png" width={84} height={84} alt="" /></span></Link><div className="topbar-context"><span>DX</span><i />{active === "dashboard" ? "Dashboard" : active === "history" ? "Past simulations" : active === "insights" ? "Learning insights" : "Patient encounter"}</div><div className="topbar-right"><span>{firstName}</span><span className="topbar-avatar">{initials}</span><a className="mobile-logout" href="/auth/logout" aria-label="Log out"><LogOut size={17} /></a></div></header>
        <div className={`main-content ${active}-content`}>{children}</div>
      </div>
    </div>
  );
}
