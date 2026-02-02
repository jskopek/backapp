import { useEffect, useState } from "react";
import { getVaultPath, isTauri, setVaultPath } from "../lib/vault";

async function chooseFolder(): Promise<string | null> {
  if (!isTauri()) {
    const value = window.prompt("Vault folder path:");
    return value && value.trim() ? value.trim() : null;
  }

  const { open } = await import("@tauri-apps/api/dialog");
  const selected = await open({ directory: true, multiple: false });
  if (!selected) return null;
  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected;
}

export default function SettingsPage() {
  const [vaultPath, setVaultPathState] = useState<string>("…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVaultPath()
      .then(setVaultPathState)
      .catch((e) => setError(String(e)));
  }, []);

  async function onChangeVault() {
    setError(null);
    const chosen = await chooseFolder();
    if (!chosen) return;
    try {
      await setVaultPath(chosen);
      const updated = await getVaultPath();
      setVaultPathState(updated);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <section className="card">
      <h2>Settings</h2>

      {error ? <p className="error">{error}</p> : null}

      <ul className="list">
        <li className="listRow">
          <div style={{ minWidth: 0 }}>
            <div className="listTitle">Vault location</div>
            <div className="mono hint" title={vaultPath}>
              {vaultPath}
            </div>
          </div>
          <button className="button" onClick={onChangeVault}>
            Change
          </button>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">Diagnostics</div>
            <div className="hint">(coming soon)</div>
          </div>
          <button className="button" disabled>
            Open
          </button>
        </li>
      </ul>

      {!isTauri() ? (
        <p className="hint">
          Running in browser dev mode; vault setting is stored in localStorage.
        </p>
      ) : null}
    </section>
  );
}
