import { useEffect, useState } from "react";
import { getVaultPath } from "../lib/vault";
import { getBuiltInPlugins } from "../plugins/registry";

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
        {getBuiltInPlugins().map((plugin) => (
          <a
            key={plugin.metadata.id}
            href={`#/services/${plugin.metadata.id}`}
            className="serviceCard"
          >
            <div className="serviceCardTitle">
              <span className="serviceIcon">{plugin.metadata.icon ?? ""}</span>
              {plugin.metadata.name}
            </div>
            <div className="serviceCardDescription">
              {plugin.metadata.description}
            </div>
            <div className="serviceCardMeta">Last backup: —</div>
          </a>
        ))}
      </div>
    </section>
  );
}
