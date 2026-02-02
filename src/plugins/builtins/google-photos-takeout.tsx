import type { Plugin } from "../sdk";

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

function Viewer() {
  return (
    <section className="card">
      <h3>Viewer</h3>
      <p className="hint">
        Designed Google Photos viewer will live here (timeline, albums, etc.).
      </p>
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
  importer: async () => {
    throw new Error("Not implemented yet (see Step 05)");
  },
  rawBrowserHints: {
    rootLabel: "Google Photos raw export"
  }
};

