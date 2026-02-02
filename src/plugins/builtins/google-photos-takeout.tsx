import { useEffect, useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import type { Plugin } from "../sdk";
import { runImport } from "../../lib/import";
import {
  indexGooglePhotos,
  listGooglePhotosMedia,
  type GooglePhotosMediaItem
} from "../../lib/googlePhotos";

function Instructions() {
  return (
    <div className="stack">
      <p className="hint">
        Import Google Photos via a Google Takeout export.
      </p>
      <ol className="list">
        <li className="listRow">
          <div>
            <div className="listTitle">1) Create export</div>
            <div className="hint">In Google Takeout, select Google Photos.</div>
          </div>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">2) Download ZIPs</div>
            <div className="hint">
              Download the generated ZIP file(s) to your computer.
            </div>
          </div>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">3) Import</div>
            <div className="hint">Use the import wizard (Step 05).</div>
          </div>
        </li>
      </ol>
    </div>
  );
}

function Viewer({ pluginId: _pluginId }: { pluginId: string }) {
  const accountId = "default";
  const [items, setItems] = useState<GooglePhotosMediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const totalLabel = useMemo(() => {
    if (!items.length) return "(no items indexed yet)";
    return `${items.length} item(s) loaded`;
  }, [items.length]);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      // Re-index on demand (cheap enough for v1).
      await indexGooglePhotos(accountId);
      const list = await listGooglePhotosMedia({ accountId, limit: 200, offset: 0 });
      setItems(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="card">
      <h3>Gallery</h3>
      <p className="hint">{totalLabel}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button className="button" onClick={refresh} disabled={busy}>
          {busy ? "Indexing…" : "Re-index + Reload"}
        </button>
      </div>

      <div className="galleryGrid">
        {items.map((item) => {
          const src = convertFileSrc(item.path);
          const isImage = item.mimeType.startsWith("image/");
          return (
            <button
              key={item.id}
              className="galleryItem"
              title={item.filename}
              onClick={async () => {
                const { open } = await import("@tauri-apps/api/shell");
                open(item.path);
              }}
            >
              {isImage ? (
                <img className="thumb" src={src} alt={item.filename} />
              ) : (
                <video className="thumb" src={src} controls={false} />
              )}
              <div className="thumbLabel">{item.filename}</div>
            </button>
          );
        })}
      </div>

    </section>
  );
}

export const googlePhotosTakeoutPlugin: Plugin = {
  metadata: {
    id: "google-photos",
    name: "Google Photos",
    description: "Import via Google Takeout (offline export).",
    icon: "📷"
  },
  Instructions,
  Viewer,
  importer: async (context) => {
    const result = await runImport({
      pluginId: context.pluginId,
      accountId: context.accountId,
      displayName: context.displayName ?? null,
      sourcePath: context.sourcePath
    });

    // Build/update the SQLite index after importing.
    await indexGooglePhotos(context.accountId);
    return result;
  },
  rawBrowserHints: {
    rootLabel: "Google Photos raw export"
  }
};
