import { useEffect, useMemo, useState } from "react";
import { getPluginById } from "../plugins/registry";
import { navigate } from "../router/hash";
import {
  listenImportProgress,
  type ImportProgress,
  type RunImportResult
} from "../lib/import";
import { isTauri } from "../lib/vault";

type Props = {
  serviceId: string;
};

async function pickSource(kind: "file" | "folder"): Promise<string | null> {
  if (!isTauri()) {
    const value = window.prompt(
      kind === "file" ? "Path to file:" : "Path to folder:"
    );
    return value && value.trim() ? value.trim() : null;
  }

  const { open } = await import("@tauri-apps/api/dialog");
  const selected = await open({ directory: kind === "folder", multiple: false });
  if (!selected) return null;
  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="progress">
      <div className="progressInner" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function ImportWizardPage({ serviceId }: Props) {
  const plugin = getPluginById(serviceId);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [accountId, setAccountId] = useState("default");
  const [displayName, setDisplayName] = useState("Default");
  const [sourcePath, setSourcePath] = useState<string | null>(null);

  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [percent, setPercent] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    runId: string;
    logPath: string;
    accountRoot: string;
  } | null>(null);

  const title = useMemo(() => {
    if (!plugin) return "Import";
    return `Import — ${plugin.metadata.name}`;
  }, [plugin]);

  useEffect(() => {
    if (!plugin) return;
    // Default to the plugin name as a display label.
    setDisplayName((prev) => (prev === "Default" ? plugin.metadata.name : prev));
  }, [plugin]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listenImportProgress((event) => {
      const payload = event.payload;
      setProgress(payload);
      if (typeof payload.percent === "number") setPercent(payload.percent);
      setLogs((prev) => [...prev, `[${payload.phase}] ${payload.message}`]);
    }).then((u) => {
      unlisten = u;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    if (!plugin) return;
    if (!sourcePath) return;

    let cancelled = false;
    setError(null);
    setLogs([]);
    setProgress({ phase: "start", message: "Starting import…", percent: 0 });
    setPercent(0);
    setResultSummary(null);

    (async () => {
      try {
        const result = (await plugin.importer({
          pluginId: plugin.metadata.id,
          accountId,
          displayName,
          sourcePath
        })) as RunImportResult | null;

        if (cancelled) return;

        if (result) {
          setResultSummary({
            runId: result.runId,
            logPath: result.logPath,
            accountRoot: result.accountRoot
          });
        }
        setStep(4);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
        setLogs((prev) => [...prev, `[error] ${String(e)}`]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, plugin, sourcePath, accountId, displayName]);

  if (!plugin) {
    return (
      <section className="card">
        <h2>Unknown service</h2>
        <p className="hint">No built-in plugin with id “{serviceId}”.</p>
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
          <a href={`#/services/${plugin.metadata.id}`} className="link">
            {plugin.metadata.name}
          </a>
          <span className="breadcrumbsSep">/</span>
          <span>Import</span>
        </div>

        <h2>{title}</h2>
        <p className="hint">
          Wizard step {step} of 4. This is offline-only.
        </p>
      </section>

      {step === 1 ? (
        <section className="card">
          <h3>Step 1 — Instructions</h3>
          <plugin.Instructions pluginId={plugin.metadata.id} />
          <div className="actions">
            <button className="button" onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="card">
          <h3>Step 2 — Select Export</h3>
          <div className="form">
            <label className="field">
              <div className="fieldLabel">Account ID</div>
              <input
                className="input"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="default"
              />
            </label>

            <label className="field">
              <div className="fieldLabel">Display name</div>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={plugin.metadata.name}
              />
            </label>

            <div className="field">
              <div className="fieldLabel">Selected source</div>
              <div className="mono hint">{sourcePath ?? "(none)"}</div>
            </div>
          </div>

          <div className="actions">
            <button
              className="button"
              onClick={async () => {
                const chosen = await pickSource("file");
                if (chosen) setSourcePath(chosen);
              }}
            >
              Choose file
            </button>
            <button
              className="button"
              onClick={async () => {
                const chosen = await pickSource("folder");
                if (chosen) setSourcePath(chosen);
              }}
            >
              Choose folder
            </button>
          </div>

          <div className="actions">
            <button className="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="button"
              disabled={!sourcePath || !accountId.trim()}
              onClick={() => setStep(3)}
            >
              Start import
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="card">
          <h3>Step 3 — Importing…</h3>
          {error ? <p className="error">{error}</p> : null}
          <ProgressBar percent={percent} />
          <div className="hint">
            {progress ? `${progress.phase}: ${progress.message}` : "…"}
          </div>
          <pre className="logBox">{logs.join("\n")}</pre>
          <div className="actions">
            <button className="button" disabled>
              Cancel (coming soon)
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="card">
          <h3>Step 4 — Done</h3>
          <p className="hint">Import finished successfully.</p>
          {resultSummary ? (
            <div className="kv">
              <div className="kvKey">Log</div>
              <div className="kvValue mono">{resultSummary.logPath}</div>
            </div>
          ) : null}
          <div className="actions">
            <button
              className="button"
              onClick={() => navigate(`/services/${plugin.metadata.id}`)}
            >
              Back to service
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
