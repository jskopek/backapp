import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

type ServiceRow = {
  id: string;
  name: string;
  lastBackupLabel: string;
};

const SERVICES: ServiceRow[] = [
  { id: "google-photos", name: "Google Photos", lastBackupLabel: "—" },
  { id: "whatsapp", name: "WhatsApp", lastBackupLabel: "—" }
];

export default function App() {
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion(null));
  }, []);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Hello BackApp</h1>
          <p className="subtitle">
            Local-first backups of your data from other services.
          </p>
        </div>
        <div className="meta">
          <div className="chip">
            Version: {appVersion ?? "(dev)"}
          </div>
        </div>
      </header>

      <main className="content">
        <section className="card">
          <h2>Services</h2>
          <ul className="services">
            {SERVICES.map((service) => (
              <li key={service.id} className="serviceRow">
                <div className="serviceName">{service.name}</div>
                <div className="serviceMeta">
                  Last backup: {service.lastBackupLabel}
                </div>
                <button className="button" disabled>
                  Open
                </button>
              </li>
            ))}
          </ul>
          <p className="hint">
            Import flows and viewers land in the next steps.
          </p>
        </section>
      </main>
    </div>
  );
}

