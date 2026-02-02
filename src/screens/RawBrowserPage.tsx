import { useEffect, useMemo, useState } from "react";
import { getPluginById } from "../plugins/registry";
import { listRawTree, openInOs, readTextFile, type RawEntry } from "../lib/raw";
import { navigate } from "../router/hash";

type Props = {
  serviceId: string;
  accountId: string;
  subdir?: string;
};

function joinPath(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return `${a.replace(/\/+$/, "")}/${b.replace(/^\/+/, "")}`;
}

function parentDir(path?: string): string | null {
  if (!path) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function isImage(name: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
}

function isText(name: string): boolean {
  return /\.(txt|json|csv|md|log)$/i.test(name);
}

export default function RawBrowserPage({ serviceId, accountId, subdir }: Props) {
  const plugin = getPluginById(serviceId);
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<RawEntry | null>(null);
  const [textPreview, setTextPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const currentDir = subdir ?? "";

  const title = useMemo(() => {
    const base = plugin?.metadata.name ?? serviceId;
    return `Raw Files — ${base}`;
  }, [plugin, serviceId]);

  useEffect(() => {
    setSelected(null);
    setTextPreview("");
  }, [serviceId, accountId, currentDir]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listRawTree({ pluginId: serviceId, accountId, subdir: currentDir })
      .then((result) => {
        if (cancelled) return;
        setEntries(result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, accountId, currentDir]);

  useEffect(() => {
    if (!selected) return;
    if (selected.isDir) return;

    if (isText(selected.name)) {
      readTextFile({
        pluginId: serviceId,
        accountId,
        relPath: selected.path,
        maxBytes: 256 * 1024
      })
        .then(setTextPreview)
        .catch(() => setTextPreview("(Failed to load preview)"));
    } else {
      setTextPreview("");
    }
  }, [selected, serviceId, accountId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, filter]);

  if (!plugin) {
    return (
      <section className="card">
        <h2>Unknown service</h2>
        <p className="hint">No built-in plugin with id “{serviceId}”.</p>
      </section>
    );
  }

  const backDir = parentDir(currentDir);

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
          <span>Raw</span>
        </div>
        <h2>{title}</h2>
        <p className="hint">
          Account: <span className="mono">{accountId}</span>
        </p>
        <div className="kv">
          <div className="kvKey">Folder</div>
          <div className="kvValue mono">/{currentDir || ""}</div>
        </div>
      </section>

      <section className="card">
        <div className="rawToolbar">
          <input
            className="input"
            placeholder="Filter by filename…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            className="button"
            onClick={() => {
              navigate(`/services/${plugin.metadata.id}`);
            }}
          >
            Back
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="rawGrid">
          <div className="rawList">
            <div className="actions">
              <button
                className="button"
                disabled={backDir === null}
                onClick={() =>
                  navigate(
                    `/services/${plugin.metadata.id}/raw/${accountId}/${backDir ?? ""}`
                  )
                }
              >
                Up
              </button>
              <button
                className="button"
                disabled={!currentDir}
                onClick={() =>
                  navigate(`/services/${plugin.metadata.id}/raw/${accountId}/`)
                }
              >
                Root
              </button>
            </div>

            <ul className="fileList">
              {filtered.map((e) => (
                <li
                  key={e.path}
                  className={`fileRow ${selected?.path === e.path ? "fileRowActive" : ""}`}
                  onClick={() => setSelected(e)}
                  onDoubleClick={() => {
                    if (e.isDir) {
                      const next = joinPath(currentDir, e.name);
                      navigate(
                        `/services/${plugin.metadata.id}/raw/${accountId}/${next}`
                      );
                    } else {
                      openInOs({
                        pluginId: plugin.metadata.id,
                        accountId,
                        relPath: e.path
                      }).catch(() => {});
                    }
                  }}
                >
                  <span className="fileIcon">{e.isDir ? "📁" : "📄"}</span>
                  <span className="fileName">{e.name}</span>
                </li>
              ))}
              {filtered.length === 0 ? (
                <li className="hint">(empty)</li>
              ) : null}
            </ul>
          </div>

          <div className="rawPreview">
            {!selected ? (
              <div className="hint">Select a file to preview.</div>
            ) : selected.isDir ? (
              <div>
                <div className="listTitle">{selected.name}</div>
                <p className="hint">Folder</p>
                <div className="actions">
                  <button
                    className="button"
                    onClick={() => {
                      const next = joinPath(currentDir, selected.name);
                      navigate(
                        `/services/${plugin.metadata.id}/raw/${accountId}/${next}`
                      );
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="listTitle">{selected.name}</div>
                <div className="hint mono">{selected.path}</div>
                <div className="actions">
                  <button
                    className="button"
                    onClick={() =>
                      openInOs({
                        pluginId: plugin.metadata.id,
                        accountId,
                        relPath: selected.path
                      })
                    }
                  >
                    Open
                  </button>
                </div>

                {isImage(selected.name) ? (
                  <p className="hint">
                    Image preview not implemented yet (needs file-to-bytes API).
                  </p>
                ) : null}

                {isText(selected.name) ? (
                  <pre className="logBox">{textPreview || "…"}</pre>
                ) : !isImage(selected.name) ? (
                  <p className="hint">No preview for this file type.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <p className="hint">
          Note: “Reveal in Finder/Explorer” is currently implemented as “Open”.
        </p>
      </section>
    </div>
  );
}

