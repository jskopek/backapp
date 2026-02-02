import { useState } from "react";
import "./App.css";

type NavTab = "services" | "settings";

const SERVICES = [
  { name: "Google Photos Takeout", description: "Import photos from Google Takeout" },
  { name: "WhatsApp iOS Export", description: "Import WhatsApp chat history" },
  { name: "Wikipedia", description: "Download articles for offline reading" },
];

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("services");

  return (
    <div className="app">
      <header className="app-header">
        <h1>BackApp</h1>
        <span className="version">v0.1.0</span>
      </header>

      <nav className="nav">
        <button
          className={`nav-button ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          Services
        </button>
        <button
          className={`nav-button ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </nav>

      <main className="content">
        {activeTab === "services" && (
          <section>
            <h2>Hello BackApp</h2>
            <p className="subtitle">Your data backup manager</p>
            <ul className="services-list">
              {SERVICES.map((service) => (
                <li key={service.name} className="service-item">
                  <strong>{service.name}</strong>
                  <span>{service.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === "settings" && (
          <section>
            <h2>Settings</h2>
            <p className="subtitle">Configuration options will appear here.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
