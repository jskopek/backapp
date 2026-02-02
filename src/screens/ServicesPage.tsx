import { useEffect, useState } from "react";
import { getVaultPath } from "../lib/vault";
import { BUILT_IN_SERVICES } from "../services/registry";

export default function ServicesPage() {
  const [vaultPath, setVaultPath] = useState<string>("…");

  useEffect(() => {
    getVaultPath().then(setVaultPath).catch(() => setVaultPath("(unknown)"));
  }, []);

  return (
    <section className="card">
      <h2>Services</h2>
      <p className="hint">
        Pick a service to import an offline export and browse it.
      </p>
      <div className="kv">
        <div className="kvKey">Vault</div>
        <div className="kvValue mono" title={vaultPath}>
          {vaultPath}
        </div>
      </div>

      <div className="serviceCards">
        {BUILT_IN_SERVICES.map((service) => (
          <a
            key={service.id}
            href={`#/services/${service.id}`}
            className="serviceCard"
          >
            <div className="serviceCardTitle">{service.name}</div>
            <div className="serviceCardDescription">{service.description}</div>
            <div className="serviceCardMeta">Last backup: —</div>
          </a>
        ))}
      </div>
    </section>
  );
}
