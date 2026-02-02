import { useEffect, useState } from "react";
import { getVaultPath } from "../lib/vault";
import { getPluginById } from "../plugins/registry";

type Props = {
  serviceId: string;
};

export default function ServiceDetailPage({ serviceId }: Props) {
  const plugin = getPluginById(serviceId);
  const [vaultPath, setVaultPath] = useState<string>("…");

  useEffect(() => {
    getVaultPath().then(setVaultPath).catch(() => setVaultPath("(unknown)"));
  }, []);

  if (!plugin) {
    return (
      <section className="card">
        <h2>Unknown service</h2>
        <p className="hint">No built-in service with id “{serviceId}”.</p>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="breadcrumbs">
          <a href="#/services" className="link">
            Services
          </a>
          <span className="breadcrumbsSep">/</span>
          <span>{plugin.metadata.name}</span>
        </div>

        <h2>
          <span className="serviceIcon">{plugin.metadata.icon ?? ""}</span>
          {plugin.metadata.name}
        </h2>
        <p className="hint">{plugin.metadata.description}</p>
        <div className="kv">
          <div className="kvKey">Vault</div>
          <div className="kvValue mono" title={vaultPath}>
            {vaultPath}
          </div>
        </div>
        <div className="kv">
          <div className="kvKey">Expected layout</div>
          <div className="kvValue mono">
            Vault/{plugin.metadata.id}/&lt;accountId&gt;/
          </div>
        </div>

        <div className="actions">
          <a className="buttonLink" href={`#/services/${plugin.metadata.id}/import`}>
            Import / Re-import
          </a>
          <a
            className="buttonLink"
            href={`#/services/${plugin.metadata.id}/raw/default/`}
          >
            Browse Raw Files
          </a>
        </div>
      </section>

      <section className="card">
        <h3>Instructions</h3>
        <plugin.Instructions pluginId={plugin.metadata.id} />
      </section>

      <plugin.Viewer pluginId={plugin.metadata.id} />

      <section className="card">
        <h3>Backups</h3>
        <ul className="list">
          <li className="listRow">
            <div>
              <div className="listTitle">Example backup</div>
              <div className="hint">Imported: —</div>
            </div>
            <button className="button" disabled>
              View
            </button>
          </li>
        </ul>
        <p className="hint">Import + indexing comes in step 05+.</p>
      </section>
    </div>
  );
}
