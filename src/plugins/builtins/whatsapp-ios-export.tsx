import type { Plugin } from "../sdk";

function Instructions() {
  return (
    <div className="stack">
      <p className="hint">
        Import WhatsApp chat history via iOS “Export Chat”.
      </p>
      <ol className="list">
        <li className="listRow">
          <div>
            <div className="listTitle">1) Export chat</div>
            <div className="hint">
              In WhatsApp (iOS): chat → contact/group → Export Chat.
            </div>
          </div>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">2) Save files</div>
            <div className="hint">
              Save the export (ZIP or a folder containing a .txt and media).
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
        Designed WhatsApp viewer will live here (threads, search, media).
      </p>
    </section>
  );
}

export const whatsappIosExportPlugin: Plugin = {
  metadata: {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Import via iOS chat export (offline export).",
    icon: "💬"
  },
  Instructions,
  Viewer,
  importer: async () => {
    throw new Error("Not implemented yet (see Step 05)");
  },
  rawBrowserHints: {
    rootLabel: "WhatsApp raw export"
  }
};

