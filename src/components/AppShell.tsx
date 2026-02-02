import { PropsWithChildren, useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { navigate, useHashPath } from "../router/hash";

type NavItem = {
  id: string;
  label: string;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "services", label: "Services", to: "/services" },
  { id: "settings", label: "Settings", to: "/settings" }
];

export default function AppShell({ children }: PropsWithChildren) {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const path = useHashPath();

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion(null));
  }, []);

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="sidebarHeader">
          <div className="brand">BackApp</div>
          <div className="chip">v{appVersion ?? "(dev)"}</div>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              path === item.to ||
              (item.to === "/services" && path.startsWith("/services"));

            return (
              <a
                key={item.id}
                href={`#${item.to}`}
                className={`navItem ${isActive ? "navItemActive" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.to);
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="sidebarFooter">
          <div className="sidebarHint">Local-first backups, offline imports.</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="topbarTitle">Hello BackApp</h1>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

